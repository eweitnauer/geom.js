/// Copyright by Erik Weitnauer, 2012.

/// testing with nodeunit
var assert = require('nodeunit').assert;
var Point   = require('../point.js').Point;

assert.fequal = function(a, b, msg) {
  assert.ok(a < b+1e-6);
  assert.ok(a > b-1e-6);
}

exports['basics'] = function(test) {
  var a = new Point(-1,-2);
  var a_orig = a.copy();
  var b = new Point(2,3);

  test.equal(a.x, -1);
  test.equal(a.y, -2);
  test.equal(a_orig.x, -1);
  test.equal(a_orig.y, -2);
  
  // scalar product
  test.equal(a.mul(b), -8);
  test.equal(b.mul(a), -8);
  
  // length and length2
  test.fequal(a.length(), Math.sqrt(5.));
  test.equal(a.length2(), 5.);
  
  // dist and dist2
  test.equal(a.dist(a), 0);
  test.fequal(a.dist(b), Math.sqrt(34.));
  test.fequal(b.dist(a), Math.sqrt(34.));
  test.fequal(a.dist2(b), 34.);
  test.fequal(b.dist2(a), 34.);
  
  // cross
  test.equal(a.cross(b), 1);
  test.equal(b.cross(a), -1);
  
  // Normalize
  var l = 1/Math.sqrt(5.);
  a.Normalize();
  test.fequal(a.x, -1 * l);
  test.fequal(a.y, -2 * l);
  test.fequal(a_orig.normalize().x, a.x);
  test.fequal(a_orig.normalize().y, a.y);
  a = a_orig.copy();
  test.deepEqual(new Point(0,0), (new Point(0,0)).normalize());

  // operators
  test.equal(a.add(b).x, 1);
  test.equal(a.add(b).y, 1);
  test.equal(a.sub(b).x, -3);
  test.equal(a.sub(b).y, -5);
  test.equal(a.scale(2).x, -2);
  test.equal(a.scale(2).y, -4);
  test.done();
}

exports['get_closest_point_on_segment'] = function(test) {
  var A = new Point(-1,0), B = new Point(0,1), P = new Point(1,-1);
  var C = Point.get_closest_point_on_segment(A, B, P);
  test.fequal(C.x, -0.5);
  test.fequal(C.y, 0.5);
  
  A = new Point(0,0); B = new Point(1,0); P = new Point(-1,3);
  C = Point.get_closest_point_on_segment(A, B, P);
  test.fequal(C.x, 0);
  test.fequal(C.y, 0);
  
  A = new Point(0,0); B = new Point(1,0); P = new Point(5,-1);
  C = Point.get_closest_point_on_segment(A, B, P);
  test.fequal(C.x, 1);
  test.fequal(C.y, 0);
  
  A = new Point(0,0); B = new Point(1,0); P = new Point(0.2,0);
  C = Point.get_closest_point_on_segment(A, B, P);
  test.fequal(C.x, 0.2);
  test.fequal(C.y, 0);
  
  test.done();
}

exports['intersect_ray_with_segment'] = function(test) {
  // normal intersection
  var R = new Point(0,10), v = new Point(0,-1);
  var A = new Point(-5,0), B = new Point(3,0);
  var hit = new Point();
  test.ok(Point.intersect_ray_with_segment(R, v, A, B, hit));
  test.fequal(hit.x, 0);
  test.fequal(hit.y, 0);
  
  // intersect with A
  R = new Point(0,10); v = new Point(-0.1,-1);
  A = new Point(-1,0); B = new Point(10,0);
  test.ok(Point.intersect_ray_with_segment(R, v, A, B, hit));
  test.fequal(hit.x, -1);
  test.fequal(hit.y, 0);
  
  // intersect with B
  R = new Point(0,10); v = new Point(1,-1);
  A = new Point(-1,-1); B = new Point(10,0);
  test.ok(Point.intersect_ray_with_segment(R, v, A, B, hit));
  test.fequal(hit.x, 10);
  test.fequal(hit.y, 0);

  // intersection with R on AB
  R = new Point(1,1); v = new Point(1,-2);
  A = new Point(0,0); B = new Point(2,2);
  test.ok(Point.intersect_ray_with_segment(R, v, A, B, hit));
  test.fequal(hit.x, 1);
  test.fequal(hit.y, 1);

  // intersection with parallel lines
  R = new Point(0,5); v = new Point(0,-2);
  A = new Point(0,0); B = new Point(0,-1);
  test.ok(Point.intersect_ray_with_segment(R, v, A, B, hit));
  test.fequal(hit.x, 0);
  test.fequal(hit.y, 0);
  
  // no intersection (wrong direction)
  R = new Point(0,1); v = new Point(0,1);
  A = new Point(-1,0); B = new Point(1,0);
  test.ok(!Point.intersect_ray_with_segment(R, v, A, B, hit));
  
  // no intersection (parallel lines)
  R = new Point(0,1); v = new Point(1,0);
  A = new Point(-1,0); B = new Point(1,0);
  test.ok(!Point.intersect_ray_with_segment(R, v, A, B, hit));

  test.done();
}

