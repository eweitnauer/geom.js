// Copyright Erik Weitnauer 2015. [v1.0.3]
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
/// Copyright by Erik Weitnauer, 2012.

/** Matrix is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it.
The matrix array contains the row vectors as Vectors.*/

/// Constructor, takes an array of row arrays as argument.
function Matrix(rows) {
  var arr = [];
  arr.M = rows ? rows.length : 0;
  if (rows) {
    arr.N = rows[0].length;
    for (var i=0; i<rows.length; i++) {
      if (rows[i].length != arr.N) throw "all rows must have the same length";
      if (rows[i] instanceof Vector) arr.push(rows[i]); else arr.push(new Vector(rows[i]));
    }
  } else arr.N = 0;
  arr.__proto__ = Matrix.prototype;
  return arr;
}
Matrix.prototype = new Array;

/// Returns a new rows x cols matrix instance with all values set to val.
Matrix.construct = function(M, N, val) {
  if (!val) val = 0;
  var m = new Matrix();
  for (var i=0; i<M; i++) m.push(Vector.construct(N, val));
  m.M = M;
  m.N = N;
  return m;
}

/// Returns a new rows x cols matrix instance with all values set to val.
Matrix.random = function(rows, cols) {
  var m = new Matrix();
  for (var i=0; i<rows; i++) m.push(Vector.random(cols));
  return m;
}

Matrix.prototype.get = function(y,x) {
  return this[y][x];
}

Matrix.prototype.Set = function(y,x,val) {
  this[y][x] = val;
  return this;
}

/// Returns the result of multiplying itself with the passed argument as
/// either a new Vector or Matrix, depending on whether a Vector or Matrix was
/// passed as argument.
Matrix.prototype.mul = function(arg) {
  if (arg instanceof Vector) {
    if (this.N != arg.length) throw "dimension mismatch";
    var res = new Vector();
    for (var i=0; i<this.M; i++) res.push(this[i].mul(arg));
    return res;
  } else if (arg instanceof Matrix) {
    if (this.N != arg.M) throw "dimension mismatch";
    var res = Matrix.construct(this.M, arg.N);
    for (var i = 0; i<res.M; i++) for (var j=0; j<res.N; j++) {
      for (var k=0; k<this.N; k++) res[i][j]+=this[i][k]*arg[k][j];
    }
    return res;
  } else throw "type mismatch";
}

/// Subtracts the passed matrix element-wise from this and returns this.
Matrix.prototype.Sub = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  for (var i=0; i<this.M; i++) this[i].Sub(M[i]);
  return this;
}

/// Returns a new matrix that is the result of subtracting M element-wise from this.
Matrix.prototype.sub = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  var R = new Matrix();
  for (var i=0; i<this.M; i++) R.push(this[i].sub(M[i]));
  R.M = M.M; R.N = M.N;
  return R;
}

/// Adds the passed matrix element-wise from this and returns this.
Matrix.prototype.Add = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  for (var i=0; i<this.M; i++) this[i].Sub(M[i]);
  return this;
}

/// Returns a new matrix that is the result of adding M element-wise from this.
Matrix.prototype.add = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  var R = new Matrix();
  for (var i=0; i<this.M; i++) R.push(this[i].add(M[i]));
  R.M = M.M; R.N = M.N;
  return R;
}


/// Returns the maximum value in the matrix.
Matrix.prototype.max = function() {
  var m = -Infinity;
  for (var i=0; i<this.M; i++) m = Math.max(m, this[i].max());
  return m;
}

/// Constructs a new matrix of the same dimensions like this and other and the
/// values set to the result of the function f_op(this[i][j], other[i][j]) for each element.
Matrix.prototype.combine = function(other, f_op) {
  if (other.N != this.N || other.M != this.M) throw "dimension mismatch";
  var R = Matrix.construct(this.M, this.N);
  for (var i = 0; i<R.M; i++) for (var j=0; j<R.N; j++) R[i][j] = f_op(this[i][j], other[i][j]);
  return R;
}

/// Constructs a new matrix of the same dimensions like this and the
/// values set to the result of the function f(this[i][j]) for each element.
Matrix.prototype.map = function(f) {
  var R = Matrix.construct(this.M, this.N);
  for (var i = 0; i<R.M; i++) for (var j=0; j<R.N; j++) R[i][j] = f(this[i][j]);
  return R;
}

/// Returns the minimum value in the matrix.
Matrix.prototype.min = function() {
  var m = Infinity;
  for (var i=0; i<this.M; i++) m = Math.min(m, this[i].min());
  return m;
}
/// Copyright by Erik Weitnauer, 2012.

/// The point class represents a point or vector in R^2. The interpretations as
/// vector or point are used interchangingly below.

/// Constructor. Either pass a point instance or x, y coordinates. If nothing is
/// passed, the point is initialized with 0, 0.
Point = function(p_or_x, y) {
  if (arguments.length==0) { this.x = 0; this.y = 0 }
  else if (arguments.length==1) { this.x = p_or_x.x; this.y = p_or_x.y }
  else { this.x = p_or_x; this.y = y }
}

/// By adding multiplies of 2*PI, the argument is transformed into the interval
/// [-PI,PI] and returned.
Point.norm_angle = function(a) {
  a = a % (Math.PI*2);
  if (a < -Math.PI) a += Math.PI*2;
  else if (a > Math.PI) a -= Math.PI*2;
  return a;
}

/// Returns a new point which is this rotated about (0, 0) by angle.
Point.prototype.rotate = function(angle) {
  return new Point(this.x*Math.cos(angle) - this.y*Math.sin(angle),
                   this.y*Math.cos(angle) + this.x*Math.sin(angle));
}

/// Rotates this about (0, 0) by angle and returns this.
Point.prototype.Rotate = function(angle) {
  return this.Set(this.x*Math.cos(angle) - this.y*Math.sin(angle),
                  this.y*Math.cos(angle) + this.x*Math.sin(angle));
}

/// There are two ways to call the function:
/// 1) Set(q)   ... set coordinates to coordinates of Point q
/// 2) Set(x,y) ... set coordinates to x, y
/// Returns this.
Point.prototype.Set = function(other_or_x, y) {
  if (arguments.length == 1) {
    this.x = other_or_x.x;
    this.y = other_or_x.y;
  } else {
    this.x = other_or_x;
    this.y = y;
  }
  return this;
}

/// Return distance to other point.
Point.prototype.dist = function(other) {
  var dx = this.x-other.x, dy = this.y-other.y;
  return Math.sqrt(dx*dx + dy*dy);
}

/// Return quadratic distance to other point.
Point.prototype.dist2 = function(other) {
  var dx = this.x-other.x, dy = this.y-other.y;
  return dx*dx + dy*dy;
}

/// Class method returning the length of vector (x,y).
Point.len = function(x, y) {
  return Math.sqrt(x*x+y*y);
}

/// Return distance to (0, 0).
Point.prototype.len = function() {
  return Math.sqrt(this.x*this.x+this.y*this.y);
}

/// Return quadratic distance to (0, 0).
Point.prototype.len2 = function() {
  return this.x*this.x+this.y*this.y;
}

/// Return new point that is the sum of this and other point.
Point.prototype.add = function(other) {
  return new Point(this.x+other.x, this.y+other.y);
}

/// Add the other point to this and return this.
Point.prototype.Add = function(other) {
  this.x += other.x; this.y += other.y;
  return this;
}

/// Return new point that is the other point subtracted from this.
Point.prototype.sub = function(other) {
  return new Point(this.x-other.x, this.y-other.y);
}

/// Subtract other point from this and return this.
Point.prototype.Sub = function(other) {
  this.x -= other.x; this.y -= other.y;
  return this;
}

/// Return the scalar product of this and the passed vector.
Point.prototype.mul = function(other) {
  return this.x*other.x+this.y*other.y;
}

/// Return last component of cross product of this and other vector.
Point.prototype.cross = function(other) {
  return this.x*other.y-this.y*other.x;
}

/// Return true if x and y components of this do not differ more than eps from other.
Point.prototype.equals = function(other, eps) {
  return (Math.abs(this.x-other.x) <= eps) && (Math.abs(this.y-other.y) <= eps);
}

/// Returns a new vector with same direction as this but len of 1. (NaN, Nan) for
/// vector (0, 0).
Point.prototype.normalize = function() {
  var l = 1/this.len();
  return new Point(this.x*l, this.y*l);
}

/// Scales this vector to a len of 1 and returns this. (NaN, Nan) for vector
/// (0, 0).
Point.prototype.Normalize = function() {
  var l = 1/this.len();
  this.x *= l; this.y *= l;
  return this;
}

// Returns a vector that is perpendicular to this. Returns (0,0) for (0,0).
Point.prototype.get_perpendicular = function() {
  return new Point(-this.y, this.x);
}

/// Returns a scaled version of this vector as a new vector.
Point.prototype.scale = function(s) {
  return new Point(this.x*s, this.y*s);
}

/// Scales this vector and returns this.
Point.prototype.Scale = function(s) {
  this.x *= s; this.y *= s;
  return this;
}

/// Returns "(x, y)".
Point.prototype.toString = function() {
  return "(" + this.x + "," + this.y + ")";
}

/// Returns a copy of this point.
Point.prototype.copy = function() {
  return new Point(this.x, this.y);
}

/// To points closer than EPS are considered equal in several algorithms below.
Point.EPS = 1e-6;

/// Returns the closest point on a line segment to a given point.
Point.get_closest_point_on_segment = function(A, B, P) {
  var AB = B.sub(A)
     ,len = AB.len();
  if (len < Point.EPS) return A;
  var k = AB.mul(P.sub(A))/len;
  if (k<0) return A;
  if (k>AB.len()) return B;
  return A.add(AB.scale(k/len));
}

