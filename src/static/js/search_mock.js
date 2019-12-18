// mockup of a search results series
d3.csv('/static/assay_data.csv', function(error, raw_assay_data) {
  d3.select('body')
  .style('line-height', '1em')

  console.log(raw_assay_data)


  assay_data = raw_assay_data
    .filter(function(d, i) {
      return d.ac50;
    })


  // nest; calculate averages for the same drug.
  nested = d3.nest()
    .key(function(d) {
      return d.calibr_id
    })
    .rollup(function(v) {
      return {
        num_cmpds: v.length,
        assay: v.map(function(d) {
          return d.assay_title;
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

  function genClasses(max_num = 20) {
    var classes = Array.apply(null, {
      length: max_num
    }).map(function(value, index) {
      return 'class' + index;
    });

    var num_sel = Math.floor(Math.random() * (max_num + 1) * 0.6)

    var sel = []

    for (var i = 0; i < num_sel; i++) {
      sel[i] = classes[Math.floor(Math.random() * (max_num + 1))]
    }

    return (sel)
  }


  function genSum() {

    var words = "Aspirin, also known as acetylsalicylic acid (ASA), is a medication used to treat pain, fever, or inflammation. Specific inflammatory conditions in which aspirin is used include Kawasaki disease, pericarditis, and rheumatic fever. Aspirin given shortly after a heart attack decreases the risk of death. Aspirin is also used long-term to help prevent heart attacks, ischaemic strokes, and blood clots in people at high risk. It may also decrease the risk of certain types of cancer, " +
      "particularly colorectal cancer. For pain or fever, effects typically begin within 30 minutes. Aspirin is a nonsteroidal anti-inflammatory drug (NSAID) and works similar to other NSAIDs but also suppresses the normal functioning of platelets. One common adverse effect is an upset stomach. More significant side effects include stomach ulcers, stomach bleeding, and worsening asthma. Bleeding risk is greater among those who are older, drink alcohol, take other NSAIDs, or are on other blood thinners. Aspirin is not recommended in the last part of pregnancy. It is not generally recommended in children with infections because of the risk of Reye syndrome. High doses may result in ringing in the ears. A precursor to aspirin in the form of leaves from the willow tree has been used for its health effects for at least 2,400 years. In 1853, chemist Charles Frédéric Gerhardt treated the medicine sodium salicylate with acetyl chloride to produce acetylsalicylic acid for the first time. " +
      "For the next fifty years, other chemists established the chemical structure and came up with more efficient methods to make it. In 1897, scientists at the Bayer company began studying acetylsalicylic acid as a less-irritating replacement medication for common salicylate medicines. By 1899, Bayer had named it 'Aspirin' and sold it around the world. Aspirin's popularity grew over the first half of the twentieth century leading to competition between many brands and formulations. The word" + " Aspirin was Bayer's brand name, however their rights to the trademark were lost or sold in many countries. Aspirin is one of the most widely used medications globally, with an estimated 40,000 tonnes (44,000 tons) (50 to 120 billion pills) consumed each year. It is on the World Health Organization's (WHO's) List of Essential Medicines, the safest and most effective medicines needed in a health system. As of 2014 the wholesale cost in the developing world is $0.002 to $0.025 USD per dose." +
      " As of 2015 the cost for a typical month of medication in the United States is less than $25.00 USD. It is available as a generic medication.";

    words = words.split(" ");

    max_num = words.length;

    var num_sel = Math.floor(Math.random() * 0.15 * (max_num + 1))

    var sel = []

    for (var i = 0; i < num_sel; i++) {
      sel[i] = words[Math.floor(Math.random() * (max_num + 1))]
    }

    sel = sel.join(" ")

    return (sel)
  }


  function removeDupes(arr) {
      unique = [... new Set(arr)]

      return(unique);
  }

  // Remove duplicate values that came along for the ride.
  nested
    // TODO: figure out if there's a less kludgey way to do this. Also check if the rollup has the same values.
    .forEach(function(d, i) {
      d.assay = removeDupes(d.value.assay);
      d.value.pubchem_id = d.value.pubchem_id[0];
      d.value.name = d.value.name[0];
      d.classes = genClasses();
      d.summary = genSum();
    })

  nested = nested.slice(0, 9);



  console.log(nested)

  var vis = d3.select('.vis');

  var indivs = vis.selectAll('.search')
    .data(nested)
    .enter().append('div')
    .attr('class', 'col-md-4 col-sm-6 col-xs-12')
    .attr('height', 250)
    .style('border-left', '1px solid #ddd')
    .style('border-bottom', '1px solid #ddd')
  // .style('margin', '15px')
  // .style('background', 'green');

  indivs
    .append('h4')
    .text(function(d) {
      return d.value.name;
    })

  indivs.append('p')
    .text(function(d) {
      return d.summary;
    })

  var chem = indivs.append('div.row');

  chem.append('div.col-6')
  .append('img#structure')
    .attr("width", '100%')
    // .attr("height", '75%')
    .attr("src", function(d) {
      if (d.value.pubchem_id) {
        return 'static/img/' + d.value.pubchem_id + '.png';
      }
    })


var colorScale = d3.scaleOrdinal(d3.schemeSet2);

colorScale.domain(nested.map(function(d) { return d.assay;}))


var chem2 = chem.append('div.col-6')
chem2.append('h6').text('Available Assays')
chem2.append('ul')
.data(nested)
.selectAll('li')
.data(function(d) { return d.assay})
.enter().append('li')
.text(function(d) { return d; })
.style('color', function(d,i) { return colorScale(d)})


indivs.append('div.classes')
.style('margin', '12px')
.data(nested)
.selectAll('button')
.data(function(d) { return d.classes})
.enter().append('button')
.style('margin', '3px')
.text(function(d) { return d; })

  // indivs.append('svg')
  // .attr('width', 250)
  // .attr('height', 250)
  // .style('background', 'green')
  // .style('opacity', 0.3)
})
