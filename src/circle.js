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

/// Returns an array of zero, one or two intersections of a ray starting in
/// point P with vector v with this circle. The closer intersection is first
/// in the array.
Circle.prototype.intersect_with_ray = function(P, v) {
/// For circle at (0,0): (R_x+k*v_x)^2 + (R_y+k*v_y)^2 = r^2
/// ==> (v_x^2+v_y^2)*k^2 + 2(R_x*v_x+R_y*v_y)*k + (R_x^2+R_y^2-r^2) = 0
/// ==> k = (-b +- sqrt(b^2-4ac)) / 2a
  var p = P.sub(this)
    , a = v.x*v.x + v.y*v.y
    , b = 2*p.x*v.x + 2*p.y*v.y
    , c = p.x*p.x + p.y*p.y - this.r*this.r
    , d = b*b-4*a*c;

  if (d<0) return [];
  if (d<Point.EPS) {
    var k = -b/(2*a);
    if (k < 0) return [];
    return [(new Point(P)).add(v.scale(k))];
  }
  var res = []
    , k1 = (-b-Math.sqrt(d))/(2*a)
    , k2 = (-b+Math.sqrt(d))/(2*a);
  if (k1 > k2) { var h = k1; k1 = k2; k2 = h; }
  if (k1 >= 0) res.push((new Point(P)).add(v.scale(k1)));
  if (k2 >= 0) res.push((new Point(P)).add(v.scale(k2)));
  return res;
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
    // check whether this is a full circle (|end-start| = 2*PI or end == start-eps)
    var start = get_attr('start'), end = get_attr('end');
    if (start && end) {
      var diff = Number(end)-Number(start);
      if ( Math.abs(Math.abs(diff) - 2*Math.PI) > 0.01
        && !(diff < 0 && diff > -0.01)) {
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
