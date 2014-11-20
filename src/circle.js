/// Copyright by Erik Weitnauer, 2012.

Circle = function(cx, cy, r) {
  this.x = cx;
  this.y = cy;
  this.r = r;
}

Circle.prototype.copy = function() {
  return new Circle(this.x, this.y, this.r);
}

Circle.prototype.centroid = function() {
  return new Point(this.x, this.y);
}

Circle.prototype.area = function() {
  return Math.PI * this.r * this.r;
}

Circle.prototype.move_to_origin = function() {
  this.x = 0; this.y = 0;
}

/// Returns the bounding box as [x, y, width, height].
Circle.prototype.bounding_box = function() {
  return {x:this.x-this.r, y:this.y-this.r, width:2*this.r, height:2*this.r};
}

/// Create a circle based on an svg circle node.
Circle.fromSVGCircle = function(node) {
  var attrs = node.attributes;
  if (attrs.cx && attrs.cy && attrs.r) {
    return new Circle(Number(attrs.cx.value), Number(attrs.cy.value)
                     ,Number(attrs.r.value));
  } else return null;
}

/// This method is used to parse circles in SVG created with older Inkscape
/// versions. The circle will be written as path, but the center and radius
/// is still available in sodipodi:cx, sodipodi:cy, sodipodi:rx and sodipodi:ry.
/// If exclude_ellipse is passed as true, the program will reject cases in which
/// rx differs from ry (default: true).
Circle.fromSVGPath = function(path_node) {
  if (typeof(exclude_ellipse) == 'undefined') exclude_ellipse = true;
  var ns = path_node.lookupNamespaceURI('sodipodi');
  var get_attr = function(attr) {
    var res = path_node.getAttributeNS(ns, attr);
    if (res !== null) return res;
    return path_node.getAttribute('sodipodi:'+attr);
  };
  var cx, cy, rx, ry;
  if (get_attr('type') == 'arc' && (cx = get_attr('cx')) && (cy = get_attr('cy')) &&
      (rx = get_attr('rx')) && (ry = get_attr('ry')))
  {
    // check whether this is a full circle (|start-end| = 2*PI)
    var start = get_attr('start'), end = get_attr('end');
    if (start && end) {
      var diff = Math.abs(Number(start)-Number(end));
      diff = Math.abs(diff - 2*Math.PI);
      if (diff > 0.01) {
        console.log("Warning: this is a circle segment! ||start-end|-2*PI| =", diff);
        return null;
      }
    }
    rx = Number(rx); ry = Number(ry); cx = Number(cx); cy = Number(cy);
    if (Math.abs(rx/ry-1) > 0.05) {
      console.log("Warning: This is an ellipse! rx", rx, "ry", ry);
      return null;
    }
    return new Circle(cx, cy, (rx+ry)/2);
  }
  return null;
}

/// Draws itself in an SVG.
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

/// Draws itself onto the context of a canvas.
Circle.prototype.renderOnCanvas = function(ctx, do_stroke, do_fill) {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI, true);
  if (do_stroke) ctx.stroke();
  if (do_fill) ctx.fill();
}
