/// Copyright by Erik Weitnauer, 2012.

/** Matrix is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it.
The matrix array contains the row vectors as Vectors.*/

/// Constructor, takes an array of row arrays as argument.
function Matrix(rows) {
  var arr = [];
  if (rows) {
    var col_count = rows[0].length;
    for (var i=0; i<rows.length; i++) {
      if (rows[i].length != col_count) throw "all rows must have the same length";
      if (rows[i] instanceof Vector) arr.push(rows[i]); else arr.push(new Vector(rows[i]));
    }
  }
  arr.__proto__ = Matrix.prototype;
  return arr;
}
Matrix.prototype = new Array;

/// Returns a new rows x cols matrix instance with all values set to val.
Matrix.construct = function(rows, cols, val) {
  if (!val) val = 0;
  var m = new Matrix();
  for (var i=0; i<rows; i++) m.push(Vector.construct(cols, val));
  return m;
}

Matrix.prototype.get = function(y,x) {
  return this[y][x];
}

Matrix.prototype.Set = function(y,x,val) {
  this[y][x] = val;
  return this;
}

/// Returns the results of the vector multiplication with v as a new Vector instance.
Matrix.prototype.mul = function(v) {
  if (this.length > 0 && this[0].length != v.length) throw "dimensions do not match, Matrix-Vector multiplication not possible"
  var res = new Vector();
  for (var i=0; i<this.length; i++) res.push(this[i].mul(v));
  return res;
}

