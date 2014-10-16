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