/// Calculates the intersection point between a ray and a line segment.
/** The ray is passed as origin and direction vector, the line segment
 * as its two end points A and B. If an intersection is found, the method
 * writes it to the passed intersection point and returns true. If no
 * intersection is found, the method returns false.
 *
 * If there is more than one intersection point (might happen when ray and line
 * segment are parallel), the first intersection point is returned.
 *
 * In order not to miss an intersection with the ray and one of the end points
 * of AB, the method will regard very close misses (which are closer than
 * margin) as collisions, too.
 *
 * Params:
 *   R: start of ray (Point)
 *   v: direction vector of ray (Point)
 *   A, B: start and end point of line segment (Point)
 *   intersection: intersection point is written into this (Point)!!
 *   margin: if ray misses the segment by 'margin' or less, it is regarded as hit (default is Point.EPS)
 */
Point.intersect_ray_with_segment = function(R, v, A, B, intersection, margin) {
  // if there is an intersection, it is at A+l*(B-A)
  // where l = (A-R) x v / (v x (B-A))
  // with a x b ... cross product (applied to 2D) between a and b
  if (typeof(intersection) == 'undefined') var intersection = new Point();
  if (typeof(margin) == 'undefined') var margin = Point.EPS;
  // so we start with calculating the divisor
  var AB = B.sub(A);
  var divisor = v.cross(AB);
  if (Math.abs(divisor) > Point.EPS) {
    // divisor is not zero -- no parallel lines!
    // now calculate l
    var l = (A.sub(R)).cross(v) / divisor;
    // check if we have an intersection
    if (l < -margin || l-1. > margin) return false;
    var hit = A.add(AB.scale(l));
    intersection.x = hit.x; intersection.y = hit.y;
  } else {
    // devisor is zero so first check check for A!=B and v!=0
    if (v.len2() < Point.EPS || AB.len2() < Point.EPS)
      return false;
    // okay, A!=B and v!=0 so this means the lines are parallel
    // we project R onto AB to get its relative position k: R' = A + k*(B-A)
    var k = R.sub(A).mul(AB) / AB.mul(AB);
    // now first check, whether v and AB are colinear
    if (A.add(AB.scale(k)).dist(R) > Point.EPS) return false;
    // they are colinear so there might be an intersection, but it depends where
    // R is relative to AB
    if (k < -margin) { intersection.x = A.x; intersection.y = A.y}
    else if (k - 1. > margin) { intersection.x = B.x; intersection.y = B.y}
    else {intersection.x = R.x; intersection.y = R.y}
  }
  // direction check
  if (intersection.sub(R).mul(v) >= 0.) return true;
  else return false;
}


/// Calculates the intersection between a ray that starts within a rectangle
/// with rounded corners with that rectangle, as well as the tangent at that
/// point.
/** The ray is passed as origin and direction vector, the rectangle as an
 * object {x, y, width, height, r}, where r is the radius of the round corners.
 * as its two end points A and B. The method returns an object { point, tangent }
 * if an intersection was found and null otherwise.
 *
 * If there is more than one intersection point, the first intersection point
 * is returned.
 *
 * Params:
 *   R: start of ray (Point)
 *   v: direction vector of ray (Point)
 *   rect: { x, y, width, height, r } (a rounded rectangle)
 * Returns:
 *   { point, tangent } or null
 */
Point.intersect_inner_ray_with_rect = function(R, v, rect) {
  var ul = new Point(rect.x, rect.y)
    , ur = new Point(rect.x+rect.width, rect.y)
    , ll = new Point(rect.x, rect.y+rect.height)
    , lr = new Point(rect.x+rect.width, rect.y+rect.height)
    , r = rect.r;

  var point = new Point(), side, tangent;

  if (Point.intersect_ray_with_segment(R, v, ul, ll, point)) {
    tangent = new Point(0,1);
  } else if (Point.intersect_ray_with_segment(R, v, ur, lr, point)) {
    tangent = new Point(0,-1);
  } else if (Point.intersect_ray_with_segment(R, v, ul, ur, point)) {
    tangent = new Point(-1,0);
  } else if (Point.intersect_ray_with_segment(R, v, ll, lr, point)) {
    tangent = new Point(1,0);
  } else return null;

  if (r === 0) return {point: point, tangent: tangent };
  var pts;
  if (point.x < ul.x+r && point.y < ul.y+r) {
    pts = (new Circle(ul.x+r, ul.y+r, r)).intersect_with_ray(R, v);
    point = pts[1] || pts[0] || point;
    tangent = point.sub(new Point(ul.x+r, ul.y+r)).get_perpendicular().scale(-1).Normalize();
  } else if (point.x > ur.x-r && point.y < ur.y+r) {
    pts = (new Circle(ur.x-r, ur.y+r, r)).intersect_with_ray(R, v);
    point = pts[1] || pts[0] || point;
    tangent = point.sub(new Point(ur.x-r, ur.y+r)).get_perpendicular().scale(-1).Normalize();
  } else if (point.x < ll.x+r && point.y > ll.y-r) {
    pts = (new Circle(ll.x+r, ll.y-r, r)).intersect_with_ray(R, v);
    point = pts[1] || pts[0] || point;
    tangent = point.sub(new Point(ll.x+r, ll.y-r)).get_perpendicular().scale(-1).Normalize();
  } else if (point.x > lr.x-r && point.y > lr.y-r) {
    pts = (new Circle(lr.x-r, lr.y-r, r)).intersect_with_ray(R, v);
    point = pts[1] || pts[0] || point;
    tangent = point.sub(new Point(lr.x-r, lr.y-r)).get_perpendicular().scale(-1).Normalize();
  }
  return {point: point, tangent: tangent };
}

/// This line is for the automated tests with node.js
if (typeof(exports) != 'undefined') { exports.Point = Point }
/// Copyright by Erik Weitnauer, 2012-2013.

// Array Remove - adopted from John Resig (MIT Licensed)
// Will remove all elements between (including) from and to. Use negative indices
// to count from the back. In-place operation, returns the new length.
Array.remove = function(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = Math.max(0, from < 0 ? array.length + from : from);
  for (var i=0; i<rest.length; i++) array.push(rest[i]);
  return array.length;
};

/// The polygon is initialized as 'closed'.
Polygon = function(pts) {
  this.pts = [];
  this.closed = true;
  this.max_error = 0.2;
  if (pts) this.add_points(pts);
}

Polygon.prototype.copy = function() {
  var p = new Polygon();
  p.closed = this.closed;
  p.max_error = this.max_error;
  for (var i=0; i<this.pts.length; i++) p.pts.push(this.pts[i].copy());
  return p;
}

/// Translates the polygons so its centroid is at 0,0.
Polygon.prototype.move_to_origin = function() {
  var N = this.pts.length;
  var c = this.centroid();
  for (var i=0; i<N; i++) this.pts[i].Sub(c);
}

Polygon.prototype.push = function(pt) {
  this.pts.push(pt);
  return this.pts;
}

Polygon.prototype.add_points = function(pts) {
  for (var i=0; i<pts.length; ++i) this.pts.push(new Point(pts[i][0], pts[i][1]));
}

/// Returns the last vertex.
Polygon.prototype.back = function() {
  return this.pts[this.pts.length-1];
}

/// Ensures that the vertices are ordered counter-clockwise.
/** The vertices are reversed if they are in clockwise order. */
Polygon.prototype.order_vertices = function() {
  if (this.area()<0) this.pts.reverse();
}

/// Returns the bounding box as [x, y, width, height].
Polygon.prototype.bounding_box = function() {
  var minx = this.pts[0].x, maxx = minx
     ,miny = this.pts[0].y, maxy = miny;
  for (var i = 1; i < this.pts.length; i++) {
    minx = Math.min(minx, this.pts[i].x);
    maxx = Math.max(maxx, this.pts[i].x);
    miny = Math.min(miny, this.pts[i].y);
    maxy = Math.max(maxy, this.pts[i].y);
  };
  return {x:minx, y:miny, width:maxx-minx, height:maxy-miny};
}

/// Returns the area of the polygon.
/** The Surveyor's formular is used for the calculation. The area will be
 * negative if the vertices are in clockwise order and positive if the
 * vertices are in counter-clockwise order. Only gives correct results for
 * non self-intersecting polygons. */
Polygon.prototype.area = function() {
  var res = 0.0;
  var prev = this.back();
  for (var i=0; i<this.pts.length; i++) {
    res += prev.cross(this.pts[i]);
    prev = this.pts[i];
  }
  return res * 0.5;
}

/// Returns the centroid (center of gravity).
/** This method only works accurately, if the polygon has a non-zero area and
  * has no intersections. If the area is zero or the polygon is not closed,
  * it simply returns the center of the bounding box. */
Polygon.prototype.centroid = function() {
  var c = new Point(0,0);
  var N = this.pts.length;
  if (N===0) return c;
  var A = this.area();
  if (this.closed && Math.abs(A) >= Point.EPS) { // area not zero, use accurate formular
    var prev = this.back();
    for (var i=0; i<N; ++i) {
      c = c.add(prev.add(this.pts[i]).scale(prev.cross(this.pts[i])));
      prev = this.pts[i];
    }
    c = c.scale(1.0/(6.0*A));
  } else { // area is zero, or polygon is not closed
    var bb = this.bounding_box();
    return new Point(bb.x+bb.width/2, bb.y+bb.height/2);
  }
  return c;
}

/// Returns an array of edge lengths. If 'sorted' is 'true', the lengths are sorted in ascending
/// order. Otherwise, the edges are sorted like the vertices. Only if the polygon is closed, the
/// edge between last and first vertex is included in the array.
Polygon.prototype.get_edge_lengths = function(sorted) {
  var a = [], N = this.pts.length;
  for (var i=0; i<N-1; ++i) a.push(this.pts[i].dist(this.pts[i+1]));
  if (this.closed && N>1) a.push(this.pts[0].dist(this.pts[N-1]));
  if (sorted) a.sort(function(a,b) {return a-b}); // by default, some browsers sort lexically
  return a;
}

