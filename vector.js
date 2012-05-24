/// Copyright by Erik Weitnauer, 2012.

/** Vector is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it. */

/// Constructor, takes an array of values as argument.
function Vector(vals) {
  var arr = [];
  if (vals && vals != []) arr.push.apply(arr, vals);
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

Vector.random = function(len) {
  var v = new Vector();
  for (var i=0; i<len; i++) v.push(Math.random());
  return v;
}

/// Returns an indentical deep copy of this vector.
Vector.prototype.copy = function() {
  var v = new Vector();
  for (var i=0; i<this.length; i++) { v.push(this[i]); }
  return v;
}

Vector.prototype.add = function(other) {
  if (this.length != other.length) throw "Can only add vectors of same length";
  var res = new Vector();
  for (var i=0; i<this.length; i++) res[i] = this[i] + other[i];
  return res;
}

Vector.prototype.Add = function(other) {
  if (this.length != other.length) throw "Can only add vectors of same length";
  for (var i=0; i<this.length; i++) this[i] += other[i];
  return this;
}

Vector.prototype.sub = function(other) {
  if (this.length != other.length) throw "Can only sub vectors of same length";
  var res = new Vector();
  for (var i=0; i<this.length; i++) res[i] = this[i] - other[i];
  return res;
}

Vector.prototype.Sub = function(other) {
  if (this.length != other.length) throw "Can only sub vectors of same length";
  for (var i=0; i<this.length; i++) this[i] -= other[i];
  return this;
}

Vector.prototype.len = function() {
  var sum = 0;
  for (var i=0; i<this.length; i++) sum += this[i]*this[i];
  return Math.sqrt(sum);
}

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
  if (this.length != other.length) throw "Can only mul vectors of same length";
  var res = 0;
  for (var i=0; i<this.length; i++) res += this[i]*other[i];
  return res;
}
