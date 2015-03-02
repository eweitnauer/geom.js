/// Copyright by Erik Weitnauer, 2012.

/// testing with nodeunit
var assert = require('nodeunit').assert;
var Point   = require('../src/point.js').Point;
var Circle = require('../src/circle.js').Circle;

assert.fequal = function(a, b, msg) {
  assert.ok(a < b+1e-6);
  assert.ok(a > b-1e-6);
}

exports['Point'] = function(test) {
  var a = new Point();
  var b = new Point(1,2);
  var c = new Point(b);

  test.equal(a.x, 0);
  test.equal(a.y, 0);

  test.equal(b.x, 1);
  test.equal(b.y, 2);

  test.deepEqual(c, b);
  test.notEqual(c, b);

  test.done();
}

exports['norm_angle'] = function(test) {
  test.fequal(Point.norm_angle(-122*Math.PI+1), 1);
  test.fequal(Point.norm_angle(-2*Math.PI), 0);
  test.fequal(Point.norm_angle(-Math.PI+0.01), -Math.PI+0.01);
  test.fequal(Point.norm_angle(0), 0);
  test.fequal(Point.norm_angle(Math.PI-0.01), Math.PI-0.01);
  test.fequal(Point.norm_angle(2*Math.PI), 0);
  test.fequal(Point.norm_angle(122*Math.PI+1), 1);

  test.done();
}

exports['equals'] = function(test) {
  var a = new Point(-1,-2);

  test.ok(a.equals(new Point(-1,-2), 0));
  test.ok(a.equals(new Point(-1.5,-2), 0.5));
  test.ok(!a.equals(new Point(-1.5,-2), 0.4999));

  test.done();
}

exports['normalize, Normalize'] = function(test) {
  var a = new Point(-1,-2);

  // normalize
  var l = 1/Math.sqrt(5.);
  test.fequal(a.normalize().x, -1 * l);
  test.fequal(a.normalize().y, -2 * l);
  test.deepEqual(a, new Point(-1,-2));

  // Normalize
  a.Normalize();
  test.fequal(a.x, -1 * l);
  test.fequal(a.y, -2 * l);

  test.done();
}

exports['scale, Scale'] = function(test) {
  var a = new Point(-1,-2);

  // scale
  test.equal(a.scale(2).x, -2);
  test.equal(a.scale(2).y, -4);
  test.deepEqual(a, new Point(-1,-2));

  // Scale
  a.Scale(2);
  test.equal(a.x, -2);
  test.equal(a.y, -4);

  test.done();
}

exports['add, Add'] = function(test) {
  var a = new Point(-1,-2);
  var b = new Point(2,3);

  test.equal(a.add(b).x, 1);
  test.equal(a.add(b).y, 1);

  var a2 = a.Add(b);
  test.equal(a2, a);
  test.equal(a.x, 1);
  test.equal(a.y, 1);

  test.done();
}

exports['sub, Sub'] = function(test) {
  var a = new Point(-1,-2);
  var b = new Point(2,3);

  test.equal(a.sub(b).x, -3);
  test.equal(a.sub(b).y, -5);

  var a2 = a.Sub(b);
  test.equal(a2, a);
  test.equal(a.x, -3);
  test.equal(a.y, -5);

  test.done();
}

exports['mul'] = function(test) {
  var a = new Point(-1,-2);
  var b = new Point(2,3);

  // scalar product
  test.equal(a.mul(b), -8);
  test.equal(b.mul(a), -8);
  test.deepEqual(a, new Point(-1,-2));

  test.done();
}

exports['cross'] = function(test) {
  var a = new Point(-1,-2);
  var b = new Point(2,3);

  // cross product
  test.equal(a.cross(b), 1);
  test.equal(b.cross(a), -1);
  test.deepEqual(a, new Point(-1,-2));

  test.done();
}

