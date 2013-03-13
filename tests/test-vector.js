/// Copyright by Erik Weitnauer, 2013.

/// testing with nodeunit
var assert = require('nodeunit').assert;
var Vector = require('../vector.js').Vector;

assert.fequal = function(a, b, msg) {
  assert.ok(a < b+1e-6);
  assert.ok(a > b-1e-6);
}

exports['Vector'] = function(test) {
  var a = new Vector();
  var b = new Vector([1,2]);
  var c = new Vector(b);

  test.equal(a.length, 0);

  test.equal(b.length, 2);
  test.equal(b[0], 1);
  test.equal(b[1], 2);
  test.notEqual(b, c);
  test.equal(c.length, 2);
  test.equal(c[0], 1);
  test.equal(c[1], 2);

  test.done();
}

exports['construct'] = function(test) {
  var a = Vector.construct(5, -1);
  var b = Vector.construct(2);
  var c = Vector.construct();


  test.deepEqual(a, new Vector([-1, -1, -1, -1, -1]));
  test.deepEqual(b, new Vector([0, 0]));
  test.deepEqual(c, new Vector());

  test.done();
}

exports['copy'] = function(test) {
  var a = new Vector([-1,2]);
  var b = a.copy();

  test.deepEqual(b, new Vector([-1,2]));
  test.notEqual(a, b);

  test.done();
}

exports['random'] = function(test) {
  var a = Vector.random(2);
  var b = Vector.random(2);
  test.equal(a.length, 2);
  test.notEqual(a[0], b[0]);
  var val = 0;
  for (var i=0; i<10000; i++) {
    val += Vector.random(1)[0];
  }
  val /= 10000;
  test.ok(0.45 < val && val < 0.55);

  test.done();
}

exports['add'] = function(test) {
  var a = new Vector([-1,2]);
  var b = new Vector([1,2]);
  var c = a.add(b);

  test.deepEqual(c, new Vector([0,4]));
  test.throws(function() { a.add(new Vector([0,1,2])) });
  test.notEqual(a, c);

  test.done();
}

exports['Add'] = function(test) {
  var a = new Vector([-1,2]);
  var b = new Vector([1,2]);
  var c = a.Add(b);

  test.deepEqual(a, new Vector([0,4]));
  test.strictEqual(a, c);
  test.throws(function() { a.Add(new Vector([0,1,2])) });

  test.done();
}

exports['sub'] = function(test) {
  var a = new Vector([-1,2]);
  var b = new Vector([1,2]);
  var c = a.sub(b);

  test.deepEqual(c, new Vector([-2,0]));
  test.throws(function() { a.sub(new Vector([0,1,2])) });
  test.notEqual(a, c);

  test.done();
}

exports['Sub'] = function(test) {
  var a = new Vector([-1,2]);
  var b = new Vector([1,2]);
  var c = a.Sub(b);

  test.deepEqual(a, new Vector([-2,0]));
  test.strictEqual(a, c);
  test.throws(function() { a.Sub(new Vector([0,1,2])) });

  test.done();
}

exports['len'] = function(test) {
  var a = new Vector();
  var b = new Vector([-2]);
  var c = new Vector([1, 2, -3]);

  test.equal(a.len(), 0);
  test.equal(b.len(), 2);
  test.fequal(c.len(), Math.sqrt(14));

  test.done();
}

exports['len2'] = function(test) {
  var a = new Vector();
  var b = new Vector([-2]);
  var c = new Vector([1, 2, -3]);

  test.equal(a.len2(), 0);
  test.equal(b.len2(), 4);
  test.equal(c.len2(), 14);

  test.done();
}

exports['scale'] = function(test) {
  var a = new Vector([1, 2, -3]);
  var b = a.scale(2);

  test.deepEqual(b, new Vector([2, 4, -6]));
  test.notEqual(a, b);

  test.done();
}

exports['Scale'] = function(test) {
  var a = new Vector([1, 2, -3]);
  var b = a.Scale(2);

  test.deepEqual(a, new Vector([2, 4, -6]));
  test.equal(a, b);

  test.done();
}

exports['normalize'] = function(test) {
  var a = new Vector([1, 2, -3]);
  var b = a.normalize();

  test.equal(b.length, 3);
  test.fequal(b[0],  1/Math.sqrt(14));
  test.fequal(b[1],  2/Math.sqrt(14));
  test.fequal(b[2], -3/Math.sqrt(14));
  test.notEqual(a, b);

  test.done();
}

exports['Normalize'] = function(test) {
  var a = new Vector([1, 2, -3]);
  var b = a.Normalize();

  test.equal(a.length, 3);
  test.fequal(a[0],  1/Math.sqrt(14));
  test.fequal(a[1],  2/Math.sqrt(14));
  test.fequal(a[2], -3/Math.sqrt(14));
  test.equal(a, b);

  test.done();
}

exports['mul'] = function(test) {
  var a = new Vector([-1,2,3]);
  var b = new Vector([-2,3,-1]);
  var c = a.mul(b);

  test.equal(c, 5);

  test.done();
}

exports['max'] = function(test) {
  var a = new Vector([-1,2,5,100,-200,3]);
  var b = new Vector([-1]);

  test.equal(a.max(), 100);
  test.equal(b.max(), -1);

  test.done();
}

exports['min'] = function(test) {
  var a = new Vector([-1,2,5,-100,200,3]);
  var b = new Vector([1]);

  test.equal(a.min(), -100);
  test.equal(b.min(), 1);

  test.done();
}