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
