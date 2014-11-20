/// Copyright by Erik Weitnauer, 2012.

/// testing with nodeunit
var assert = require('nodeunit').assert;
var Polygon = require('../src/polygon.js').Polygon,
    Point   = require('../src/point.js').Point;
require('../src/convex_decomposition.js');

assert.fequal = function(a, b, msg) {
  assert.ok(a < b+1e-6);
  assert.ok(a > b-1e-6);
}

exports['copy'] = function(test) {
  var p = new Polygon([[0,0],[-1,1],[1,1]]);
  p.closed = false;
  p.max_error = 0.1;
  var p_cloned = p.copy();
  test.deepEqual(p_cloned, p);
  test.done();
}

exports['back'] = function(test) {
  var p = new Polygon([[0,0],[-1,1],[1,1]]);
  test.deepEqual(p.back(), new Point(1,1));
  var p = new Polygon();
  test.equal(p.back(), undefined);
  test.done();
}

exports['move_to_origin'] = function(test) {
  var p = new Polygon([[-1,-1],[0,-1],[0,0],[-1,0]]);
  p.move_to_origin();
  test.deepEqual(p, new Polygon([[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]]));
  test.deepEqual(p.centroid(), new Point(0,0));
  test.done();
}

exports['order_vertices'] = function(test) {
  var p = new Polygon([[0,0],[-1,1],[1,1]]);
  var q = new Polygon([[1,1],[-1,1],[0,0]]);
  p.order_vertices();
  test.deepEqual(p,q);
  q.order_vertices();
  test.deepEqual(q,p);
  test.done();
}

exports['bounding_box'] = function(test) {
  var p = new Polygon([[0,0],[-1,1],[1,1]]);
  var q = new Polygon([[0,0]]);
  test.deepEqual({x:-1, y:0, width:2, height:1}, p.bounding_box());
  test.deepEqual({x:0, y:0, width:0, height:0}, q.bounding_box());
  test.done();
}

exports['get_edge_lengths'] = function(test) {
  var p = new Polygon();
  p.add_points([[0,0],[4,0],[4,3]]);
  test.deepEqual([4, 3, 5], p.get_edge_lengths());
  test.deepEqual([3, 4, 5], p.get_edge_lengths(true));

  p.closed = false;
  test.deepEqual([4, 3], p.get_edge_lengths());

  var p = new Polygon();
  test.deepEqual([], p.get_edge_lengths(true));
  p.push(new Point(0,0));
  test.deepEqual([], p.get_edge_lengths(true));

  test.done();
}

exports['area'] = function(test) {
  var p = new Polygon();
  p.add_points([[0,0],[0,1],[1,0]]);
  test.fequal(p.area(), -0.5);
  p.order_vertices();
  test.fequal(p.area(), 0.5);
  test.done();
}

exports['merge_vertices'] = function(test) {
  var p = new Polygon([[0,0],[0,0],[1,1],[0,0],[0,0]]);
  var p_target = new Polygon([[0,0],[1,1]]);
  p.merge_vertices({min_vertex_count: 1});
  test.deepEqual(p.pts, p_target.pts);

  var q = new Polygon([[0,0],[1,2]]);
  q.merge_vertices({min_dist: 3, min_vertex_count: 1});
  test.deepEqual(q.pts, [new Point(0.5,1)]);
  test.done();
}

exports['remove_superfical_vertices'] = function(test) {
  var p = new Polygon([[0,0], [1,0.5], [2,0], [3,4], [2,4], [0,4], [1,2]]);
  var p_correct = new Polygon([[0,0], [1,0.5], [2,0], [3,4], [0,4], [1,2]]);
  p.remove_superfical_vertices({max_error: 0.001});
  test.deepEqual(p.pts, p_correct.pts);

  p = new Polygon([[0,0], [1,0.5], [2,0], [3,4], [2,4], [0,4], [1,2]]);
  p_correct = new Polygon([[0,0], [2,0], [3,4], [0,4], [1,2]]);
  p.remove_superfical_vertices({max_error: 0.51});
  test.deepEqual(p.pts, p_correct.pts);

  p = new Polygon([[0,0], [1,0.5], [2,0], [3,4], [2,4], [0,4], [1,2]]);
  p_correct = new Polygon([[0,0], [2,0], [3,4], [0,4]]);
  p.remove_superfical_vertices({max_error: 1.1});
  test.deepEqual(p.pts, p_correct.pts);

  p = new Polygon([[0,0], [1,0], [1,-1], [1,2]]);
  p_correct = new Polygon([[0,0], [1,0], [1,-1], [1,2]]);
  p.remove_superfical_vertices({max_error: 0.1});
  test.deepEqual(p.pts, p_correct.pts);

  p = new Polygon([[0,0], [1,0], [1,3], [1,2]]);
  p_correct = new Polygon([[0,0], [1,0], [1,3], [1,2]]);
  p.remove_superfical_vertices({max_error: 0.1});
  test.deepEqual(p.pts, p_correct.pts);

  test.done();
}

