const d3 = require('d3');
const nodes = [{id: 'a'}];
const links = [{source: 'a', target: 'b'}, {source: 'c', target: 'd'}];
const sim = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id));
sim.tick(1);
console.log(links);
