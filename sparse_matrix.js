/// Copyright by Erik Weitnauer, 2012.

/** SparseMatrix implemented in triplet format. */

// Constructor, takes matrix dimensions.
function SparseMatrix(M, N) {
  this.N = N || 0;
  this.M = M || 0;
  this.i = [];  // row indices of non-zero values
  this.j = [];  // col indices of now-zero values
  this.v = [];  // non-zero values
}

/// Quite inefficient.
SparseMatrix.prototype.get = function(i,j) {
  for (var p=0; p<this.i.length; p++) {
    if (this.i[p] == i && this.j[p] == j) return this.v[p];  
  }
  return 0;
}

/// Adds an non-zero value to the list. Does not check for existing value at (i,j).
SparseMatrix.prototype.Set = function(i,j,v) {
  this.i.push(i); this.j.push(j); this.v.push(v);
  return this;
}

/// Returns the results of the vector multiplication with x as a new Vector instance. Efficient.
SparseMatrix.prototype.mul = function(x) {
  if (this.N != x.length) throw "dimensions do not match, SparseMatrix-Vector multiplication not possible"
  var y = Vector.construct(x.length, 0);
  for (var k=0; k<this.i.length; k++) y[this.i[k]] += this.v[k] * x[this.j[k]];
  return y;
}

/// SparseMatrix in Compressed Row Storage Format, it is contructed from a SparseMatrix 'sm' and has
/// no methods to change values later. 'sm' is supposed to not contain any duplicate entries.
/// This type of matrix takes a little less memory than the triplet format and the vector multiplication
/// is a tiny bit faster (Chrome: ca. 1%), because there is no random memory access on y and x, but
/// just on y. However, after the construction of the matrix (which is a bit complex), its values
/// cannot easiliy be changed!
/// Conclusion: Don't use it. At least not in Javascript!
function SparseMatrixCRS(sm) {
  this.M = sm.M;
  this.N = sm.N;
  this.j = [];
  this.v = [];
  this.rp = []; // row pointer
  
  var j = Array(this.M); var v = Array(this.M);
  for (var k=0; k<this.M; k++) { j[k] = []; v[k] = []; }
  for (var k=0; k<sm.i.length; k++) {
    j[sm.i[k]].push(sm.j[k]);
    v[sm.i[k]].push(sm.v[k]);
  }
  var count = 0;
  this.rp.push(count);
  for (var k=0; k<this.M; k++) {
    this.j = this.j.concat(j[k]);
    this.v = this.v.concat(v[k]);
    count += j[k].length;
    this.rp.push(count);
  } 
}

/// Returns the results of the vector multiplication with x as a new Vector instance. Efficient.
SparseMatrixCRS.prototype.mul = function(x) {
  if (this.N != x.length) throw "dimensions do not match, SparseMatrix-Vector multiplication not possible"
  var y = Vector.construct(x.length, 0);
  for (var i=0; i<this.M; i++) for (var k=this.rp[i]; k<this.rp[i+1]; k++) y[i] += this.v[k] * x[this.j[k]];
  return y;
}
