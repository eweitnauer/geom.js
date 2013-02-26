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
  var AB = B.sub(A), ABn = AB.normalize();
  var k = ABn.mul(P.sub(A));
  if (k<0) return A;
  if (k>AB.len()) return B;
  return A.add(ABn.scale(k));
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

/// This line is for the automated tests with node.js
if (typeof(exports) != 'undefined') { exports.Point = Point }