exports['find_notch'] = function(test) {
  var p = new Polygon([[1,1], [5,1], [5,4], [3,2], [1,4]]);
  test.equal(p.find_notch(), 3);
  test.done();
}

exports['is_convex'] = function(test) {
  var p = new Polygon([[0,-4], [2,-4], [1,-2], [2,0], [1,2], [2,4], [0,4]]);
  test.ok(p.is_convex(0));
  test.ok(p.is_convex(1));
  test.ok(!p.is_convex(2));
  test.ok(p.is_convex(3));
  test.ok(!p.is_convex(4));
  test.ok(p.is_convex(5));
  test.ok(p.is_convex(6));
  test.done();
}

exports['find_intersection'] = function(test) {
  var p = new Polygon([[1,1], [5,1], [4,4], [4,8], [1,8], [2,5], [1,5], [2,2]]);
  var hit = new Point();
  var idx = p.find_intersection(p.pts[4], p.pts[5].sub(p.pts[4]), hit, 4, 5);
  test.equal(idx, 0);
  test.fequal(10/3, hit.x);
  test.fequal(1, hit.y);
  test.done();
}

exports['is_visible'] = function(test) {
  var p = new Polygon([[1,1],[5,1],[4,4],[4,8],[1,8],[2,5],[1,5],[2,2]]);
  test.ok(p.is_visible(0,0));
  test.ok(p.is_visible(0,7));
  test.ok(!p.is_visible(0,6));
  test.ok(!p.is_visible(0,5));
  test.ok(!p.is_visible(0,4));
  test.ok(!p.is_visible(0,3));
  test.ok(!p.is_visible(0,2));
  test.ok(p.is_visible(0,1));

  test.ok(p.is_visible(1,0));
  test.ok(p.is_visible(1,7));
  test.ok(p.is_visible(1,6));
  test.ok(p.is_visible(1,5));
  test.ok(p.is_visible(1,4));
  test.ok(!p.is_visible(1,3));
  test.ok(p.is_visible(1,2));
  test.ok(p.is_visible(1,1));

  test.ok(!p.is_visible(2,0));
  test.ok(p.is_visible(2,7));
  test.ok(p.is_visible(2,6));
  test.ok(p.is_visible(2,5));
  test.ok(p.is_visible(2,4));
  test.ok(p.is_visible(2,3));
  test.ok(p.is_visible(2,2));
  test.ok(p.is_visible(2,1));

  test.ok(!p.is_visible(3,0));
  test.ok(p.is_visible(3,7));
  test.ok(!p.is_visible(3,6));
  test.ok(p.is_visible(3,5));
  test.ok(p.is_visible(3,4));
  test.ok(p.is_visible(3,3));
  test.ok(p.is_visible(3,2));
  test.ok(!p.is_visible(3,1));

  test.ok(!p.is_visible(4,0));
  test.ok(!p.is_visible(4,7));
  test.ok(!p.is_visible(4,6));
  test.ok(p.is_visible(4,5));
  test.ok(p.is_visible(4,4));
  test.ok(p.is_visible(4,3));
  test.ok(p.is_visible(4,2));
  test.ok(p.is_visible(4,1));

  test.ok(!p.is_visible(5,0));
  test.ok(p.is_visible(5,7));
  test.ok(p.is_visible(5,6));
  test.ok(p.is_visible(5,5));
  test.ok(p.is_visible(5,4));
  test.ok(p.is_visible(5,3));
  test.ok(p.is_visible(5,2));
  test.ok(p.is_visible(5,1));

  test.ok(!p.is_visible(6,0));
  test.ok(p.is_visible(6,7));
  test.ok(p.is_visible(6,6));
  test.ok(p.is_visible(6,5));
  test.ok(!p.is_visible(6,4));
  test.ok(!p.is_visible(6,3));
  test.ok(p.is_visible(6,2));
  test.ok(p.is_visible(6,1));

  test.ok(p.is_visible(7,0));
  test.ok(p.is_visible(7,7));
  test.ok(p.is_visible(7,6));
  test.ok(p.is_visible(7,5));
  test.ok(!p.is_visible(7,4));
  test.ok(p.is_visible(7,3));
  test.ok(p.is_visible(7,2));
  test.ok(p.is_visible(7,1));

  test.done();
}

