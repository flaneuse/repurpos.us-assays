// ---- Constants ----
// URL stubs
// For repurpos.us URLs, hidden under /compound_data:
// ex.: https://repurpos.us/#/compound_data/Q10859697
var drug_url = 'https://repurpos.us/#/compound_data/';

var struct_url1 = 'https://pubchem.ncbi.nlm.nih.gov/image/imagefly.cgi?cid=';
var struct_url2 = '&width=500&height=500';
var struct_url3 = 'https://pubchem.ncbi.nlm.nih.gov/image/fl.html?cid=60961' // within their viewer
var dot_size = 5;

var assay_id = 'A00215';

var num_per_page = 22;

// var current_page = 0;

// ---- Create structure for the table ----

// Outer selector for the entire table
cmpds = d3.select('#assay_table')

// --- Create header ---
header = cmpds.append('tr#table_header');

// Note: it'd obviously be better to pull these directly from the dataset itself.
// However: some columns are necessary, but shouldn't be displayed as data (e.g. the compound ID)

header.append('th')
  .text('compound')

header.append('th')
  .text('EC/IC')

header.append('th')
  .text('assay data')

header.append('th')
  .text('structures')

// --- Setup margins for each svg object
var margin = {
    top: 20,
    right: 40,
    bottom: 5,
    left: 5
  },
  width = 350 - margin.left - margin.right,
  height = 70 - margin.top - margin.bottom;


// --- Create axes for dot plot ---
// var x = d3.scaleLinear()
var x = d3.scaleLog()
  .rangeRound([0, width]);

var y = d3.scaleLinear()
  .rangeRound([height, 0]);

var xAxis = d3.axisTop(x)
  .ticks(6, '.0e')

var yAxis = d3.axisLeft(y)
  .ticks(0)
  .tickSize(0)


// --- Load data, populate table ---
d3.csv('/static/demo_data.csv', function(error, assay_data) {


  // -- DATA MANIPULATION --
  // filter out just those for the particular assay
  // // filter values if NA (don't display)
  assay_data = assay_data
    .filter(function(d, i) {
      return d.genedata_id != assay_id && d.ac50;
    })
    // sort from low to high
    .sort(function(a, b) {
      return a.ac50 - b.ac50;
    });


  // convert numbers to numbers
  assay_data.forEach(function(d, i) {
    d.val = +d.ac50;
    d.page_num = Math.floor(i / num_per_page);
  })


  // TODO: figure out how to prevent data from reloading at every page.
  console.log(assay_data)

  // nest; calculate averages for the same drug.

  a1 = d3.nest()
    .key(function(d) {
      return d.calibr_id
    })
    .rollup(function(v) {
      return {
        num_cmpds: v.length,
        avg: d3.mean(v, function(d) {
          return d.val;
        }),
        vals: v.map(function(d) {
          return d.val;
        }),
        datamode: v.map(function(d) {
          return d.datamode;
        }),
        wikidata: v.map(function(d) {
          return d.wikidata;
        }),
        name: v.map(function(d) {
          return d.pubchem_label;
        })
      };
    })
    .entries(assay_data)

  a1.forEach(function(d, i) {
    d.page_num = Math.floor(i / num_per_page);
  })
  console.log(a1)

  // -- PAGINATION --
  // calculate length of filtered data to generate pagination
  num_cmpds = assay_data.length;

  num_pages = Math.ceil(num_cmpds / num_per_page);

  // generate blank
  var pages = Array(num_pages).fill(0)
  pages[0] = 1 // Set the initial page to 1.

  pg = d3.select(".pagination");

  pg.selectAll("li")
    .data(pages)
    .enter().append("li.page").append('a.page-link')
    .attr('href', '#')
    .text(function(d, i) {
      return i + 1;
    })
    .classed('page-selected', function(d) {
      return d
    })

    function updatePage(idx) {

      pg.selectAll(".page-link")
      .classed('page-selected', function(d, i) {
        return i == idx
      })

      generateTable(idx)
    }

  // EVENT: on clicking breadcrumb, change the page. -----------------------------
  pg.selectAll(".page-link").on("click", function(d, i) {

    selected_page = this.text - 1;

    updatePage(selected_page);
  });
  // end of PAGINATION ------------------------------------------------------------

  // -- BIND DATA TO AXES --
  // x.domain(data.map(function(d) { return d.letter; }));
  // `return d.val || Infinity;` argument ignores values that are NA / 0; deleted in favor of filtering them from the table to start.
  x.domain([d3.max(assay_data, function(d) {
      return d.val;
    }),
    d3.min(assay_data, function(d) {
      return d.val;
    })
  ]);

function generateTable(current_page){
  // -- TABLE GENERATION --
  // Populate table w/ rows specified by data
  rows = cmpds.selectAll('#table_rows')
    // .data(a1)
    .data(assay_data.filter(function(d) {
      return d.page_num == current_page
    }))
    .enter().append('tr#table_rows')


  // (1) Compound name (TODO: clean up chemical names)
  names = rows.append('td#names')


  names
    // .selectAll('#link')
    // .data(function(d) {
    //   return d.value;
    // })
    .append('a#link')
    .attr('href', function(d) {
      if (d.wikidata) {
        return drug_url + d.wikidata;
      } else {
        return null;
      }
    })
    .text(function(d) {
      if (d.pubchem_label) {
        return d.pubchem_label;
      } else {
        return d.calibr_id;
      }
    })

  // (2) data mode (IC vs. EC)
  rows.append('td')
    .text(function(d) {
      return d.datamode;
    })
}

generateTable(0);

  // (3) -- DRAW PLOTS --
  // Bind SVG object to each td
  sparklines = rows.append('td.sparklines')
    .append('svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  g = d3.selectAll('g')

  svg = d3.selectAll('svg')

  g.append("g")
    .attr("class", "axis axis--x")
    .attr('id', function(d, i) {
      if (i == 0) {
        return 'show-axis';
      } else {
        return 'hide-axis';
      };
    })
    // .attr("transform", "translate(0," + height + ")") // puts at the bottom of the svg
    .attr("transform", "translate(0, -1)") // puts at the bottom of the svg
    .call(xAxis)
    .selectAll(".tick")
    .data(x.ticks(3), function(d) {
      return d;
    }) // create a secondary set of ticks for minor scale; pulled from http://blockbuilder.org/mbostock/4349486
    .exit()
    .classed("minor", true);


  g.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);
  // .call(d3.axisLeft(y).ticks(2, 'f')) // display y-axis, for testing purposes

  // dot plots of values
  dots = g.selectAll('circle')
    .data(function(d, i) {
      return [assay_data[i]];
    })
    .enter()
    .append('g')

  dots.append('circle.assay-avg')
    .attr('cx', function(d) {
      return x(d.val);
    })
    .attr('cy', y(0.5))
    .attr('r', dot_size);

  // dot plots of values
  dots.append('text.val-annot')
    .attr("dominant-baseline", "middle")
    .text(function(d) {
      return d3.format(".1e")(d.val);
    })
    .attr('x', function(d) {
      return x(d.val) + dot_size * 1.75;
    })
    .attr('y', y(0.5));

  // (4) add chemical structures
  rows.append('td')
    .append('svg').append('image.structs')
    .attr('xlink:href', '/static/img/tmx.png')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 100)
    .attr('height', 100)






}); // ---- END OF CSV IMPORT