/// Returns true if the vertex is convex. (Ordered!)
Polygon.prototype.is_convex = function(idx) {
  var N = this.pts.length;
  return (this.pts[idx].sub(this.pts[(idx+N-1)%N])).cross(this.pts[(idx+1)%N].sub(this.pts[idx])) >= 0;
}

/// Returns index of first concave vertex. (Ordered!)
/// If all vertices are convex, N is returned.
Polygon.prototype.find_notch = function() {
  var N = this.pts.length;
  for (var i=0; i<N; ++i) if (!this.is_convex(i)) return i;
  return N;
}

/// Intersects a line with the polygon.
/** Finds the closest intersection of the passed line with the polygon
  * and returns the index of the vertex before the intersection.
  * If omit1 or omit2 are in [0, N-1], the polygon sides that
  * include at least one of these points are not taken into account.
  * If there is no intersection, N is returned.
  * Params:
  *   origin... start point of ray (Point)
  *   direction ... direction of ray (Point)
  *   closest_intersection ... writes the intersection point into this point (opt.)
  *   omit1, omit2  ... indices of vertices, those edges should be omitted (opt.) */
Polygon.prototype.find_intersection = function(origin, direction,
    closest_intersection, omit1, omit2)
{
  var N = this.pts.length;
  var closest_hit_idx = N;
  if (typeof(omit1) == 'undefined') var omit1 = N;
  if (typeof(omit2) == 'undefined') var omit2 = N;
  if (typeof(closest_intersection) == 'undefined') var closest_intersection = new Point();
  // now iterate over all edges (i,i+1) and find the closest intersection
  for (var i=0; i<N; ++i) {
    // check whether we should omit the current edge
    if (omit1 < N && (i == omit1 || (N+i+1-omit1)%N==0)) continue;
    if (omit2 < N && (i == omit2 || (N+i+1-omit2)%N==0)) continue;

    var hit = new Point();
    if (Point.intersect_ray_with_segment(origin, direction, this.pts[(i+1)%N], this.pts[i], hit)) {
      if (closest_hit_idx == N || hit.dist2(origin) < closest_intersection.dist2(origin)) {
        closest_intersection.x = hit.x; closest_intersection.y = hit.y;
        closest_hit_idx = i;
      }
    }
  }
  return closest_hit_idx;
}


/// Returns true if v1 and v2 (passed as vertex indices) can see each other. (Ordered!)
/** This is the case if the line connecting v1 and v2 lies completely inside
  * the polygon (which means it does not intersect with any edges). Two
  * adjacent vertices can always see each other. A vertex can see itself. */
Polygon.prototype.is_visible = function(v1, v2) {
  var N = this.pts.length;
  // adjacent vertices?
  if (v1 == v2 || v1 == (v2+1)%N || v2 == (v1+1)%N) return true;
  var a = this.pts[(N+v1-1)%N], c = this.pts[(v1+1)%N];
  // the connecting line between v1 and v2 must be inside the polygon
  // this means that if v1 is convex, a-v1-v2 and v1-c-v2 must both be convex
  // if v1 is concave, at least one of a-v1-v2 and v1-c-v2 must be convex
  var convex_a_v1_v2 = (this.pts[v1].sub(a)).cross(this.pts[v2].sub(this.pts[v1])) >= 0;
  var convex_v1_c_v2 = (c.sub(this.pts[v1])).cross(this.pts[v2].sub(c)) >= 0;
  if (this.is_convex(v1)) {
    if (!(convex_a_v1_v2 && convex_v1_c_v2)) return false;
  } else {
    if (!(convex_a_v1_v2 || convex_v1_c_v2)) return false;
  }
  // therefore if v1 is a convex corner,
  var hit = new Point();
  var idx = this.find_intersection(this.pts[v1], this.pts[v2].sub(this.pts[v1]), hit, v1, v2);
  if (idx == N) return true;
  // there was an intersection, but maybe behind v2?
  return (hit.dist2(this.pts[v1]) > this.pts[v2].dist2(this.pts[v1]));
}

/// Splits the polygon into two parts along line between vertices v1 and v2.
/** Returns an array [p1,p2] with the two polygons resulting from the split.
  * p1's vertices will run from v1 to v2 and p2's vertices from v2 to v1 in
  * the same order as in the original polygon. So splitting a counter-clockwise
  * ordered polygon will result in two likely ordered parts. */
Polygon.prototype.split_at = function(v1, v2) {
  var result = [new Polygon(), new Polygon()];
  var N = this.pts.length;
  // add points from v1 to v2 in counter-clockwise order
  for (var i=v1;; ++i) {
    if (i==N) i=0;
    result[0].pts.push(this.pts[i].copy());
    if (i==v2) break;
  }

  // add points from v2 to v1 in counter-clockwise order
  for (var i=v2;; ++i) {
    if (i==N) i=0;
    result[1].pts.push(this.pts[i].copy());
    if (i==v1) break;
  }
  return result;
}

/// Splits the polygon until all parts have at most 'max_vertices' vertices.
/** If the polygon is convex and ordered, the splitted parts will also be
 * convex and ordered. 'max_vertices' must be at least 3.
 * Returns an array containing the splitted polygons. */
Polygon.prototype.split = function(max_vertices) {
  if (max_vertices < 3) return [];
  var N = this.pts.length;
  if (N <= max_vertices) { // nothing to do...
    return [this];
  }
  // Splitting algorithm:
  // To have as little pieces as possible and to avoid acute angles, we
  // search for the vertex with the biggest angle and split the polygon at the
  // line from this vertex to the vertex that is N/2 vertices away from it.
  var biggest_idx = this.find_biggest_angle();
  var opposing_idx = (biggest_idx + Math.round(N/2))%N;
  // split the polygon into two parts
  var parts = this.split_at(biggest_idx, opposing_idx);
  // recursively call this method for each part
  var result = parts[0].split(max_vertices);
  return result.concat(parts[1].split(max_vertices));
}

/// Returns the inner angle of a vertex. (Ordered!)
/** The angle is in [0, 2*PI] and is larger than PI for concave vertices. */
Polygon.prototype.angle = function(idx) {
  var N = this.pts.length;
  var a = this.pts[(N+idx-1)%N],
      b = this.pts[idx],
      c = this.pts[(idx+1)%N];
  var ang = Math.acos(a.sub(b).normalize().mul(c.sub(b).normalize()));
  if (!this.is_convex(idx)) return 2*Math.PI - ang;
  else return ang;
}

/// Returns the index of the vertex with the biggest angle. (Ordered!)
Polygon.prototype.find_biggest_angle = function() {
  var N = this.pts.length;
  var max_angle;
  var max_idx=N;
  for (var i=0; i<N; ++i) {
    var ang = this.angle(i);
    if (max_idx == N || max_angle < ang) {
      max_idx = i;
      max_angle = ang;
    }
  }
  return max_idx;
}

/// Merges all adjacent vertices whose distance is smaller than 'args.min_dist'
/// (default is Point.EPS). When the polygon has 'args.min_vertex_count' (default
/// is 3) or less vertices, no more vertices are merged. */
Polygon.prototype.merge_vertices = function(args) {
  if (args.min_dist == undefined) args.min_dist = Point.EPS;
  if (args.min_vertex_count == undefined) args.min_vertex_count = 3;
  // its more complicated than I thought, because of sequences like 0,0,1,0,0
  // which should be turned into 0,1
  if (args.min_vertex_count < 1) args.min_vertex_count = 1;
  for (;;) {
    var changed = false;
    var N = this.pts.length;
    if (N <= args.min_vertex_count) return;
    var mpts = [];
    // first check, whether first and last point can be merged
    if (this.pts[0].dist(this.back()) < args.min_dist) {
      // yes, so merge them and omit the last point later
      mpts.push(this.back().add(this.pts[0]).scale(0.5));
      N -= 1;
      changed = true;
    } else {
      // no, so just use the first point
      mpts.push(this.pts[0]);
    }
    // now iterate over the rest of the points
    for (var i=1; i<N; ++i) {
      if (mpts[mpts.length-1].dist(this.pts[i]) < args.min_dist) { // merge the two points?
        mpts[mpts.length-1] = mpts[mpts.length-1].add(this.pts[i]).scale(0.5); // yes
        changed = true;
      } else
        mpts.push(this.pts[i]); // no
    }
    if (changed) this.pts = mpts;
    else return;
  }
}

/// Every vertex, that can be removed without an error > 'args.max_error'.
/// (default: Point.EPS). An vertex is removed, if its distance from the line
/// connecting its neighbours is not bigger than 'args.max_error'. This means
/// that, e.g. all vertices with an angle of 180 deg will be removed. When the
/// polygon has 'args.min_vertex_count' (default 3) or less vertices, no more
/// vertices are removed.
Polygon.prototype.remove_superfical_vertices = function(args) {
  if (args.max_error == undefined) args.max_error = Point.EPS;
  if (args.min_vertex_count == undefined) args.min_vertex_count = 3;
  if (args.min_vertex_count < 3) args.min_vertex_count = 3;
  for (;;) {
    var changed = false;
    var N = this.pts.length;
    var i = N-1;
    for (;;) {
      if (N <= args.min_vertex_count) return;
      var A = this.pts[(N+i-1)%N], C = this.pts[(i+1)%N];
      // if this.pts[i] is lying between A and C, we can simply take its distance to
      // AC as the error
      var AC = C.sub(A), ACn = AC.normalize();
      var prod = AC.mul(this.pts[i].sub(A));
      var error;
      if (prod >= 0 && prod < AC.mul(AC)) {
        var proj_i = A.add(ACn.scale((this.pts[i].sub(A)).mul(ACn)));
        error = this.pts[i].dist(proj_i);
      } else {
        // if this.pts[i] is lying in front of A, take its distance to a as error,
        // if it is lying behind C, take its distance to C as error
        if (prod < 0) error = this.pts[i].dist(A);
        else error = this.pts[i].dist(C);
      }
      if (error <= args.max_error) {
        Array.remove(this.pts, i);
        N -= 1;
        changed = true;
      }
      if (i==0) break;
      else i-=1;
    }
    if (!changed) return;
  }
}

