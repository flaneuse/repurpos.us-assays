// ---- Constants ----
// URL stubs
// For repurpos.us URLs, hidden under /compound_data:
// ex.: https://repurpos.us/#/compound_data/Q10859697
var drug_url = 'https://repurpos.us/#/compound_data/';

var dot_size = 5;

var assay_title = d3.select('.assay-title').text();
var assay_id = d3.select('.assay-id').text();

var current_page = 0;

// -- Determine sizing for plot
min_plot_height = 400; // For smaller screens; if the size of the plot is too small, make the SVG the size of the entire window (more or less)
min_height = 50; // number of pixels per drug in dot plot
struct_height = 320; // empirically determined height of entire structure container, based on structure height of 150 px (since includes table as well)
struct_width = 200; // width of structure, based on image.

// --- Setup margins for svg object
var margin = {
  top: 55,
  right: 40,
  bottom: 0,
  left: 160
}

bufferH = 0.85; // Scalar to shrink the maximum available height by
container = d3.select('.container').node().getBoundingClientRect();
windowH = window.innerHeight;
// Available starting point for the visualization
nav_container = d3.select('.nav-tabs').node().getBoundingClientRect();
maxW = nav_container.width;

// Set max height to be the entire height of the window, minus top/bottom buffer
maxH = windowH - nav_container.bottom;
maxH = maxH * bufferH;

// For small screens: draw the plot as big as the screen will allow
if (maxH < min_plot_height) {
    maxH = (windowH - nav_container.height) * bufferH;
}


var num_per_page = Math.round((maxH - margin.top) / min_height);


// ---- Create structure for the table ----

var width = maxW - margin.left - margin.right,
  height = maxH - margin.top - margin.bottom;


// --- Create axes for dot plot ---
// var x = d3.scaleLinear()
var x = d3.scaleLog()
  .rangeRound([0, width]);

var y = d3.scaleBand()
  .rangeRound([0, height])
  .paddingInner(0.05)
  .paddingOuter(0.35);

// helper to get height in pixels based on the index value.
function yByIdx(i) {
  return i * y.step() + y.step() * y.paddingOuter() + y.step() / 2;
}

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
  .ticks(0);

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

function find_url(d) {
  if (d.value.wikidata) {
    return drug_url + d.value.wikidata;
  } else {
    return null;
  }
}

