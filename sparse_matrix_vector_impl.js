/// Copyright by Erik Weitnauer, 2012.

/** SparseMatrix is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it.
The matrix array contains the row vectors as Vectors.

This is slower than the SparseMatrix implementation based on triplets, so better use the definition
in sparse_matrix.js. */

/// Constructor, takes an array of row SparseVectors as arguments.
function SparseMatrix(M, N) {
  var arr = [];
  arr.M = M || 0;
  arr.N = N || 0;
  if (arr.M) for (var i=0; i<arr.M; i++) arr.push(new SparseVector(arr.N));
  arr.__proto__ = SparseMatrix.prototype;
  return arr;
}
SparseMatrix.prototype = new Array;

SparseMatrix.prototype.get = function(i,j) {
  return this[i].get(j);
}

SparseMatrix.prototype.Set = function(i,j,val) {
  this[i].el[j] = val;
  return this;
}

/// Returns the results of the vector multiplication with v as a new Vector instance.
SparseMatrix.prototype.mul = function(v) {
  var vN = (v instanceof SparseVector) ? v.N : v.length;
  if (this.length > 0 && this[0].N != vN) throw "dimensions do not match, SparseMatrix-SparseVector multiplication not possible"
  var res = new Vector();
  for (var i=0; i<this.length; i++) res.push(this[i].mul(v));
  return res;
}

