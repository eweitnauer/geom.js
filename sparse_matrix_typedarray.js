/// Copyright by Erik Weitnauer, 2012.

/** SparseMatrix implemented in triplet format. */

// Constructor, takes matrix dimensions.
function SparseMatrix(M, N) {
  this.N = N || 0;
  this.M = M || 0;
  this.i = new Int32Array(4000);  // row indices of non-zero values
  this.j = new Int32Array(4000);  // col indices of now-zero values
  this.v = new Float32Array(4000);  // non-zero values
  this.nnz = 0; // number of non-zero values
}

/// Quite inefficient, don't use to read whole matrix.
SparseMatrix.prototype.get = function(i,j) {
  for (var k=0; k<this.nnz; k++) {
    if (this.i[k] == i && this.j[k] == j) return this.v[k];  
  }
  return 0;
}

/// Adds an non-zero value to the list. Does not check for existing value at (i,j).
SparseMatrix.prototype.Set = function(i,j,v) {
  this.i[this.nnz] = i; this.j[this.nnz] = j; this.v[this.nnz] = v;
  this.nnz++;
  return this;
}

/// Returns the results of the vector multiplication with x as a new Vector instance.
SparseMatrix.prototype.mul = function(x) {
  if (this.N != x.length) throw "dimensions do not match, SparseMatrix-Vector multiplication not possible"
  var y = Vector.construct(x.length, 0);
  for (var k=0; k<this.nnz; k++) y[this.i[k]] += this.v[k] * x[this.j[k]];
  return y;
}