exports['dist, dist2'] = function(test) {
  var a = new Point(-1,-2);
  var b = new Point(2,3);

  test.equal(a.dist(a), 0);
  test.fequal(a.dist(b), Math.sqrt(34.));
  test.fequal(b.dist(a), Math.sqrt(34.));
  test.fequal(a.dist2(b), 34.);
  test.fequal(b.dist2(a), 34.);

  test.done();
}

exports['len, len2'] = function(test) {
  var a = new Point(-1,-2);

  test.fequal(a.len(), Math.sqrt(5.));
  test.fequal(Point.len(-1,-2), Math.sqrt(5));
  test.equal(a.len2(), 5.);
  test.done();
}

exports['Set'] = function(test) {
  var a = new Point(-1,2);
  var b = new Point(2,3);

  a.Set(b);
  test.notEqual(a, b);
  test.deepEqual(a, b);

  test.done();
}

exports['copy'] = function(test) {
  var a = new Point(-1,2);
  var b = a.copy();

  test.notEqual(a, b);
  test.deepEqual(a, b);

  test.done();
}

exports['rotate, Rotate'] = function(test) {
  var a = new Point(0,1);
  var b = a.rotate(0.5*Math.PI);

  test.equal(a.x, 0);
  test.equal(a.y, 1);
  test.fequal(b.x, -1);
  test.fequal(b.y, 0);

  a.Rotate(-0.5*Math.PI);
  test.fequal(a.x, 1);
  test.fequal(a.y, 0);

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

  A = new Point(1,0); B = new Point(1,0); P = new Point(0,0);
  C = Point.get_closest_point_on_segment(A, B, P);
  test.equal(C.x, 1);
  test.equal(C.y, 0);

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

exports['get_perpendicular'] = function(test) {
  var v = new Point(0,0);
  var p = v.get_perpendicular();
  test.equal(p.x, 0);
  test.equal(p.y, 0);

  v = new Point(2,1);
  p = v.get_perpendicular();
  test.equal(p.x, -1);
  test.equal(p.y, 2);

  test.done();
}

exports['intersect_inner_ray_with_rect'] = function(test) {
  // normal intersection, no rounded corners
  var rect = {x: -0.5, y:-1, width: 1, height: 2, r: 0};
  var R = new Point(0.1,-0.1), v = new Point(-1,0.5);
  var res = Point.intersect_inner_ray_with_rect(R, v, rect);
  test.ok(res);
  test.fequal(res.point.x, -0.5);
  test.fequal(res.point.y, 0.2);
  test.fequal(res.tangent.x, 0);
  test.fequal(Math.abs(res.tangent.y), 1);

  // intersection with corner, no rounded corners
  rect = {x: -0.5, y:-1, width: 1, height: 2, r: 0};
  R = new Point(0,0); v = new Point(-0.5,-1);
  res = Point.intersect_inner_ray_with_rect(R, v, rect);
  test.ok(res);
  test.fequal(res.point.x, -0.5);
  test.fequal(res.point.y, -1);

  // normal intersection, rounded corners
  var r = 0.5;
  rect = {x: -0.5, y:-1, width: 1, height: 2, r: r};
  R = new Point(0,0); v = new Point(0, 1);
  res = Point.intersect_inner_ray_with_rect(R, v, rect);
  test.ok(res);
  test.fequal(res.point.x, 0);
  test.fequal(res.point.y, 1);
  test.fequal(res.tangent.x, 1);
  test.fequal(res.tangent.y, 0);

  // intersection with corner, rounded corners
  r = 1;
  rect = { x: -1, y:-1, width: 2, height: 2, r: r };
  R = new Point(0,0); v = new Point(-0.5,-0.5);
  res = Point.intersect_inner_ray_with_rect(R, v, rect);
  console.log(res.point, res.tangent);
  test.ok(res);
  test.fequal(res.point.x, -1 * r/Math.sqrt(2));
  test.fequal(res.point.y, -1 * r/Math.sqrt(2));
  test.fequal(res.tangent.x, -Math.sqrt(2)/2);
  test.fequal(res.tangent.y, Math.sqrt(2)/2);

  test.done();
}