exports['split_at'] = function(test) {
  var p = new Polygon([[1,1],[5,1],[4,4],[4,8],[1,8],[2,5],[1,5],[2,2]]);
  var ps = p.split_at(2, 7);
  var q1 = new Polygon([[4,4],[4,8],[1,8],[2,5],[1,5],[2,2]]);
  var q2 = new Polygon([[2,2],[1,1],[5,1],[4,4]]);
  test.deepEqual(ps[0],q1);
  test.deepEqual(ps[1],q2);
  test.done();
}

exports['centroid'] = function(test) {
  p = new Polygon([[99.8013763532903,94.32997884902889]
                  ,[66.43219694485106,92.87142169230287]
                  ,[39.76665383370712,94.35656728947744]
                  ,[0,92.90085]]);
  p.closed = false;
  var c = p.centroid();
  var bb = p.bounding_box();
  test.fequal(c.x, bb.x + bb.width/2);
  test.fequal(c.y, bb.y + bb.height/2);

  p = new Polygon([[1,2]]);
  var c = p.centroid();
  test.fequal(c.x, 1);
  test.fequal(c.y, 2);

  p.push(new Point(1,1));
  c = p.centroid();
  test.fequal(c.x, 1);
  test.fequal(c.y, 1.5);

  p.push(new Point(2,1));
  c = p.centroid();
  test.fequal(c.x, 4./3.);
  test.fequal(c.y, 4./3.);

  p.push(new Point(2,1.5));
  p.push(new Point(2,2));
  c = p.centroid();
  test.fequal(c.x, 1.5);
  test.fequal(c.y, 1.5);
  test.done();
}

exports['angle'] = function(test) {
  p = new Polygon([[1,1], [4,1], [2,3], [2,5], [2,4], [1,3], [1,2]]);
  test.fequal(p.angle(0),Math.PI*0.5);
  test.fequal(p.angle(1),Math.PI*0.25);
  test.fequal(p.angle(2),Math.PI*1.25);
  test.fequal(p.angle(3),0);
  test.fequal(p.angle(4),Math.PI*1.25);
  test.fequal(p.angle(5),Math.PI*0.75);
  test.fequal(p.angle(6),Math.PI);
  test.done();
}

exports['find_biggest_angle'] = function(test) {
  p = new Polygon([[1,1], [5,1], [5,4], [3,5], [1,4]]);
  test.equal(p.find_biggest_angle(), 3);
  test.done();
}

exports['split'] = function(test) {
  var p = new Polygon([[1,1],[5,1],[4,4],[4,8],[1,8],[2,5],[1,5],[2,2]]);
  var parts = p.split(8);
  test.equal(parts.length, 1);
  parts = p.split(5);
  test.equal(parts.length, 2);
  var parts = p.split(3);
  test.equal(parts.length, 6);
  test.done();
}

exports['convex_decomposition'] = function(test) {
  var p = new Polygon([[-1,1], [0,0.5], [1,1], [0.5,0.5], [-0.01,0], [0.01, 0]]);
  var ps = p.convex_decomposition({
    debug_text: false,
    preprocess: true,
    pre_order_vertices: true,
    pre_merge_vertices_min_dist: 0.1,
    pre_remove_vertices_max_error: 0.1,
    max_vertices: 8,
    s1_min_angle: 0.2618 // 15 deg
  });
  //console.log(JSON.stringify(ps));
  test.equal(ps.length, 2);
  test.equal(ps[0].pts.length, 3);
  test.equal(ps[1].pts.length, 3);
  p = new Polygon([[1,1],[2,1],[3,1],[4,1],[4,2],[3,2],[2,2],[1,2]]);
  ps = p.convex_decomposition({
    debug_text: false,
    preprocess: false,
    max_vertices: 4,
    s1_min_angle: 0.2618 // 15 deg
  });
  test.ok(ps.length>1);
  test.done();
}

