/// Copyright by Erik Weitnauer, 2012.

Circle = function(cx, cy, r) {
  this.x = cx;
  this.y = cy;
  this.r = r;
}

Circle.prototype.clone = function() {
  return new Circle(this.x, this.y, this.r);
}

Circle.prototype.centroid = function() {
  return new Point(this.x, this.y);
}

Circle.prototype.area = function() {
  return Math.PI * this.r * this.r;
}

// If the passed path SVG element was originally a circle and written as a path
// by inkscape, it will construct a new Circle object from it and return it. If
// the path does not resemble a circle, it will return null.
Circle.fromSVGPath = function(path_node, nsResolver) {
  var ns = nsResolver.lookupNamespaceURI('sodipodi');
  var get_attr = function(attr) { return path_node.getAttributeNS(ns, attr) };
  var cx, cy, rx, ry;
  if (get_attr('type') == 'arc' && (cx = get_attr('cx')) && (cy = get_attr('cy')) &&
      (rx = get_attr('rx')) && (ry = get_attr('ry')))
  {
    rx = Number(rx); ry = Number(ry); cx = Number(cx); cy = Number(cy);
    if (Math.abs(rx-ry) > Point.EPS) return null;
    return new Circle(cx, cy, (rx+ry)/2);
  }
  return null;
}

Circle.prototype.renderInSvg = function(doc, parent_node) {
  var circle = doc.createElementNS('http://www.w3.org/2000/svg','circle');
  circle.setAttribute('cx', this.x);
  circle.setAttribute('cy', this.y);
  circle.setAttribute('r', this.r);
  circle.style.setProperty('stroke', 'red');
  circle.style.setProperty('stroke-width', '.5px');
  circle.style.setProperty('fill', 'none');
  parent_node.appendChild(circle);
  return circle;
}
