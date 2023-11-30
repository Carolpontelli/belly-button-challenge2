let data = {};

const populate = (data) => {
  console.time('POPULATE COMBO BOX');
  const { names } = data;
  const select = document.getElementById('selDataset');
  select.querySelectorAll('option').forEach(option => option.remove());

  names.forEach((name) => {
    const option = document.createElement('option');
    option.text = name;
    option.value = name;
    select.add(option);
  });

  const [firstOption] = names;
  optionChanged(firstOption);
  console.timeEnd('POPULATE COMBO BOX');
};

const populateDemographicInfo = (demographicInfo) => {
  console.time('POPULATE DEMOGRAPHIC INFO');
  const panel = document.getElementById('sample-metadata');

  panel.innerHTML = '';

  for (const [key, value] of Object.entries(demographicInfo)) {
    const div = document.createElement('div');
    const label = document.createElement('label');
    label.innerHTML = `${key}: `;
    div.appendChild(label);
    const span = document.createElement('span');
    span.innerHTML = value;
    div.appendChild(span);
    panel.appendChild(div);
  }

  console.timeEnd('POPULATE DEMOGRAPHIC INFO');
};

const drawBar = (sample) => {
    console.time('DRAW AN HORIZONTAL BAR CHART');
    const barData = [...sample].sort(({value: a}, {value: b}) => b - a).slice(0, 10);
    console.table(barData);
    // Clear any previous chart
    document.getElementById('bar').innerHTML = '';

    const tooltip = d3.select('#bar')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'black')
      .style('border-radius', '5px')
      .style('padding', '10px')
      .style('color', 'white');;
  
    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = (_, d) => {
      tooltip
        .html(d.label)
        .style('opacity', 1);
    };

    const mousemove = (event) => {
      tooltip
        .transition()
        .duration(200);

      tooltip
        .style('left', `${event.layerX + 10}px`)
        .style('top', `${event.layerY + 10}px`);
    };

    const mouseout = () => {
      tooltip.style('opacity', 0);
    };

    // Specify the chart’s dimensions, based on a bar’s height.
    const marginTop = 30;
    const marginRight = 0;
    const marginBottom = 50;
    const marginLeft = 150;
    const width = 1100;
    const height = 1100;

    // Create the scales.
    const x = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.value)])
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
      .domain(d3.sort(barData, d => -d.value).map(d => `OTU ${d.id}`))
      .rangeRound([marginTop, height - marginBottom])
      .padding(0.1);

    // Create the SVG container.
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Append a rect for each sample.
    svg.append('g')
      .attr('fill', 'steelblue')
      .selectAll('.bar')
      .data(barData)
      .enter()
      .append('rect')
      .attr('x', x(0))
      .attr('y', (d) => y(`OTU ${d.id}`))
      .attr('width', (d) => x(d.value) - x(0))
      .attr('height', y.bandwidth())
      .on('mousemove', mousemove)
      .on('mouseover', mouseover)
      .on('mouseout', mouseout);

    // Create the axes.
    svg.append('g')
      .style('font', '25px sans-serif')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(Math.floor(barData[0].value / 50)))
      .call(g => g.select('.domain').remove());

    svg.append('g')
      .style('font', '25px sans-serif')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0));

    document.getElementById('bar').append(svg.node());
    console.timeEnd('DRAW AN HORIZONTAL BAR CHART');
};

const drawBubble = (sample) => {
  console.time('DRAW A BUBBLE CHART');
  document.getElementById('bubble').innerHTML = '';

  console.table(sample);

  const width = 800;
  const height = 400;
  const margin = { top: 10, right: 20, bottom: 100, left: 50 };
  const allIds = sample.map(({ id }) => id);
  const maxId = Math.max(...allIds);
  const maxValue = Math.max(...sample.map(({ value }) => value));

  // append the svg object to the body of the page
  const svg = d3.select('#bubble')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Add X axis
  const x = d3.scaleLinear()
    .domain([0, maxId + (maxValue * 1.5)])
    .range([ 0, width]);

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add X axis label:
  svg.append('text')
    .attr('text-anchor', 'end')
    .attr('x', ((width + margin.left + margin.right) / 2))
    .attr('y', height + 50)
    .text('OTU ID');

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, maxValue * 1.5])
    .range([ height, 0]);

  svg.append('g').call(d3.axisLeft(y));

  // Add a scale for bubble size
  const z = d3.scaleLinear()
    .domain([0, maxValue])
    .range([1, maxValue * 0.40]);
  
  const chartColor = d3.scaleOrdinal()
    .domain(allIds)
    .range(d3.schemeSet1);
  
  // -1- Create a tooltip div that is hidden by default:
  const tooltip = d3.select('#bubble')
    .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('background-color', 'black')
      .style('border-radius', '5px')
      .style('padding', '10px')
      .style('color', 'white');

  // -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
  const mouseover = function(event, d) {
    tooltip
      .transition()
      .duration(200);

    tooltip
      .style('opacity', 1)
      .html(`Label: ${d.label}`)
      .style('left', `${event.layerX + 10}px`)
      .style('top', `${event.layerY + 10}px`);
  };

  const mousemove = function(event) {
    tooltip
    .style('left', `${event.layerX + 10}px`)
    .style('top', `${event.layerY + 10}px`);
  };

  const mouseleave = function(d) {
    tooltip
      .transition()
      .duration(200)
      .style('opacity', 0)
  };

  // Add dots
  svg.append('g')
    .selectAll('dot')
    .data(sample)
    .enter()
    .append('circle')
    .attr('cx', (d) => { return x(d.id); } )
    .attr('cy', (d) => { return y(d.value); } )
    .attr('r', (d) =>{ return z(d.value); } )
    .style('fill', (d) => { return chartColor(d.id); })
    .style('opacity', '0.7')
    .attr('stroke', 'black')
    .on('mouseover', mouseover )
    .on('mousemove', mousemove )
    .on('mouseleave', mouseleave );

  console.timeEnd('DRAW A BUBBLE CHART');
};

const processSample = (rawSample) => {
  const {
    otu_ids: ids,
    otu_labels: labels,
    sample_values: values,
  } = rawSample;

  return ids.map((id, index) => (
    {
      id,
      label: labels[index],
      value: values[index],
    }
  ));
};

const optionChanged = (selected) => {
  console.time('OPTION SELECTED:', selected);
  const { metadata, samples } = data;
  // Build Demographic Infor Panel
  const [demographicInfo] = metadata.filter(({ id }) => id == selected);
  populateDemographicInfo(demographicInfo);
  // Build Bar Chart
  const [rawSample] = samples.filter(({ id }) => id == selected);
  const sample = processSample(rawSample);
  drawBar(sample);
  drawBubble(sample);
  console.timeEnd('OPTION SELECTED:', selected);
};

const init = async () => {
  console.time('INIT');
  console.time('LOAD JSON');
  const response = await fetch('https://2u-data-curriculum-team.s3.amazonaws.com/dataviz-classroom/v1.1/14-Interactive-Web-Visualizations/02-Homework/samples.json');
  const json = await response.json();
  data = json;
  console.timeEnd('LOAD JSON');
  populate(json);
  console.timeEnd('INIT');
};


window.onload = init;