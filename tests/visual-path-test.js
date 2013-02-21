var svg_polys = [];
var max_err = 0.1;

var svg_content =
 '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\
  <svg\
    xmlns:dc="http://purl.org/dc/elements/1.1/"\
    xmlns:cc="http://creativecommons.org/ns#"\
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\
    xmlns:svg="http://www.w3.org/2000/svg"\
    xmlns="http://www.w3.org/2000/svg"\
    xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"\
    xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"\
    width="500"\
    height="500"\
    id="svg2"\
    version="1.1"\
    s2p-pixels-per-unit="100"\
    s2p-restitution="0.4"\
    s2p-friction="0.3">\
    <g id="main_group" s2p-scene-id="1" transform="scale(4,4)">\
      <path id="error-size" style="stroke:black; stroke-width: 1px; stroke-linecap: butt;"></path>\
      <path\
        d="M10,20 C10,10 25,10 25,20 S40,30 40,20Z"\
        id="path0002"\
        style="fill:none;stroke:black;stroke-width:1px;"\
        transform="translate(0,0)"/>\
      <path\
        d="M20,30 Q40,5 60,30 T100,30"\
        id="path0004"\
        style="fill: none; stroke: black; stroke-width: 1px;"\
        transform="translate(-10,30)"/>\
      <path\
        d="M10,-10 H20 h-10 v20 V0 L50,10 l 10,10"\
        id="path0003"\
        style="fill: none; stroke: black; stroke-width: 1px;"\
        transform="translate(0,95)"/>\
      <path\
       style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"\
       d="M 0.49293417,65.330296 C 25.796888,65.001673 41.40647,65.165985 41.40647,65.165985 c -0.05477,6.598491 0.05477,13.842556 1e-6,20.867547 l 34.669703,-0.164312 -0.164311,-20.538923 23.003595,0.328622 0.328623,0"\
       id="path2997"/>\
    </g>\
  </svg>';

// parse xml
parseXml = function(xml) {
  if (window.DOMParser) {
    var parser = new DOMParser();
    return parser.parseFromString(xml, 'text/xml');
  } else {
    xml = xml.replace(/<!DOCTYPE svg[^>]*>/, '');
    var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.async = 'false';
    xmlDoc.loadXML(xml);
    return xmlDoc;
  }
}

var svg = null, display = null, gs =[], circle_node = null, polys = [];

function init() {
  // read content into DOM tree
  svg = parseXml(svg_content);

  display = document.getElementById('svg_element');

  var root = svg.documentElement;
  var nsResolver = svg.createNSResolver(root);

  // display the correct paths (in black)
  var g = root.getElementById('main_group');
  display.appendChild(g.cloneNode(true));

  // interpolate and show polygons
  interpolate_polygons();
}

function interpolate_polygons() {
  // remove old polygons
  gs.forEach(function(p) { p.parentElement.removeChild(p); })
  gs = [];

  // add line of length 10
  var line_node = document.getElementById("error-size");
  line_node.setAttribute('d', 'M100,10 H'+(100+max_err));

  // setup marker for vertices
  if (!circle_node) {
    circle_node = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle_node.setAttribute('r', 1);
    circle_node.style.setProperty('fill', 'blue');
  }

  polys = [];
  // interpolate and display
  var path_nodes = svg.documentElement.getElementsByTagName('path');
  for (var i=0; i<path_nodes.length; i++) {
    var poly = Polygon.fromSVGPath(path_nodes[i], max_err);
    polys.push(poly);
    var g = document.createElementNS('http://www.w3.org/2000/svg','g');
    poly.renderInSvg(document, g, circle_node);
    display.appendChild(g);
    var m = path_nodes[i].getTransformToElement();
    g.setAttribute('transform', 'matrix(' + m.a + ',' + m.b + ',' + m.c + ',' + m.d + ',' + m.e + ',' + m.f + ')');
    gs.push(g);
  }
}

function errorValue(val) {
  max_err = Math.max(1,Number(val)) * 0.1;
	document.getElementById("error_value").innerHTML = max_err.toFixed(1);
  interpolate_polygons();
}
