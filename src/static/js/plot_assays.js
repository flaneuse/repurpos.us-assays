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

var current_page = 0;

// -- Determine sizing for plot
min_height = 50; // number of pixels per drug in dot plot

// --- Setup margins for svg object
var margin = {
  top: 50,
  right: 40,
  bottom: 15,
  left: 150
}


bufferH = 75; // number of pixels to space between vis and nav bar + bottom
container = d3.select('.container').node().getBoundingClientRect();
windowH = window.innerHeight;
// Available starting point for the visualization
nav_container = d3.select('.nav-tabs').node().getBoundingClientRect();
maxW = nav_container.width;

// Set max height to be the entire height of the window, minus top/bottom buffer
maxH = windowH - nav_container.bottom - bufferH;
maxH = maxH * 0.85;

var num_per_page = Math.round((maxH - margin.top) / min_height);


// ---- Create structure for the table ----

// Outer selector for the entire table
cmpds = d3.select('#assay_table')

var width = maxW - margin.left - margin.right,
  height = maxH - margin.top - margin.bottom;


// --- Create axes for dot plot ---
// var x = d3.scaleLinear()
var x = d3.scaleLog()
  .rangeRound([0, width]);

var y = d3.scaleBand()
  .rangeRound([0, height])
  .paddingInner(0.05)
  .paddingOuter(0.1);

// colorScale requires a sequential scale + associated interpolator. Unfortunately, that means the log-transform of the color needs to be manually specified.
var colorScale = d3
  .scaleSequential(d3.interpolateGnBu);
  // The other option is to use a logScale; however, to specify the interpolation goes between more than 2 colors,the domain also needs to contain that number of elements.
  // TODO: maybe convert back to a simpler scaleLog?
  // .scaleLinear()
  // .range(["#2c7bb6", "#00a6ca", "#00ccbc", "#90eb9d", "#ffff8c", "#f9d057", "#f29e2e", "#e76818", "#d7191c"])
  // .interpolate(d3.interpolateHcl);

var xAxis = d3.axisTop(x)
  .ticks(6, '.0e')

var yAxis = d3.axisLeft(y)
  // .ticks(0)
  .tickSize(-width)

// --- Helper functions ---
// Determing whether the assay measures IC50 or EC50 values.
function findMode(assay_type) {
  var assay_type = assay_type.toLowerCase();

  var mode;

  switch (assay_type) {
    case 'decreasing':
      mode = 'IC';
      break;

    case 'increasing':
      mode = 'EC';
      break;

    default:
      mode = 'unknown';
      break;
  }

  return mode;
}

// Create square rollover window, with dimensions 60% of the entire window
var struct_fraction = 0.6;
var struct_size = Math.max((width + margin.left + margin.right) * struct_fraction,
  (height + margin.top + margin.bottom) * struct_fraction,
  350);