Polygon.prototype.toString = function() {
  var points = [];
  for (var i=0; i<this.pts.length; i++) points.push(this.pts[i].x + ',' + this.pts[i].y);
  return '(' + points.join(' ') + ')';
}

/** Parses an SVG rect node into a new closed Polygon with 4 vertices.*/
Polygon.fromSVGRect = function(rect_node) {
  var poly = new Polygon();
  var x = Number(rect_node.getAttribute('x'))
     ,y = Number(rect_node.getAttribute('y'))
     ,w = Number(rect_node.getAttribute('width'))
     ,h = Number(rect_node.getAttribute('height'));
  poly.add_points([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
  poly.order_vertices();
  return poly;
}

/** Parses a svg path decripition, samples it with a number of linear pieces (so that the sampling
  error is no bigger that max_error) and returns the result as a Polygon. If last and first vertex
  are closer than 1e-3 to each other, the 'closed' property of the Polygon is set to 'true'. If the
  'remove_duplicates' parameter is passed as true, adjacent vertices that are closer to each other
  than 1e-3 are merged. */
Polygon.fromSVGPath = function(path_node, max_error, remove_duplicates) {
  var poly = new Polygon();
  poly.closed = false;
  poly.max_error = max_error;

  // get the path segments, insert their start and end points and depending
  // on their type more points to interpolate curved parts
  var segs = []
  var segList = path_node.pathSegList;
  for (var i=segList.numberOfItems-1; i>=0; --i) segs[i] = segList.getItem(i);

  /// iterate over segments
  var ep = new Point(0,0), cp = null; // current end point
  for (var i=0; i<segs.length; ++i) {
    var seg = segs[i];
    if (seg.pathSegType == SVGPathSeg.PATHSEG_CLOSEPATH) {
      poly.closed = true;
      break; // just take the first subpath
    } else {
      switch (seg.pathSegType) {
        case SVGPathSeg.PATHSEG_MOVETO_ABS: ep = new Point(seg.x, seg.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_MOVETO_REL: ep = ep.add(new Point(seg.x, seg.y)); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_ABS: ep = new Point(seg.x, seg.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_REL: ep = ep.add(new Point(seg.x, seg.y)); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS:
          cp = new Point(seg.x2, seg.y2);
          ep = poly.sampleBezier(ep, new Point(seg.x1, seg.y1), cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL:
          cp = new Point(seg.x2+ep.x, seg.y2+ep.y);
          ep = poly.sampleBezier(ep, new Point(seg.x1+ep.x, seg.y1+ep.y),
            cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS:
          cp = new Point(seg.x1, seg.y1);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL:
          cp = new Point(seg.x1+ep.x, seg.y1+ep.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        case SVGPathSeg.PATHSEG_ARC_ABS: throw "not implemented!";
        case SVGPathSeg.PATHSEG_ARC_REL: throw "not implemented!";
        case SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS: ep = new Point(seg.x, ep.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL: ep = new Point(seg.x+ep.x, ep.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS: ep = new Point(ep.x, seg.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL: ep = new Point(ep.x, seg.y+ep.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:
          var mirror_cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          cp = new Point(seg.x2, seg.y2);
          ep = poly.sampleBezier(ep, mirror_cp, cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:
          var mirror_cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          cp = new Point(seg.x2+ep.x, seg.y2+ep.y);
          ep = poly.sampleBezier(ep, mirror_cp, cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:
          cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:
          cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        default: unknown = true; break;
      }
    }
  }
  if (poly.pts.length>1 && poly.pts[0].equals(poly.pts[poly.pts.length-1], 1e-3)) poly.closed = true;
  if (remove_duplicates) poly.remove_superfical_vertices({max_error: 1e-3});
  poly.order_vertices();
  return poly;
}

/// The function approximates a 3rd order bezier by straight line segments that
/// are no further away from the curve than 'this.max_error'. All points except the
/// start and end point are added to the polygon. It returns the end point 'd'.
Polygon.prototype.sampleBezier = function(A, B, C, D) {
  var EPS = 1e-6;
 /* The Algorithm:
  * We first transform the points to a coordinate system with its origin in A
  * and the x-axis on AD. We then project the points to the y-axis
  * (perpendicular to AD) and derivate the curve formular to derive the value
  * of t for which the curve is the furthest away from AD. If the distance is
  * bigger than max_error, we split the curve at that point and call the
  * function recursively for the two curve parts. */
  if (this.max_error <= EPS) throw "max_error must be bigger than EPS";
  if (A.equals(B, EPS) && A.equals(C, EPS) && A.equals(D, EPS)) {
    // all points are the same, so we do nothing
    return;
  }

  var error = 0; // the max. distance between curve and AD
  var t_extreme = 0; // point on the curve that has the max. distance to AD

  // vector AD on which we will project
  var AD = D.sub(A);
  if (AD.len() < EPS) {
    // start point A and end point D of the curve are very close to each other,
    // we will asume they are identical here and project onto AB or AC instead
    // of AD
    AD = (B.dist(A) > B.dist(C)) ? B.sub(A) : B.sub(C);
  }
  // now get the perpendicular to AD
  var pAD = new Point(-AD.y, AD.x);
  pAD.Normalize();
  // now we project B and C onto the perpendicular vector to AD (A and D will be projected to 0)
  var b = (B.sub(A)).mul(pAD);
  var c = (C.sub(A)).mul(pAD);

  // the bezier curve still has the same form:
  // p(t) = (1-t)^3*a + 3(1-t)^2*t*b + 3(1-t)*t^2*c + t^3*d
  // since  a and d are zero we get the derivative
  // p'(t) = 3b(3t^2 - 4t + 1)  +  3c(2t - 3t^2)
  // to get the extremal points we need to solve the quadratic equation
  // 0 = 3(b-c)t^2 + 2(c-2b)t + b
  var k1 = 3*(b-c); var k2 = 2*(c-2*b); var k3 = b;

  if (Math.abs(k1) < EPS) { // points b and c are almost identical
    // we get the equation 0 = -2bt + b and therefore t = 0.5 and
    // p(0.5) = 3*0.125*b + 3*0.125*c
    error = 0.375*Math.abs(b + c);
    t_extreme = 0.5;
  }
  else // points b and c are not identical
  {
    var discriminant = k2*k2 - 4*k1*k3;

    if(Math.abs(discriminant) < EPS) { // discriminant is zero, one solution
      var t = -0.5 * k2 / k1;
      if (0.0 < t && t < 1.0) { // t has to be in the interval [0,1]
        error = 3.0 * Math.abs(b*(1-t)*(1-t)*t + c*(1-t)*t*t);
        t_extreme = t;
      }
    }
    else if (discriminant > 0) // two solutions
    {
      var t1 = 0.5 * (-k2 - Math.sqrt(discriminant)) / k1;
	    var t2 = 0.5 * (-k2 + Math.sqrt(discriminant)) / k1;

	    var v_min = 0.0, v_max = 0.0;
	    var val1 = 0.0, val2 = 0.0;

	    if(0.0 < t1 && t1 < 1.0) {// t has to be in the interval [0,1]
		    val1 = 3.0 * (b*(1-t1)*(1-t1)*t1 + c*(1-t1)*t1*t1);
		    v_min = Math.min(v_min, val1);
		    v_max = Math.max(v_max, val1);
	    }

	    if(0.0 < t2 && t2 < 1.0) {// t has to be in the interval [0,1]
		    val2 = 3.0 * (b*(1-t2)*(1-t2)*t2 + c*(1-t2)*t2*t2);
		    v_min = Math.min(v_min, val2);
		    v_max = Math.max(v_max, val2);
	    }
	    error = v_max - v_min;
	    t_extreme = (Math.abs(val1) > Math.abs(val2)) ? t1 : t2;
    }
    else { /* no real solution, this should never happen */ }
  }

  if (error > this.max_error) {
    // the error is too big, split the curve at t_extreme
    // (1-t)^3*a + 3(1-t)^2*t*b + 3(1-t)*t^2*c + t^3*d
    var t = t_extreme;
    var a1 = A;
    var b1 = A.scale(1-t).add(B.scale(t));
    var c1 = A.scale((1-t)*(1-t)).add(B.scale(2*(1-t)*t)).add(C.scale(t*t));
    var d1 = A.scale((1-t)*(1-t)*(1-t)).add(B.scale(3*(1-t)*(1-t)*t)).add(C.scale(3*(1-t)*t*t)).add(D.scale(t*t*t));
    var a2 = d1;
    var b2 = B.scale((1-t)*(1-t)).add(C.scale(2*(1-t)*t)).add(D.scale(t*t));
    var c2 = C.scale(1-t).add(D.scale(t));
    var d2 = D;
    this.sampleBezier(a1, b1, c1, d1);
    this.sampleBezier(a2, b2, c2, d2);
  } else { // error is fine, just add D to the result
    this.pts.push(D);
  }
  return D;
}

/// 2nd order bezier curve interpolation (by using 3rd order implementation).
/// Adds points to the polygon, except start and end point. Returns end point.
Polygon.prototype.sampleBezier2 = function(a, b, c) {
  return this.sampleBezier(a, new Point((a.x+2*b.x)/3, (a.y+2*b.y)/3),
                           new Point((2*b.x+c.x)/3, (2*b.y+c.y)/3), c);
}

/// Draws itself onto an svg image. Will consider this.x and this.y if set.
Polygon.prototype.renderInSvg = function(doc, parent_node, vertex_element) {
  if (arguments.length<3) var vertex_element = false;
  var poly;
  if (this.closed) poly = doc.createElementNS('http://www.w3.org/2000/svg','polygon');
  else poly = doc.createElementNS('http://www.w3.org/2000/svg','polyline');
  var dx=this.x||0, dy=this.y||0;
  var points = [];
  for (var i=0; i<this.pts.length; ++i) points.push((this.pts[i].x+dx) + ',' + (this.pts[i].y+dy));
  poly.setAttribute('points', points.join(' '));
  poly.style.setProperty('stroke', 'red');
  poly.style.setProperty('stroke-width', '.5px');
  poly.style.setProperty('fill', 'none');
  parent_node.appendChild(poly);
  if (vertex_element) for (var i=0; i<this.pts.length; ++i) {
    var ve = vertex_element.cloneNode(true);
    ve.setAttribute('cx', this.pts[i].x+dx);
    ve.setAttribute('cy', this.pts[i].y+dy);
    parent_node.appendChild(ve);
  }
  return poly;
}

/// Draws itself onto a canvas. Will consider this.x and this.y if set.
Polygon.prototype.renderOnCanvas = function(ctx, do_stroke, do_fill) {
  var dx=this.x||0, dy=this.y||0;
  ctx.beginPath();
  ctx.moveTo(this.pts[0].x + dx, this.pts[0].y + dy);
  for (var i=1; i<this.pts.length; i++) ctx.lineTo(this.pts[i].x + dx, this.pts[i].y + dy);
  if (this.closed) ctx.closePath();
  if (do_stroke) ctx.stroke();
  if (do_fill) ctx.fill();
}

if (typeof(exports) != 'undefined') { exports.Polygon = Polygon }
/// Copyright by Erik Weitnauer, 2012.

/// Decomposes the polygon into convex pieces. (Ordered!)
/** This algorithm works only for polygons that have no holes and no
  * intersections!
  *
  * It recursively splits the polygon until all pieces are convex. They are
  * returned as an array of Polygons. The 'settings' parameter can be used to
  * adjust the behavior of the decomposition algorithm. The depth parameter
  * should be omited or passed as 0.
  *
  * The decomposing algorithm works as follows:
  *   -# Preprocessing of the passed polygon if <tt>settings.preprocess == true</tt>.
  *     - order vertices if  <tt>settings.pre_order == true</tt>
  *       @see order_vertices()
  *     - merge close vertices if <tt>settings.pre_merge_vertices_min_dist > 0</tt>
  *       @see merge_vertices()
  *     - remove superficial vertices if <tt>settings.pre_remove_vertices_max_error > 0</tt>
  *       @see remove_superfical_vertices()
  *   -# If the polygon is concave (has at least one notch), recursively decompose the polygon into convex pieces.
  *     - if connecting the first notch of the polygon with another vertex
  *       yields two convex angles which are no smaller than <tt>settings.s1_min_angle</tt>
  *       the polygon is splitted there.
  *     - otherwise, the polygon is split at the line connecting the notch
  *       and the closest intersection point of the extended notch edges with
  *       the polygon.
  *     - call the decomposition method for both parts
  *   -# If the polygon is convex, check for number of vertices.
  *     - if the number of vertices is larger than <tt>settings.max_vertices</tt>
  *       the polygon is recursively split until all parts have a small enough
  *       number of vertices.
  *       @see split()
  *   -# After the polygon is completely decomposed, it is post-processed if <tt>settings.postprocess == true</tt>. NOT IMPLEMENTED!
  *     - if <tt>settings.post_move_vertices_inside_dist > 0</tt> the algorithm
  *       attempts to move vertices from the periphery of the original polygon
  *       towards its center to improve performance in the physics simulation.
  *       @see move_vertices_inside()
  */
Polygon.prototype.convex_decomposition = function(settings, depth) {
  if (typeof(depth) == 'undefined') depth = 0;
  var convex_polygons = [];

  if (settings.debug_text) {
    console.log("convex_decomposition on depth " + depth + " called for " + this);
  }

  if (settings.preprocess && depth==0) {
    if (settings.pre_order_vertices) this.order_vertices();
    if (settings.pre_merge_vertices_min_dist>0)
      this.merge_vertices({min_dist: settings.pre_merge_vertices_min_dist});
    if (settings.pre_remove_vertices_max_error>0)
      this.remove_superfical_vertices({max_error: settings.pre_remove_vertices_max_error});
    if (settings.debug_text) console.log("after preprocessing: " + this);
  }

  var pts = this.pts;
  var N = pts.length;
  if (N < 3) return []; // we need at least a triangle

  var notch_idx = this.find_notch();
  if (settings.debug_text) console.log("notch_idx is " + notch_idx);
  if (notch_idx < N) { // found a notch at position idx
    var A = pts[(N+notch_idx-1)%N], // vertex before the notch
        B = pts[notch_idx],         // the notch
        C = pts[(notch_idx+1)%N];   // vertex after the notch

    // We will apply two different strategies here:
    // 1. Check whether any of the vertices 'visible' from the notch B are
    // inside the angle(ABC) mirrored at B. If so, simply split the polygon
    // at the connection between B and that vertice. If not we proceed with 2.
    // 2. Find the closest intersection point of AB and CA with the edges of the
    // polygon. Choose the closer one.

    var ps = [];
    // first try strategy 1
    ps = this.cd_strategy_1(notch_idx, settings);
    // and if it could not be applied, strategy 2
    if (ps.length == 0) ps = this.cd_strategy_2(notch_idx, settings);
    // continue convex decomposition with the splitted parts
    convex_polygons = convex_polygons.concat(ps[0].convex_decomposition(settings, depth+1));
    convex_polygons = convex_polygons.concat(ps[1].convex_decomposition(settings, depth+1));
  } else { // found no notch --> the polygon is already convex
    // check the number of vertices
    if (settings.max_vertices < N) {
      if (settings.debug_text) console.log("Too much vertices, splitting...");
      convex_polygons = convex_polygons.concat(this.split(settings.max_vertices));
    } else {
      convex_polygons.push(this);
    }
  }
  return convex_polygons;
}

/// Returns array [p1,p2] of splitted polygons, if successful or an empty array
/// if not.
Polygon.prototype.cd_strategy_1 = function(notch_idx, settings) {
  // Strategy 1:
  // Find all vertices that are in the angle of the notch (but at least 15 deg
  // different from the two egdes of the notch) and visible from the notch.
  // Then take the one closest to the notch.
  if (settings.debug_text) console.log("Applying strategy 1 to notch at " + notch_idx + "...");

  var pts = this.pts;
  var N = pts.length;
  var A = pts[(N+notch_idx-1)%N], // vertex before the notch
      B = pts[notch_idx],         // the notch
      C = pts[(notch_idx+1)%N],   // vertex after the notch
      AB = B.sub(A), BA = A.sub(B), CB = B.sub(C), BC = C.sub(B);
  var split_point = N;
  // now iterate over all vertices to find the ones in the angle of the notch.
  for (var i=0; i<N; ++i) {
    // dont check for A, B and C
    if ((i==notch_idx) || ((N+i-notch_idx-1)%N==0) || ((N+i-notch_idx+1)%N==0)) continue;
    var BI = pts[i].sub(B);
    // check if pts[i] lies between ba and bc
    // if so, the sign of cross(ba, bi) and cross(bc, bi) should be different
    if (BA.cross(BI) * BC.cross(BI) >= 0) {
      if (settings.debug_text) console.log("==> " + i + " is outside of the angle");
      continue;
    }
    // check that angle to both edges is at least settings.min_angle
    var angle_a = Math.acos(BA.normalize().mul(BI.normalize()));
    var angle_c = Math.acos(BC.normalize().mul(BI.normalize()));
    if ((Math.abs(angle_a) < settings.s1_min_angle) || (Math.abs(angle_c) < settings.s1_min_angle)) {
      if (settings.debug_text) console.log("==> " + i + " has angle < " + settings.s1_min_angle*180/Math.PI + " deg with edges of vertex " + notch_idx);
      continue;
    }
    // check if the point is visible
    if (!this.is_visible(notch_idx, i)) {
      if (settings.debug_text) console.log("==> " + i + " is not visible from " + notch_idx);
      continue;
    }
    // we have our candidate! - now take the closest
    if (split_point == N || pts[i].dist2(B) < pts[split_point].dist2(B)) {
      if (settings.debug_text) console.log("==> " + i + " is new nearest split point");
      split_point = i;
    }
  }

  if (split_point < N) {
    if (settings.debug_text) console.log("Strategy1 ==> using vertex " + split_point + " as splitting point.");
    return this.split_at(notch_idx, split_point);
  } else return [];
}

/// Returns array [p1,p2] of splitted polygons.
/// Finds the intersection of the rays from the notch along its adjacent edges
/// with the rest of the polygon.
Polygon.prototype.cd_strategy_2 = function(notch_idx, settings) {
  if (settings.debug_text) console.log("Applying strategy 2 to notch at " + notch_idx + "...");

  var pts = this.pts;
  var N = pts.length;
  var A = pts[(N+notch_idx-1)%N], // vertex before the notch
      B = pts[notch_idx],         // the notch
      C = pts[(notch_idx+1)%N],   // vertex after the notch
      AB = B.sub(A), BA = A.sub(B), CB = B.sub(C), BC = C.sub(B);

  // get the first intersection of AB and CB with the polygon
  var closest_hit, closest_hit_ab = new Point(), closest_hit_cb = new Point(); // closest intersection points
  var closest_hit_idx,
      closest_hit_idx_ab = this.find_intersection(B, AB, closest_hit_ab, (N+notch_idx-1)%N, notch_idx),
      closest_hit_idx_cb = this.find_intersection(B, CB, closest_hit_cb, (notch_idx+1)%N, notch_idx);
  // now take the closer one
  if (B.dist2(closest_hit_ab) <= B.dist2(closest_hit_cb)) {
    closest_hit = closest_hit_ab;
    closest_hit_idx = closest_hit_idx_ab;
  } else {
    closest_hit = closest_hit_cb;
    closest_hit_idx = closest_hit_idx_cb;
  }
  if (settings.debug_text) console.log("==> the closest intersection found is " + closest_hit);
  if (settings.debug_text) console.log("==> the vertex in front of it has the index " + closest_hit_idx);

  // now we split the polygon at notch_idx and closest_idx
  var p1 = new Polygon();
  // add points from notch to intersection in counter-clockwise order
  for (var i=notch_idx;; ++i) {
    if (i==N) i=0;
    p1.pts.push(pts[i].copy());
    if (i==closest_hit_idx) break;
  }
  p1.pts.push(closest_hit.copy());

  var p2 = new Polygon();
  // add points from intersection to notch in counter-clockwise order
  // since the notch is on the line from a to the hit point, we do not need to
  // add it to the polygon
  for (var i=closest_hit_idx+1;; ++i) {
    if (i==N) i=0;
    if (i==notch_idx) break;
    p2.pts.push(pts[i].copy());
  }
  p2.pts.push(closest_hit.copy());

  return [p1,p2];
}

/*******************************************************************************
Spatial Relations Analysis
2011-2013, Erik Weitnauer

Javascript implementation of the algorithmus from Isabelle Bloch in her paper
"Fuzzy Relative Position Between Objects in Image Processing: A Morphological
Approach", IEEE Transactions on Pattern Analysis and Machine Intelligence,
pp. 657-664, July, 1999.

Copyright 2011-2013 Erik Weitnauer (eweitnauer@gmail.com)
*******************************************************************************/

/** Resolution is in the width and height of the lookup table used for calculating
the spatial relation membership. The higher, the better the accuracy, the lower
the better the performance. Scale is the scaling factor for the shapes. Type is the
name of the spatial relationship. f_beta and f_member are functions used to calculate
the spatial membership (see I. Bloch's paper). If type is one of 'above', 'below',
'right', 'left', 'near' or 'far', they can be ommited and default function will be
used. Internally, the html canvas element is used for calculating the body matrix for
a given shape.*/
var SpatialRelationAnalyzer = function(resolution, scale, type, f_beta, f_member) {
  var core = {};
  var res = core.res = resolution;
  core.scale = scale;
  var max_drot = 2*Math.PI/180; // 2 deg. tolerance for rotation change

  function beta_right(dx,dy) {
    // arccos([dx, dy] * [1, 0] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(dx/Math.sqrt(dx*dx+dy*dy)); // right of
  }

  function beta_left(dx,dy) {
    // arccos([dx, dy] * [-1, 0] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(-dx/Math.sqrt(dx*dx+dy*dy)); // left of
  }

  function beta_above(dx,dy) {
    // arccos([dx, dy] * [0, -1] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(-dy/Math.sqrt(dx*dx+dy*dy)); // above
  }

  function beta_below(dx,dy) {
    // arccos([dx, dy] * [0, 1] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(dy/Math.sqrt(dx*dx+dy*dy)); // below
  }

  function dir_membership(val) {
    //return Math.max(0, 1-2*val/Math.PI);
    var a = 2*Math.abs(val)/Math.PI-1;
    return Math.max(0, -a*a*a);
  }

  function dist_euklid(dx, dy) {
    return Math.sqrt(dx*dx + dy*dy);
  }

  function near_membership(val) {
    return 1-1/(1+Math.exp(30*(0.2-val/res/scale)));
    //return 1-1/(1+Math.exp(25/res*(res/12-val)));
  }

  function far_membership(val) {
    return 1/(1+Math.exp(20*(0.35-val/res/scale)));
    //if (val == 0) return 0;
    //return 1/(1+Math.exp(25/res*(res/4-val)));
  }

  core.beta_fs = {'right': beta_right, 'left': beta_left,
            'above': beta_above, 'below': beta_below,
            'near': dist_euklid, 'far': dist_euklid};
  core.member_fs = {'right': dir_membership, 'left': dir_membership,
            'above': dir_membership, 'below': dir_membership,
            'near': near_membership, 'far': far_membership};

  core.f_beta = f_beta || core.beta_fs[type];
  core.f_member = f_member || core.member_fs[type];

  /// Returns the [min, avg, max] membership values for the given spatial relationship
  /// type. Calculates body_matrix of A and spatial landscape of R if neccessary.
  core.getMembership = function(A_shape, R_shape, debug_draw) {
    var R_map = core.getSpatialMembershipMap(R_shape)
       ,A = core.getBodyMatrix(A_shape)
       ,dx = scale*(A_shape.x - R_shape.x)
       ,dy = scale*(A_shape.y - R_shape.y);

    var val = calcObjectMembership(A, R_map, dx, dy);

    if (debug_draw) {
      var can = core.debug_get_canvas('debug');
      core.debug_draw_A_R(A, R_map, can, dx, dy);
    }

    return val;
  }

  /// Checks whether a <= x <= b.
  var is_in = function(x, a, b) {
    return a <= x && x <= b;
  }

  /// Will store one map per shape and type and reuse it if resolution did not change and
  /// rotation did not change by more than max_drot.
  core.getSpatialMembershipMap = function(shape) {
    if (!shape._spatial_maps) shape._spatial_maps = {};
    var map = shape._spatial_maps[type]
    if (!map || map.res != res || !is_in(map.rot, shape.rot-max_drot, shape.rot+max_drot)) {
      map = shape._spatial_maps[type] = {res: res, rot: shape.rot
                                        ,data: calcSpatialMembershipMapFaster(core.getBodyMatrix(shape)
                                        ,core.f_beta, core.f_member)};
    }
    return map.data;
  }

  /// Will store one body matrix per shape and reuse it if resolution did not change
  /// and rotation did not change by more that ~ 2 deg.
  core.getBodyMatrix = function(shape) {
    var bm = shape._body_matrix;
    if (!bm || bm.res != res || !is_in(bm.rot, shape.rot-max_drot, shape.rot+max_drot)) {
      bm = shape._body_matrix = {res: res, rot: shape.rot
                                ,data: calcBodyMatrix(shape)};
    }
    return bm.data;
  }

  /// Draws the shape onto a canvas, converts it to a matrix and returns the matrix.
  /// The dimensions of the matrix might be `res` or `res-1` depending on which one
  /// provides the better fit.
  var calcBodyMatrix = core.calcBodyMatrix = function(shape) {
    var w=res, h=res;
    var bb = shape.bounding_box();
    if (Math.ceil(bb.width * scale) % 2 != res%2) w = res-1;
    if (Math.ceil(bb.height * scale) % 2 != res%2) h = res-1;

    var can = document.createElement('canvas');
    can.width = w; can.height = h;
    var ctx = can.getContext("2d");
    ctx.clearRect(0,0,can.width,can.height);
    ctx.fillStyle = "black";

    ctx.translate(w/2, h/2);
    ctx.scale(scale, scale);
    if (shape.rot != 0) ctx.rotate(shape.rot);
    ctx.translate(-shape.x || 0, -shape.y || 0); // center it
    shape.renderOnCanvas(ctx, false, true);

    // make sure we have at least a single pixel
    var B = canvasToMatrix(can);
    if (B.bounding_box.x0>B.bounding_box.x1) B[Math.floor(h/2)][Math.floor(w/2)] = 1;

    return B;
  }

  /// Creates and returns a matrix such that each canvas pixel with alpha==0
  /// is translated into zero, all others to one.
  /// The matrix gets a 'bounding_box' attribute {x0,x1,y0,y1} that surrounds
  /// all non-zero entries in the matrix.
  var canvasToMatrix = function(can) {
    var width = can.width, height = can.height;
    var img = can.getContext("2d").getImageData(0, 0, width, height).data;
    var M = Matrix.construct(height, width, 0);
    var xmin = width, xmax = 0, ymin = height, ymax = 0;
    for (var j=0; j<height; j++) for (var i=0; i<width; i++) {
      if (img[4*(j*width+i)+3] > 0) {
        M[j][i] = 1;
        xmin = Math.min(xmin, i);
        xmax = Math.max(xmax, i);
        ymin = Math.min(ymin, j);
        ymax = Math.max(ymax, j);
      }
    }
    M.bounding_box = {x0:xmin, y0:ymin, x1:xmax, y1: ymax};
    return M;
  }

  var calcSpatialMembershipMapAccurate = core.calcSpatialMembershipMapAccurate =
  function(R, f_rel, f_mem) {
    //var t_start = Date.now();

    var N = R.N, M = R.M;
    var x0=0, y0=0, x1=R.N-1, y1=R.M-1;
    if (R.bounding_box) {
      var bb = R.bounding_box;
      x0 = bb.x0; x1 = bb.x1; y0 = bb.y0; y1 = bb.y1;
    }
    var O = Matrix.construct(M, N, Infinity);

    // iterate over whole image space
    for (var si=0;si<M;si++) for (var sj=0;sj<N;sj++) {
      // is this a point in the reference object?
      if (R[si][sj] == 1) O[si][sj] = NaN;
      else {
        // iterate over reference object
        for (var i=y0;i<=y1;i++) for (var j=x0;j<=x1;j++) {
          if (R[i][j] != 1) continue;
          O[si][sj] = Math.min(O[si][sj], f_rel(sj-j, si-i));
        }
      }
    }

    // apply membership function
    O = O.map(f_mem);
    //console.log('accurate: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates and returns the spatial membership map for the passed body matrix.
  /// Implementation like in the paper, with 8-neighbourhood and 2 full passes.
  var calcSpatialMembershipMapFast = core.calcSpatialMembershipMapFast =
  function(R, f_rel, f_mem) {
    //var t_start = Date.now();
    var N = R.N, M = R.M;
    // we will store points with best direction in 'O' first
    var O = Matrix.construct(M, N);
    // initialize
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      // is this a point in the reference object?
      if (R[i][j] == 1) O[i][j] = [i,j,0];
    }
    var pass = function(i,j) {
      var current = O[i][j];
      var check = function(ref) {
        var rel = f_rel(j-ref[1], i-ref[0]);
        if (current == 0 || rel <= current[2]) {
          current = [ref[0], ref[1], rel];
        }
      }
      if (i>0) {
        if (j>0 && O[i-1][j-1]) check(O[i-1][j-1]);
        if (O[i-1][j]) check(O[i-1][j]);
        if (j<N-1 && O[i-1][j+1]) check(O[i-1][j+1]);
      }
      if (i<M-1) {
        if (j>0 && O[i+1][j-1]) check(O[i+1][j-1]);
        if (O[i+1][j]) check(O[i+1][j]);
        if (j<N-1 && O[i+1][j+1]) check(O[i+1][j+1]);
      }
      if (j>0 && O[i][j-1]) check(O[i][j-1]);
      if (j<N-1 && O[i][j+1]) check(O[i][j+1]);
      // take the best reference point
      O[i][j] = current;
    }

    // first pass: forward iteration over O
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) pass(i,j);
    // second pass: backward iteration over O
    for (var i=M-1;i>=0;i--) for (var j=N-1;j>=0;j--) pass(i,j);

    // translate O reference points to memberships
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      if (R[i][j]==1) O[i][j] = NaN;
      else if (O[i][j]) O[i][j] = f_mem(O[i][j][2])
      else O[i][j] = NaN;
    }
    //console.log('spatial_membership_fast: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates and returns the spatial membership map for the passed body matrix.
  /// Faster version which uses 4-neighborhood, 2 1/4 passes and some optimizations.
  /// The returned matrix is NaN at all places the object is.
  var calcSpatialMembershipMapFaster = core.calcSpatialMembershipMapFaster =
  function(R, f_rel, f_mem) {
    //var t_start = Date.now();
    var N = R.N, N1 = R.N-1, M = R.M, M1 = R.M-1;
    // we will store points with best direction in 'O' first
    var O = Matrix.construct(M, N, 0);
    // initialize
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      // is this a point in the reference object?
      O[i][j] = (R[i][j] == 1) ? [i,j,0] : [-1,-1,Infinity];
    }
    var pass = function(i, j, right, down) {
      var current = O[i][j];
      var changed = false;
      var check = function(ref) {
        if (ref[0] == -1) return;
        var rel = f_rel(j-ref[1], i-ref[0]);
        if (rel < current[2]) {
          current[0] = ref[0]; current[1] = ref[1]; current[2] = rel;
          changed = true;
        }
      }
      if (right && j>0) check(O[i][j-1]); // left
      if (!right && j<N1) check(O[i][j+1]); // right
      if (down && i>0) check(O[i-1][j]); // above
      if (!down && i<M1) check(O[i+1][j]); // below
      if (right && down && j>0 && i>0) check(O[i-1][j-1]); // left above
      if (right && !down && j>0 && i<M1) check(O[i+1][j-1]); // left below
      if (!right && down && j<N1 && i>0) check(O[i-1][j+1]); // right above
      if (!right && !down && j<N1 && i<M1) check(O[i+1][j+1]); // right below

      if (changed) O[i][j] = current;
    }

    var y0 = R.bounding_box ? Math.max(0, R.bounding_box.y0) : 0;
    var x0 = R.bounding_box ? Math.max(0, R.bounding_box.x0) : 0;
    var y1 = R.bounding_box ? Math.max(0, R.bounding_box.y1) : M1;
    var x1 = R.bounding_box ? Math.max(0, R.bounding_box.x1) : N1;
    for (var i=y0;i<M;i++) for (var j=x0;j<N;j++) pass(i,j,true,true);
    for (var i=y0;i<M;i++) for (var j=x1;j>=0;j--) pass(i,j,false,true);
    for (var i=y1;i>=0;i--) for (var j=x0;j<N;j++) pass(i,j,true,false);
    for (var i=y1;i>=0;i--) for (var j=x1;j>=0;j--) pass(i,j,false,false);

    // translate O reference points to memberships
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      if (R[i][j]==1) O[i][j] = NaN;
      else if (O[i][j][2] != Infinity) O[i][j] = f_mem(O[i][j][2])
      else O[i][j] = NaN;
    }
    //console.log('spatial_membership_faster: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates the membership of the object in the matrix A when placed at
  /// 'x', 'y' in the membership landscape defined by the matrix R.
  /// Points in 'set' that are NaN are ignored. E.g., all points of the reference
  /// object can be marked as NaN.
  /// Returns three measures [min=necessity, average, max=possibility].
  var calcObjectMembership = core.calcObjectMembership = function(A, R, x, y) {
    //var t_start = Date.now();
    var max = null; // possibility
    var avg = 0;    // average
    var min = null; // neccessity
    // iterate over A
    var x0=0, y0=0, x1=A.N, y1=A.M;
    if (A.bounding_box) {
      var bb = A.bounding_box;
      x0 = bb.x0; x1 = bb.x1; y0 = bb.y0; y1 = bb.y1;
    }
    var num = 0;
    for (var i=y0;i<=y1;i++) for (var j=x0;j<=x1;j++) {
      if (!A[i][j]) continue; // skip points not in Object
      var ri = Math.round(i+y), rj = Math.round(j+x);
      if (ri>=R.M || ri<0) continue; // skip points outside 'R'
      if (rj>=R.N || rj<0) continue; // skip points outside 'R'
      var val = R[ri][rj];
      if (isNaN(val)) continue; // skip points that overlap with reference Object
      min = (min === null) ? val : Math.min(min, val);
      avg += val;
      num++;
      max = (max === null) ? val : Math.max(max, val);
    }
    avg /= num;

    //console.log('calcObjectMembership: ' + (Date.now()-t_start) + ' ms.');
    return [min, avg, max];
  }

  /// Creates a new canvas with the given id. If a canvas with that id existed before, its
  /// reused but cleared.
  core.debug_get_canvas = function(id, caption, w, h) {
    w = w || 200; h = h || 200;
    var can = d3.select("canvas#"+id);
    if (can.empty()) {
      var div = d3.select("body")
                  .append('div')
                  .classed('debug-can-div', true)
                  .style('text-align', 'center');
      can = div.append('canvas')
               .attr('id', id);
      if (caption) {
        div.append('br');
        div.append('span')
           .text(caption);
      }
    }
    can.attr('width', w)
       .attr('height', h);
    can[0][0].getContext('2d').clearRect(0,0,w,h);

    return can[0][0];
  }

  /// Draws the matrix `A` onto the canvas. If color is not given, white is used.
  core.debug_draw_matrix = function(A, can, color, dx, dy) {
    color = color || 'white';
    dx = dx || 0; dy = dy || 0;
    dx = Math.round(dx); dy = Math.round(dy);
    var w = A.N, h = A.M;
    var cell = Math.min(can.width/w, can.height/h);
    var ctx = can.getContext("2d");
    for (var i=0; i<A.M; i++) for (var j=0; j<A.N; j++) {
      var col;
      if (isNaN(A[i][j])) {
        col = 'red';
        ctx.globalAlpha = 1;
      } else {
        col = color;
        ctx.globalAlpha = A[i][j] > 0 ? A[i][j] : 0;
      }
      ctx.fillStyle = col;
      var x0 = Math.round((j+dx)*cell), y0 = Math.round((i+dy)*cell)
         ,x1 = Math.round((j+1+dx)*cell), y1 = Math.round((i+1+dy)*cell);
      ctx.fillRect(x0, y0, x1-x0, y1-y0);
    }
  }

  /// Draws the spatial membership landscape in R and then the object in matrix
  /// A on top of it, using dx, dy as transformation.
  core.debug_draw_A_R = function(A, R, can, dx, dy) {
    var ctx = can.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,can.width,can.height);

    if (R) core.debug_draw_matrix(R, can);
    if (A) core.debug_draw_matrix(A, can, 'rgba(0,0,255,0.5)', dx, dy);
  }

  return core;
};

SpatialRelationAnalyzer.conjunction = function(A, B) {
  return A.combine(B, function(a,b) { return Math.min(a,b) });
}

SpatialRelationAnalyzer.disjunction = function(A, B) {
  return A.combine(B, function(a,b) { return Math.max(a,b) });
}

SpatialRelationAnalyzer.subtract = function(A, B) {
  return A.combine(B, function(a,b) { return Math.max(0, a-b) });
}
/// Copyright by Erik Weitnauer, 2012.

/** Vector is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it. */

/// Constructor, takes either an vector to be copied or an array of values as argument.
function Vector(arg) {
  if (arg instanceof Vector) return arg.copy();
  var arr = [];
  if (arg && arg != []) for (var i=0; i<arg.length; i++) arr.push(arg[i]);
  arr.__proto__ = Vector.prototype;
  return arr;
}
Vector.prototype = new Array;

Vector.prototype.has_index = function(key) {
  return this.hasOwnProperty(key);
}

/// Returns a new vector of length len with all values set to val.
Vector.construct = function(len, val) {
  if (!val) val = 0;
  var v = new Vector();
  for (var i=0; i<len; i++) v.push(val);
  return v;
}

/// Returns a new vector with `len` elements drawn randomly between 0 and 1.
Vector.random = function(len) {
  var v = new Vector();
  for (var i=0; i<len; i++) v.push(Math.random());
  return v;
}

/// Returns an deep copy of this vector.
Vector.prototype.copy = function() {
  var v = new Vector();
  for (var i=0; i<this.length; i++) { v.push(this[i]); }
  return v;
}

/// Returns a new vector which is the result of adding this and other.
Vector.prototype.add = function(other) {
  if (this.length != other.length) throw "dimension mismatch";
  var res = new Vector();
  for (var i=0; i<this.length; i++) res[i] = this[i] + other[i];
  return res;
}

/// Adds other to this and returns this.
Vector.prototype.Add = function(other) {
  if (this.length != other.length) throw "dimension mismatch";
  for (var i=0; i<this.length; i++) this[i] += other[i];
  return this;
}

/// Returns a new vector which is the result of subtracting this and other.
Vector.prototype.sub = function(other) {
  if (this.length != other.length) throw "dimension mismatch";
  var res = new Vector();
  for (var i=0; i<this.length; i++) res[i] = this[i] - other[i];
  return res;
}

/// Subtracts other from this and returns this.
Vector.prototype.Sub = function(other) {
  if (this.length != other.length) throw "dimension mismatch";
  for (var i=0; i<this.length; i++) this[i] -= other[i];
  return this;
}

/// Returns the euklidian vector norm.
Vector.prototype.len = function() {
  var sum = 0;
  for (var i=0; i<this.length; i++) sum += this[i]*this[i];
  return Math.sqrt(sum);
}

/// Returns the squared euklidian vector norm.
Vector.prototype.len2 = function() {
  var sum = 0;
  for (var i=0; i<this.length; i++) sum += this[i]*this[i];
  return sum;
}

/// Returns a new vector with same direction, but its length scaled by s.
Vector.prototype.scale = function(s) {
  var v = new Vector();
  for (var i=0; i<this.length; i++) v.push(this[i]*s);
  return v;
}

/// Scales this vector by s and returns it.
Vector.prototype.Scale = function(s) {
  for (var i=0; i<this.length; i++) this[i] *= s;
  return this;
}

/// Returns a new vector with same direction as this but len of 1. (NaN, Nan) for
/// vector (0, 0).
Vector.prototype.normalize = function() {
  var l = 1/this.len();
  return this.scale(l);
}

/// Scales this vector to a len of 1 and returns this. (NaN, Nan) for vector
/// (0, 0).
Vector.prototype.Normalize = function() {
  var l = 1/this.len();
  return this.Scale(l);
}

/// Returns the scalar product of this and the passed vector.
Vector.prototype.mul = function(other) {
  if (this.length != other.length) throw "dimension mismatch";
  var res = 0;
  for (var i=0; i<this.length; i++) res += this[i]*other[i];
  return res;
}

/// Returns the maximum value in the vector.
Vector.prototype.max = function() {
  var res = -Infinity;
  for (var i=0; i<this.length; i++) res = Math.max(res, this[i]);
  return res;
}

/// Returns the minimum value in the vector.
Vector.prototype.min = function() {
  var res = Infinity;
  for (var i=0; i<this.length; i++) res = Math.min(res, this[i]);
  return res;
}

/// This line is for the automated tests with node.js
if (typeof(exports) != 'undefined') { exports.Vector = Vector }
/// Copyright by Erik Weitnauer, 2012.

/** SparseVector is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it. */

/// Constructor, takes the dimension of the vector as argument.
function SparseVector(N) {
  var arr = [];
  arr.N = N || 0;
  arr.__proto__ = SparseVector.prototype;
  arr.el = {};
  return arr;
}
SparseVector.prototype = new Array;

SparseVector.prototype.has_index = function(key) {
  return this.hasOwnProperty(key) && key != 'N';
}

/// Returns an indentical deep copy of this vector.
SparseVector.prototype.copy = function() {
  var v = new SparseVector();
  v.N = this.N;
  for (var i in this) if (this.hasOwnProperty(i)) v[i] = this[i];
  return v;
}

SparseVector.prototype.get = function(idx) {
  return (idx in this) ? this[idx] : 0;
}

SparseVector.prototype.add = function(other) {
  if (!(other instanceof SparseVector)) throw "no mixing of sparse and non sparse vectors!";
  if (this.N != other.N) throw "Can only add vectors of same length";
  var res = this.copy();
  for (var i in other) if (other.has_index(i)) res[i] = (res[i] || 0) + other[i];
  return res;
}

SparseVector.prototype.Add = function(other) {
  if (!(other instanceof SparseVector)) throw "no mixing of sparse and non sparse vectors!";
  if (this.N != other.N) throw "Can only add vectors of same length";
  for (var i in other) if (other.has_index(i)) this[i] = (this[i] || 0) + other[i];
  return this;
}

SparseVector.prototype.sub = function(other) {
  if (!(other instanceof SparseVector)) throw "no mixing of sparse and non sparse vectors!";
  if (this.N != other.N) throw "Can only add vectors of same length";
  var res = this.copy();
  for (var i in other) if (other.has_index(i)) res[i] = (res[i] || 0) - other[i];
  return res;
}

SparseVector.prototype.Sub = function(other) {
  if (!(other instanceof SparseVector)) throw "no mixing of sparse and non sparse vectors!";
  if (this.N != other.N) throw "Can only add vectors of same length";
  for (var i in other) if (other.has_index(i)) this[i] = (this[i] || 0) - other[i];
  return this;
}

SparseVector.prototype.len = function() {
  var sum = 0;
  for (var i in this) if (this.has_index(i)) sum += this[i]*this[i];
  return Math.sqrt(sum);
}

SparseVector.prototype.len2 = function() {
  var sum = 0;
  for (var i in this) if (this.has_index(i)) sum += this[i]*this[i];
  return sum;
}

/// Returns a new vector with same direction, but its length scaled by s.
SparseVector.prototype.scale = function(s) {
  var v = this.copy();
  for (var i in v) if (v.has_index(i)) v[i] *= s;
  return v;
}

/// Scales this vector by s and returns it.
SparseVector.prototype.Scale = function(s) {
  for (var i in this) if (v.has_index(i)) this[i] *= s;
  return this;
}

/// Returns a new vector with same direction as this but len of 1. (NaN, Nan) for
/// vector (0, 0).
SparseVector.prototype.normalize = function() {
  var l = 1/this.len();
  return this.scale(l);
}

/// Scales this vector to a len of 1 and returns this. (NaN, Nan) for vector
/// (0, 0).
SparseVector.prototype.Normalize = function() {
  var l = 1/this.len();
  return this.Scale(l);
}

/// Returns the scalar product of this and the passed vector.
SparseVector.prototype.mul = function(other) {
  var res = 0;
  var oN = (other instanceof SparseVector) ? other.N : other.length;
  if (this.N != oN) throw "Can only mul vectors of same length";
  //for (var i in this) if (this.has_index(i) && other.has_index(i)) res += this[i]*other[i];
  for (var i in this.el) res += this.el[i]*other[i];
  return res;
}
/// Copyright by Erik Weitnauer, 2012.

/** SparseMatrix implemented in triplet format. */

// Constructor, takes matrix dimensions.
function SparseMatrix(M, N) {
  this.N = N || 0;
  this.M = M || 0;
  this.i = [];  // row indices of non-zero values
  this.j = [];  // col indices of now-zero values
  this.v = [];  // non-zero values
}

/// Quite inefficient.
SparseMatrix.prototype.get = function(i,j) {
  for (var p=0; p<this.i.length; p++) {
    if (this.i[p] == i && this.j[p] == j) return this.v[p];  
  }
  return 0;
}

/// Adds an non-zero value to the list. Does not check for existing value at (i,j).
SparseMatrix.prototype.Set = function(i,j,v) {
  this.i.push(i); this.j.push(j); this.v.push(v);
  return this;
}

/// Returns the results of the vector multiplication with x as a new Vector instance. Efficient.
SparseMatrix.prototype.mul = function(x) {
  if (this.N != x.length) throw "dimensions do not match, SparseMatrix-Vector multiplication not possible"
  var y = Vector.construct(x.length, 0);
  for (var k=0; k<this.i.length; k++) y[this.i[k]] += this.v[k] * x[this.j[k]];
  return y;
}

/// SparseMatrix in Compressed Row Storage Format, it is contructed from a SparseMatrix 'sm' and has
/// no methods to change values later. 'sm' is supposed to not contain any duplicate entries.
/// This type of matrix takes a little less memory than the triplet format and the vector multiplication
/// is a tiny bit faster (Chrome: ca. 1%), because there is no random memory access on y and x, but
/// just on y. However, after the construction of the matrix (which is a bit complex), its values
/// cannot easiliy be changed!
/// Conclusion: Don't use it. At least not in Javascript!
function SparseMatrixCRS(sm) {
  this.M = sm.M;
  this.N = sm.N;
  this.j = [];
  this.v = [];
  this.rp = []; // row pointer
  
  var j = Array(this.M); var v = Array(this.M);
  for (var k=0; k<this.M; k++) { j[k] = []; v[k] = []; }
  for (var k=0; k<sm.i.length; k++) {
    j[sm.i[k]].push(sm.j[k]);
    v[sm.i[k]].push(sm.v[k]);
  }
  var count = 0;
  this.rp.push(count);
  for (var k=0; k<this.M; k++) {
    this.j = this.j.concat(j[k]);
    this.v = this.v.concat(v[k]);
    count += j[k].length;
    this.rp.push(count);
  } 
}

/// Returns the results of the vector multiplication with x as a new Vector instance. Efficient.
SparseMatrixCRS.prototype.mul = function(x) {
  if (this.N != x.length) throw "dimensions do not match, SparseMatrix-Vector multiplication not possible"
  var y = Vector.construct(x.length, 0);
  for (var i=0; i<this.M; i++) for (var k=this.rp[i]; k<this.rp[i+1]; k++) y[i] += this.v[k] * x[this.j[k]];
  return y;
}
