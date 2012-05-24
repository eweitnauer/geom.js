/// Copyright by Erik Weitnauer, 2012.

/** SparseMatrix is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it.
The matrix array contains the row vectors as Vectors.*/

/// Constructor, takes an array of row SparseVectors as arguments.
function SparseMatrix(rows) {
  var arr = [];
  if (rows) {
    var N = rows[0].N;
    for (var i=0; i<rows.length; i++) {
      if (rows[i].N != N) throw "all rows must have the same length";
      if (!(rows[i] instanceof SparseVector)) throw "only sparse vectors are allowed as rows";
      arr.push(rows[i]);
    }
  }
  arr.__proto__ = SparseMatrix.prototype;
  return arr;
}
SparseMatrix.prototype = new Array;

/// Returns a new rows x cols matrix instance.
SparseMatrix.construct = function(rows, cols) {
  var m = new SparseMatrix();
  for (var i=0; i<rows; i++) m.push(new SparseVector(cols));
  return m;
}

SparseMatrix.prototype.get = function(i,j) {
  return this[i].get(j);
}

SparseMatrix.prototype.Set = function(i,j,val) {
  this[i][j] = val;
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