// --- Load data, populate table ---
d3.csv('/static/demo_data.csv', function(error, assay_data) {


  // -- DATA MANIPULATION --
  // filter out just those for the particular assay
  // // filter values if NA (don't display)
  assay_data = assay_data
    .filter(function(d, i) {
      return d.genedata_id != assay_id && d.ac50;
    })

  // convert numbers to numbers
  assay_data.forEach(function(d, i) {
    d.assay_val = +d.ac50;
    d.page_num = Math.floor(i / num_per_page);
  })

  // console.log(assay_data)

  // TODO: figure out how to prevent data from reloading at every page.

  // nest; calculate averages for the same drug.
  nested = d3.nest()
    .key(function(d) {
      return d.calibr_id
    })
    .rollup(function(v) {
      return {
        num_cmpds: v.length,
        avg: d3.mean(v, function(d) {
          return d.assay_val;
        }),
        assay_vals: v.map(function(d) {
          return d.assay_val;
        }),
        datamode: v.map(function(d) {
          return d.datamode;
        }),
        wikidata: v.map(function(d) {
          if (d.wikidata) {
            return d.wikidata;
          }
        }),
        pubchem_id: v.map(function(d) {
          if (d['PubChem CID']) {
            return d['PubChem CID'].replace('CID', ''); // remvoe extra ID string.
          }
        }),
        name: v.map(function(d) {
          if (d.pubchem_label) {
            return d.pubchem_label;
          } else {
            return d.calibr_id;
          }
        })
      };
    })
    .entries(assay_data)
    // Sort by the average values
    .sort(
      function(a, b) {
        return a.value.avg - b.value.avg;
      });


  nested
    // Calculate page numbers; remove duplicate values that came along for the ride.
    // TODO: figure out if there's a less kludgey way to do this. Also check if the rollup has the same values.
    .forEach(function(d, i) {
      d.page_num = Math.floor(i / num_per_page);
      d.value.assay_type = findMode(d.value.datamode[0]);
      d.value.name = d.value.name[0];
      d.value.wikidata = d.value.wikidata[0];
      d.value.pubchem_id = d.value.pubchem_id[0];

    })
  console.log(nested)

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
  // `return d.assay_val || Infinity;` argument ignores values that are NA / 0; deleted in favor of filtering them from the table to start.
  // NOTE: Calculate x-domain based on the limits of the *entire* data series, not the filtered data.

  var maxVal = d3.max(nested, function(d) {
    return d3.max(d.value.assay_vals);
  });

  var minVal = d3.min(nested, function(d) {
    return d3.min(d.value.assay_vals)
  });

  x.domain([maxVal, minVal]);

  // Code if using d3.scaleLog
  // var numColors = colorScale.range().length;
  //
  // colorScale.domain(d3.range(Math.log10(maxVal),
  //   Math.log10(minVal),
  //   (Math.log10(maxVal) - Math.log10(minVal)) / numColors
  // ));

  // Code if using d3.scaleSequential
  colorScale.domain([Math.log10(d3.max(nested, function(d) {
      return d3.max(d.value.assay_vals);
    })),
    Math.log10(d3.min(nested, function(d) {
      return d3.min(d.value.assay_vals);
    }))
  ]);


  // Filter data to be only those compounds that exist on the current page.
  var filtered_data = nested.filter(function(d) {
    return d.page_num == current_page
  });


  // Set y-domain
  // TODO: remove dupes in names
  y.domain(filtered_data.map(function(d) {
    // return [...new Set(d.value.name)];
    return d.value.name;
  }));


  // function generateTable(current_page) {



  // (1) Compound name (TODO: clean up chemical names)
  //   names = rows.append('td#names')
  //
  //
  //   names
  //     // .selectAll('#link')
  //     // .data(function(d) {
  //     //   return d.value;
  //     // })
  //     .append('a#link')
  //     .attr('href', function(d) {
  //       if (d.wikidata) {
  //         return drug_url + d.wikidata;
  //       } else {
  //         return null;
  //       }
  //     })
  //     .text(function(d) {
  //       if (d.pubchem_label) {
  //         return d.pubchem_label;
  //       } else {
  //         return d.calibr_id;
  //       }
  //     })
  // // }
  //
  // generateTable(0);

  // (3) -- DRAW PLOTS --
  // Bind SVG object to each td
  d3.select("#dotplot-container")
    .append('svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g#dotplot")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  dotplot = d3.selectAll('#dotplot');

  svg = d3.selectAll('svg')

  // -- SCALEBAR --
  var scalebar = dotplot.append("g#scalebar");

  // scalebar based on https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient.html
  var defs = svg.append('defs');
  var linearGradient = defs.append('linearGradient')
    .attr('id', 'linear-gradient')
    // horizontal gradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");


  //Append multiple color stops by using D3's data/enter step
  colorRange = d3.schemeGnBu[9];
  // colorRange = colorScale.range();
  linearGradient.selectAll("stop")
    .data(colorRange)
    .enter().append("stop")
    .attr("offset", function(d, i) {
      return i / (colorRange.length - 1);
    })
    .attr("stop-color", function(d) {
      return d;
    });

  //Draw the rectangle and fill with gradient
  scalebar.append("rect")
    .attr("width", width)
    .attr("height", 10)
    .attr("transform", "translate(0, -" + margin.top + ")")
    .style("fill", "url(#linear-gradient)");

  scalebar.append("text")
    .attr("class", "annotation-right annotation--x")
    .attr("transform", "translate(" + width + ", -" + "15" + ")")
    .text("more potent")

  scalebar.append("text")
    .attr("class", "annotation-left annotation--x")
    .attr("transform", "translate(" + 0 + ", -" + "15" + ")")
    .text("less potent")

  // -- AXES --
  dotplot.append("g")
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


  dotplot.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);
  // .call(d3.axisLeft(y).ticks(2, 'f')) // display y-axis, for testing purposes

  // -- DOTS --
  var dot_grp = dotplot.append("g#graph")
    .selectAll(".avg")
    .data(filtered_data)
    .enter().append("g.dots")
    .attr("id", function(d) {
      return d.value.name;
    });


  // -- avg. value --
  dot_grp.append("circle.assay-avg")
    // .at('cx', compose(x, ƒ('value.avg')))
    .attr('cx', function(d) {
      return x(d.value.avg)
    })
    .attr('cy', function(d) {
      return y(d.value.name) + y.bandwidth() / 2;
    })
    .style('fill', function(d) {
      return colorScale(Math.log10(d.value.avg));
    })
    .attr('r', dot_size);

  // --- not avg. value ---

  // console.log(dot_grp.data())

  var circles = dot_grp.selectAll(".assay-val") // start a nested selection
    .data(function(d, i) {
      // console.log(d)
      // var filtered = d.filter(function(e) {
      //   return e.value.num_cmpds > 1;
      // })
      //

      if (d.value.num_cmpds > 1) {
        // only return values if there are more than one compound;
        return d.value.assay_vals;
      } else {
        return '';
      }
    })
    .enter().append("circle.assay-val")
    .attr('cx', function(d, i) {
      return x(d);
    })
    .attr('cy', function(d) {
      return y(this.parentNode.id) + y.bandwidth() / 2;;
    })
    .attr('r', dot_size * 0.75);

  // // dot plots of values
  // dots.append('text.val-annot')
  //   .attr("dominant-baseline", "middle")
  //   .text(function(d) {
  //     return d3.format(".1e")(d.assay_val);
  //   })
  //   .attr('x', function(d) {
  //     return x(d.assay_val) + dot_size * 1.75;
  //   })
  //   .attr('y', y(0.5));
  //

  //   Structure rollover
  var struct = d3.select("#dotplot-container")
    .append('div')
    .attr('id', 'structs')
    // .attr("width", struct_size)
    // .attr("height", struct_size)
    .style('background', 'aliceblue')
    .style('opacity', 0);

  struct.append('h4')
    .attr('id', 'rollover-name')

  struct.append('img#structure')
    .attr("width", '100%')
    .attr("height", '100%')

  struct.append('ul#rollover-avg');

  struct.append('ul#rollover-indiv');

  // Rollover behavior
  d3.selectAll('text').on('mouseover', function() {
    showStruct(this.textContent);
  })

  d3.selectAll('text').on('mouseout', function() {
    hideStruct();
  })

  function showStruct(cmpd_name) {
    // turn on structure

    struct.style('opacity', 1);

    // bind data to structure fields
    var filtered = nested.filter(function(d) {
      return d.value.name == cmpd_name;
    });

    // Name of compound
    struct.selectAll('#rollover-name')
      .data(filtered)
      .text(function(d) {
        return d.value.name;
      });

    // Hypothesis: have to rebind the data to every element, since the children were declared before the data were bound. Therefore data doesn't inherit.
    // change structure URL
    // if (filtered.value.pubchem_id){
    struct.selectAll('#structure')
      .data(filtered)
      .attr("src", function(d) {
        if (d.value.pubchem_id) {
          return struct_url1 + d.value.pubchem_id + struct_url2;
        }
      })
      .style('opacity', function(d) {
        if (d.value.pubchem_id) {
          return 1;
        } else {
          return 0;
        }
      })


    // Avg. value
    struct.selectAll('#rollover-avg')
      .data(filtered)
      .attr('class', 'rollover-avg')
      .html(function(d) {
        return 'average ' + d.value.assay_type + '<sub>50</sub>: ' + d3.format(".1e")(d.value.avg);
      })

    // Individual. value
    struct.selectAll('#rollover-indiv')
      .data(filtered.filter(function(d) {
        return d.value.num_cmpds > 1;
      }))
      .selectAll('li')
      .data(function(d) {
        return d.value.assay_vals;
      })
      .enter().append('li.rollover-indiv')
      .text(function(d) {
        return d3.format(".1e")(d)
      })

  }


  function hideStruct() {
    struct.style('opacity', 0);

    struct.selectAll('#structure').exit().remove();

    struct.selectAll('li').remove()
  }


}); // ---- END OF CSV IMPORT