function remove_symbols(d) {
  return "_" + d.replace(/ /g, "").replace(/-/g, "").replace(/'/g, "").replace(/,/g, "");
}

// Create square rollover window, with dimensions 60% of the entire window
var struct_fraction = 0.6;
var struct_size = Math.max((width + margin.left + margin.right) * struct_fraction,
  (height + margin.top + margin.bottom) * struct_fraction,
  350);

// PRE-DATA DECLARATIONS & SELECTORS
// Create empty containers, to be populated when data are called.

//   -- structures (empty container) --
var struct = d3.select("#dotplot-container")
  .append('div')
  .attr('id', 'structs')
  .style('opacity', 0.75)
  .style('display', 'none');


struct.append('img#structure')
  .attr("width", '75%')
  .attr("height", '75%')

struct.append('h5')
  .attr('id', 'struct-name')

let table_tooltip = struct.append('table');
let header_tooltip = table_tooltip.append('thead').append('tr#data-headers');
let indiv_tooltip = table_tooltip.append('tbody#rollover-indiv');

header_tooltip.append('th#rollover-avgtitle');
header_tooltip.append('th#rollover-avg');


//  -- pagination --
var pg = d3.select(".pagination");

//  -- svg --
d3.select("#dotplot-container")
  .append('svg')
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g#dotplot")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var dotplot = d3.selectAll('#dotplot');

// -- dot plot --
var dp = dotplot.append("g#graph")

// -- dot plot rollover hyperlinks --
var linksContainer = dotplot.append('g#rect-links')

// -- color scalebar --
var scalebar = dotplot.append("g#scalebar");

// scalebar based on https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient.html
var defs = dotplot.append('defs');
var linearGradient = defs.append('linearGradient')
  .attr('id', 'linear-gradient')
  // horizontal gradient
  .attr("x1", "0%")
  .attr("y1", "0%")
  .attr("x2", "100%")
  .attr("y2", "0%");


// Append multiple color stops by using D3's data/enter step
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

// Draw the rectangle and fill with gradient
scalebar.append("rect#scalebar")
  .attr("width", width)
  .attr("height", 10)
  .attr("transform", "translate(0, -" + margin.top + ")")
  .style("fill", "url(#linear-gradient)");

scalebar.append("text")
  .attr("class", "annotation-right annotation--x")
  .attr("transform", "translate(" + width + ", -" + "20" + ")")
  .text("more potent")

scalebar.append("text")
  .attr("class", "annotation-left annotation--x")
  .attr("transform", "translate(" + 0 + ", -" + "20" + ")")
  .text("less potent")

// y-axis selector
var cmpds = dotplot.append('g#y-links')
  .attr('transform', 'translate(-6, 0)');


// !! DATA DEPENDENT SECTION
// --- Load data, populate vis ---
d3.csv('/static/assay_data.csv', function(error, raw_assay_data) {

  // -- DATA MANIPULATION --
  // filter out just those for the particular assay
  // filter values if NA (don't display)
  // TODO: figure out how to prevent data from reloading at every page.
  assay_data = raw_assay_data
    .filter(function(d, i) {
      return d.genedata_id == assay_id && d.ac50;
    })

  // convert numbers to numbers
  assay_data.forEach(function(d, i) {
    d.assay_val = +d.ac50;
  })
  // console.log(assay_data)

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
        max: d3.max(v, function(d) {
          return d.assay_val;
        }),
        min: d3.min(v, function(d) {
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

  // Remove duplicate values that came along for the ride.
  nested
    // TODO: figure out if there's a less kludgey way to do this. Also check if the rollup has the same values.
    .forEach(function(d, i) {
      d.value.assay_type = findMode(d.value.datamode[0]);
      d.value.name = d.value.name[0];
      d.value.wikidata = d.value.wikidata[0];
      d.value.pubchem_id = d.value.pubchem_id[0];

    })
  // console.log(nested)

  // -- BIND DATA TO AXES --
  // `return d.assay_val || Infinity;` argument ignores values that are NA / 0; deleted in favor of filtering them from the table to start.
  // NOTE: Calculating x-domain based on the limits of the *entire* data series, not the filtered data (by page, or by EC/IC).

  var maxVal = d3.max(nested, function(d) {
    return d3.max(d.value.assay_vals);
  });

  var minVal = d3.min(nested, function(d) {
    return d3.min(d.value.assay_vals)
  });

  // update x domain
  x.domain([maxVal, minVal]);

  // Code if using d3.scaleLog
  // var numColors = colorScale.range().length;
  //
  // colorScale.domain(d3.range(Math.log10(maxVal),
  //   Math.log10(minVal),
  //   (Math.log10(maxVal) - Math.log10(minVal)) / numColors
  // ));

  // update color domain
  // Code if using d3.scaleSequential
  colorScale.domain([Math.log10(d3.max(nested, function(d) {
      return d3.max(d.value.assay_vals);
    })),
    Math.log10(d3.min(nested, function(d) {
      return d3.min(d.value.assay_vals);
    }))
  ]);

  // DRAW DATA-DEPENDENT ELEMENTS THAT DON'T GET UPDATED -----------------------

  // -- X-AXES --
  dotplot.append("g")
    .attr("class", "axis axis--x")
    // .attr("transform", "translate(0," + height + ")") // puts at the bottom of the svg
    .attr("transform", "translate(0, -1)") // puts at the bottom of the svg
    .call(xAxis)
    .selectAll(".tick")
    .data(x.ticks(3), function(d) {
      return d;
    }) // create a secondary set of ticks for minor scale; pulled from http://blockbuilder.org/mbostock/4349486
    .exit()
    .classed("minor", true);


  // -- PILLS -- : display IC50/EC50 tabs if warranted
  // var assay_types = [... new Set(nested.map(function(d) { return d.value.assay_type}))];
  var assay_types = nested.map(function(d) {
    return d.value.assay_type
  });

  // <<< count_types(array, type) >>>
  function count_types(array, type) {
    counter = 0;

    for (var i = 0; i < array.length; i++) {
      if (array[i] === type) {
        counter++;
      }
    }
    return counter;
  }

  var ic_count = count_types(assay_types, 'IC');
  var ec_count = count_types(assay_types, 'EC');

  // count number of occurrences of each assay type.
  // assay_types = d3.nest()
  // .key(function(d) {return d})
  // .rollup(function(d) { return d.length;})
  // .entries(assay_types);

  var current_tab;
  var tabs = d3.select('#tabs');



  if (assay_types.includes('IC')) {
    tabs.append('li.nav-item')
      .append('a.nav-link')
      .attr('id', 'IC')
      .attr('data-toggle', 'tab')
      .attr('role', 'tab')
      .html('IC<sub>50</sub>');
  }

  if (assay_types.includes('EC')) {
    tabs.append('li.nav-item')
      .append('a.nav-link')
      .attr('id', 'EC')
      .attr('data-toggle', 'tab')
      .attr('role', 'tab')
      .html('EC<sub>50</sub>');
  }

  // set current tab to be the larger of the number of IC/EC measurements.
  if (ec_count > ic_count) {
    current_tab = 'EC';

    tabs.select('#EC').classed('active', true);
  } else {
    current_tab = 'IC';

    tabs.select('#IC').classed('active', true);
  }
  // end of PAGINATION ----
  // END FIXED BUT DATA DEPENDENT ELEMENTS -----

  // MAIN FUNCTION TO DRAW PLOT --------------------------------------------------
  function draw_plot(current_page, current_tab) {
    // Filter data to be only those compounds that exist on the current page and current tab
    // NOTE: needs to be a 2-stage filter, to avoid situations where IC and EC data are mixed together.
    var data_currmethod = nested.filter(function(d) {
      return d.value.assay_type == current_tab;
    })

    var data_currpage = data_currmethod.filter(function(d, i) {
      return Math.floor(i / num_per_page) == current_page;
    });

    // console.log(data_currpage)

    // -- PAGINATION --
    // calculate length of filtered data to generate pagination
    num_cmpds = data_currmethod.length;

    num_pages = Math.ceil(num_cmpds / num_per_page);

    // generate blank array for the object.
    var pages = Array(num_pages).fill(0)
    pages[0] = 1 // Set the initial page to 1.

    // Join parent
    var pgButton = pg.selectAll("li")
      .data(pages);

    // clear parent:
    pgButton.exit().remove();

    // child selector
    var pgLink = pgButton.select('.page-link');

    // enter/append parent
    var pgEnter = pgButton
      .enter().append("li.page");

    // append child link
    var pgLinkEnter = pgEnter.append('a.page-link')
      .attr('href', '#');

    pgLink.merge(pgLinkEnter)
      .text(function(d, i) {
        return i + 1;
      })
      .classed('page-selected', function(d, i) {
        return i == current_page
      })

    // Initiate the .on click behavior. Necessary if pages have been deleted and then re-added.
    pagination_on();


    // Set y-domain; required to be within draw function, since changes each time.
    // (TODO: clean up chemical names)
    y.domain(data_currpage.map(function(d) {
      return d.value.name;
    }));




    // --- REDRAW Y-AXIS as text annotations, not axis, to link to repurpos.us page for each compound ---
    // NOTE: necessary, since adding in hrefs to an axis is kind of a pain in the ass. Simplest, not necessarily best, method.
    // enter/update logic based on https://github.com/d3/d3-selection/issues/86
    // JOIN: bind current data to the links / rectangles.
    // parent selector: outside `a` element for hyperlink
    var ylinks = cmpds.selectAll('.y-link')
      .data(data_currpage);

    // EXIT: remove any rectangles that no longer exist.
    ylinks.exit().remove();

    // // child selector: nested rectangle.
    var ytext = ylinks.select('#cmpd-name');

    // append `a` element to each parent
    var ylinksEnter = ylinks
      .enter().append('a.y-link');

    // // Append rects (children to `a` wrapper)
    var ytextEnter = ylinksEnter.append('text#cmpd-name')
      .attr('x', -6)
      .attr('y', function(d, i) {
        return yByIdx(i);
      });

    // Update the parent links
    ylinks.merge(ylinksEnter)
      .attr('id', function(d) {
        return d.value.name;
      })
      .attr('xlink:href', function(d) {
        return find_url(d);
      });

    // Update the children rectangle values
    ytext.merge(ytextEnter)
      .text(function(d) {
        return d.value.name;
      })
      .classed('pointer', function(d) {
        if (d.value.wikidata) {
          return true;
        }
      });


    // -- DOTS --
    var dotgrp = dp.selectAll(".dots")
      .data(data_currpage);

    // EXIT: remove any rectangles that no longer exist.
    dotgrp.exit().remove();

    // append `g` element to each parent
    var dotgrpEnter = dotgrp.enter().append("g.dots");


    // -- lollipops --
    // lollipop selector: line to min value
    var lollis = dotgrp.select('.lollipop');

    //  Append lines (children to `g` wrapper)
    var lollisEnter = dotgrpEnter.append('line.lollipop')
      .attr('x1', 0) // padded against the end of the x-axis
      .attr('y1', function(d, i) {
        return yByIdx(i);
      })
      .attr('y2', function(d, i) {
        return yByIdx(i);
      })
      .attr('stroke-dasharray', '6,6');

    // -- individual values --
    // useful: https://groups.google.com/forum/#!topic/d3-js/5AxgsKK31EA
    // child selector: indiv. circle
    // NOTE: need to reselect ".dots" to get data bound to it; `dotgrp` doesn't seem to inherit.
    var indivs = dp.selectAll(".dots").selectAll('.assay-val')
      .data(function(d, i) {
        if (d.value.num_cmpds > 1) {
          // only return values if there are more than one compound;
          return d.value.assay_vals;
        } else {
          return '';
        }
      })

    // EXIT: remove any rectangles that no longer exist.
    indivs.exit().remove();

    //  Append dots (children to `g` wrapper)
    var indivsEnter = indivs.enter().append('circle.assay-val')
      .attr('r', dot_size * 0.75);


    // -- avg. value --
    // child selector: avg. circle
    var avgs = dotgrp.select('.assay-avg');

    //  Append dots (children to `g` wrapper)
    var avgsEnter = dotgrpEnter.append('circle.assay-avg')
      .attr('cy', function(d, i) {
        return yByIdx(i);
      })
    // .attr('cy', function(d) {
    //   return y(d.value.name) + y.bandwidth() / 2;
    // })


    // Update the parent links
    dotgrp.merge(dotgrpEnter)
      .attr("id", function(d) {
        // alter the id so it follows CSS selection rules: no spaces, no -, can't start w/ number.
        return remove_symbols(d.value.name);
      })
      .attr("name", function(d) { // used to link to the y-axis for compounds w/ multiple measurements
        return d.value.name;
      });

    // lollis: Update the children lollipop stick values
    lollis.merge(lollisEnter)
      .attr('x2', function(d) {
        return x(d.value.min);
      })

    // individual measurements: update the children circle values.
    indivs.merge(indivsEnter)
      .attr('cx', function(d) {
        return x(d)
      })
      .attr('cy', function(d, i) {
        return this.parentNode.children[0].getAttribute('y1');
        // return y(this.parentNode.getAttribute("name")) + y.bandwidth() / 2;
        // return i * y.step() + y.step() * y.paddingOuter() + y.step() / 2;
      });

    // avg: Update the children circle values
    avgs.merge(avgsEnter)
      .attr('cx', function(d) {
        return x(d.value.avg)
      })
      .style('fill', function(d) {
        return colorScale(Math.log10(d.value.avg));
      })
      .attr('r', dot_size);


    // --- HYPERLINK to repurpos.us page for each compound ---

    // JOIN: bind current data to the links / rectangles.
    // parent selector: outside `a` element for hyperlink
    var links = linksContainer.selectAll('.cmpd-link')
      .data(data_currpage);

    // EXIT: remove any rectangles that no longer exist.
    links.exit().remove();

    // child selector: nested rectangle.
    var rects = links.select('.cmpd-rect');

    // append `a` element to each parent
    var linksEnter = links
      .enter().append('a.cmpd-link');

    // Append rects (children to `a` wrapper)
    var rectsEnter = linksEnter.append('rect.cmpd-rect')
      .attr('height', y.bandwidth());

    // Update the parent links
    links.merge(linksEnter)
      .attr('id', function(d) {
        return d.value.name;
      })
      .attr('xlink:href', function(d) {
        return find_url(d);
      });

    // Update the children rectangle values
    rects.merge(rectsEnter)
      .attr('id', function(d) {
        return d.value.name;
      })
      .attr('x', function(d) {
        return x(d.value.max) - margin.right / 2;
      })
      .attr('y', function(d, i) {
        return i * y.step() + y.step() * y.paddingOuter();
      })
      .attr('width', function(d, i) {
        return x(d.value.min) - x(d.value.max) + margin.right;
      })
      .classed('pointer', function(d) {
        if (d.value.wikidata) {
          return true;
        }
      });

  } // END OF PLOT FUNCTION ----------------------------------------------------

  // DRAW THE INITIAL PLOT -----------------------------------------------------
  // Needs to be called before event behavior declared.
  draw_plot(current_page, current_tab)
  // ---------------------------------------------------------------------------

  // EVENTS --------------------------------------------------------------------
  // EVENT: on clicking page number, change the page.
  function updatePage(idx) {
    pg.selectAll(".page-link")
      .classed('page-selected', function(d, i) {
        return i == idx
      })

    generateTable(idx)
  }
  pg.selectAll(".page-link").on("click", function(d, i) {

    selected_page = this.text - 1;

    updatePage(selected_page);
  });

// Dropdown button for download
$('.dropdown-toggle').dropdown();

// Download buttons
d3.selectAll('#tsv-dwnld').on('click', function() {
  download_file(assay_data, 'tsv');
})

d3.selectAll('#json-dwnld').on('click', function() {
  download_file(assay_data, 'json');
})

// <<< download handler >>>
// download function from https://code-maven.com/create-and-download-csv-with-javascript
// and https://halistechnology.com/2015/05/28/use-javascript-to-export-your-data-as-csv/
function download_file(data, filetype) {

switch (filetype) {
  case 'tsv':
    dwnld_data = to_tsv(data);
    break;
  case 'json':
    dwnld_data = to_json(data);
    break;
  default: null;
}


    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/tsv;charset=utf-8,' + encodeURI(dwnld_data);
    hiddenElement.target = '_blank';
    hiddenElement.download = assay_title.replace(/\s/g, '') + 'data.' + filetype;
    hiddenElement.click();
}

// <<< convert to json file format >>>
function to_json(data) {
  return JSON.stringify(data);
}

// <<< convert to tsv file format >>>
function to_tsv(data) {
  columnDelimiter = '\t'; // technically, tab-separated, since some chemical cmpds have commas in names.
      lineDelimiter = '\n';

      colnames = Object.keys(assay_data[0]);

      tsv = '';
      tsv += colnames.join(columnDelimiter);
      tsv += lineDelimiter;

      assay_data.forEach(function(item) {
          counter = 0;
          colnames.forEach(function(key) {
              if (counter > 0) tsv += columnDelimiter;

              tsv += item[key];
              counter ++;
          });
          tsv += lineDelimiter;
      });

      return tsv
}


  // Rollover behavior: y-axis
  dotplot.selectAll('.y-link text').on('mouseover', function() {

      var selected = "#" + remove_symbols(this.textContent);

      // dim the rest of the axis
      dotplot.selectAll(".y-link text")
        .classed("inactive", true);

      d3.select(this)
        .classed("inactive", false)
        .classed("active", true);

      // turn off lollipop sticks, circles
      dotplot.selectAll(".dots")
        .classed("inactive", true);


      // turn on selected
      dotplot.selectAll(selected)
        .classed("inactive", false);

      // turn on structures
      showStruct(this.textContent);
    })
    .on('mouseout', function() {
      // turn the axis back on
      dotplot.selectAll(".y-link text")
        .classed("active", false)
        .classed("inactive", false);

      // turn on lollipop sticks, circles
      dotplot.selectAll(".dots")
        .classed("inactive", false);


      hideStruct();
    })




  // mouseover: rects
  dotplot.selectAll('.cmpd-link')
    .on('mouseover', function() {
      selected = this.id;

      dotplot.selectAll(".cmpd-link")
        .classed("inactive", true);

      d3.select(this)
        .classed("inactive", false)
        .classed("active", true);

      // y-axis text
      dotplot.selectAll('.y-link text')
        .classed('inactive', function(d) {
          if (d.value.name != selected) {
            return true;
          } else {
            return false;
          }
        })

      // turn on structures
      showStruct(this.id);
    })

    .on('mouseleave', function() {
      dotplot.selectAll(".cmpd-link")
        .classed("inactive", false);

      dotplot.selectAll(".y-link text")
        .classed("inactive", false);

      hideStruct();
    })


  // <<< showStruct(cmpd_name) >>>
  function showStruct(cmpd_name) {
    // turn on structure
    struct
    .style('display', 'inline');

    // bind data to structure fields
    var filtered = nested.filter(function(d) {
      return d.value.name == cmpd_name;
    });

    // Name of compound
    struct.selectAll('#struct-name')
      .data(filtered)
      .text(function(d) {
        return d.value.name;
      });


    d3.selectAll('#structs')
      .data(filtered)
      .style("top", function(d, i) {
        let y_posit = y(d.value.name) + y.bandwidth() + margin.top;
        if (y_posit + struct_height < height) {
          return y_posit + "px";
        } else if (y_posit - struct_height > 0) {
          // fits within svg
          return y_posit - struct_height + "px";
        } else {
          return margin.top + 10 + "px";
        }
      })
      .style("left", function(d) {
        let y_posit = y(d.value.name) + y.bandwidth() + margin.top;
        if (y_posit - struct_height < 0) {
          return width + margin.left - struct_width - 10 + "px";
        } else {
          return x(d.value.avg) - struct_width / 2 + margin.left + "px";
        }
      });

    // Hypothesis: have to rebind the data to every element, since the children were declared before the data were bound. Therefore data doesn't inherit.
    // change structure URL
    // if (filtered.value.pubchem_id){
    struct.selectAll('#structure')
      .data(filtered)
      .attr("src", function(d) {
        if (d.value.pubchem_id) {
            return 'static/img/' + d.value.pubchem_id + '.png';
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
    header_tooltip.selectAll('#rollover-avgtitle')
      .data(filtered)
      .attr('class', 'rollover-avg')
      .html(function(d) {
        return 'average ' + d.value.assay_type + '<sub>50</sub>: '
      })

    header_tooltip.selectAll('#rollover-avg')
      .data(filtered)
      .attr('class', 'rollover-avg')
      .html(function(d) {
        return d3.format(".1e")(d.value.avg);
      })

    // Individual. value
    let indiv_tr = struct.selectAll('#rollover-indiv')
      .data(filtered.filter(function(d) {
        return d.value.num_cmpds > 0;
      }))
      .selectAll('tr')
      .data(function(d) {
        return d.value.assay_vals;
      });

    indiv_tr.exit().remove();


    let indiv_td1 = indiv_tr.select('.meas_id');
    let indiv_td2 = indiv_tr.select('.meas_val');

    let indivTREnter = indiv_tr
      .enter().append('tr.rollover-indiv');


    let indivTDEnter1 = indivTREnter.append('td.meas_id');
    let indivTDEnter2 = indivTREnter.append('td.meas_val');

    indiv_td1.merge(indivTDEnter1)
      .text(function(d, i) {
        return 'measurement ' + (i + 1);
      });

    indiv_td2.merge(indivTDEnter2)
      .text(function(d) {
        return d3.format(".1e")(d)
      });

  }

  // <<< hideStruct() >>>
  function hideStruct() {
    struct
      .transition()
      .duration(0)
      .style('display', 'none');

  }


  // IC/EC click events
  tabs.selectAll('.nav-link').on('click', function() {
    // find the current selection
    new_tab = this.id;

    // only redraw if necessary
    if (new_tab != current_tab) {

      // update the selected tab highlight
      tabs.selectAll('.nav-link')
        .classed('active', function(d) {
          return (this.id == new_tab);
        })

      // reset the page to the start
      current_page = 0;

      // redraw the plot
      draw_plot(current_page, new_tab);
      // reset the tab
      current_tab = new_tab;
    }
  })

  // pagination click events
  pagination_on();

  // <<< pagination_on() >>>
  function pagination_on() {
    pg.selectAll('.page-link').on('click', function() {
      new_page = this.textContent - 1;

      // only redraw if necessary
      if (new_page != current_page) {
        // update the selected page highlight
        pg.selectAll(".page-link")
          .classed('page-selected', function(d, i) {
            return i == new_page
          })
        try {
          // redraw the plot
          draw_plot(new_page, current_tab);
        } catch (error) {}
        // reset the page
        current_page = new_page;
      }
    })
  }

}); // ---- END OF CSV IMPORT
