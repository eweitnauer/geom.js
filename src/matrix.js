/// Copyright by Erik Weitnauer, 2012.

/** Matrix is a subclass of array. I use the Prototype chain injection method described in
http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/ for it.
The matrix array contains the row vectors as Vectors.*/

/// Constructor, takes an array of row arrays as argument.
function Matrix(rows) {
  var arr = [];
  arr.M = rows ? rows.length : 0;
  if (rows) {
    arr.N = rows[0].length;
    for (var i=0; i<rows.length; i++) {
      if (rows[i].length != arr.N) throw "all rows must have the same length";
      if (rows[i] instanceof Vector) arr.push(rows[i]); else arr.push(new Vector(rows[i]));
    }
  } else arr.N = 0;
  arr.__proto__ = Matrix.prototype;
  return arr;
}
Matrix.prototype = new Array;

/// Returns a new rows x cols matrix instance with all values set to val.
Matrix.construct = function(M, N, val) {
  if (!val) val = 0;
  var m = new Matrix();
  for (var i=0; i<M; i++) m.push(Vector.construct(N, val));
  m.M = M;
  m.N = N;
  return m;
}

/// Returns a new rows x cols matrix instance with all values set to val.
Matrix.random = function(rows, cols) {
  var m = new Matrix();
  for (var i=0; i<rows; i++) m.push(Vector.random(cols));
  return m;
}

Matrix.prototype.get = function(y,x) {
  return this[y][x];
}

Matrix.prototype.Set = function(y,x,val) {
  this[y][x] = val;
  return this;
}

/// Returns the result of multiplying itself with the passed argument as
/// either a new Vector or Matrix, depending on whether a Vector or Matrix was
/// passed as argument.
Matrix.prototype.mul = function(arg) {
  if (arg instanceof Vector) {
    if (this.N != arg.length) throw "dimension mismatch";
    var res = new Vector();
    for (var i=0; i<this.M; i++) res.push(this[i].mul(arg));
    return res;
  } else if (arg instanceof Matrix) {
    if (this.N != arg.M) throw "dimension mismatch";
    var res = Matrix.construct(this.M, arg.N);
    for (var i = 0; i<res.M; i++) for (var j=0; j<res.N; j++) {
      for (var k=0; k<this.N; k++) res[i][j]+=this[i][k]*arg[k][j];
    }
    return res;
  } else throw "type mismatch";
}

/// Subtracts the passed matrix element-wise from this and returns this.
Matrix.prototype.Sub = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  for (var i=0; i<this.M; i++) this[i].Sub(M[i]);
  return this;
}

/// Returns a new matrix that is the result of subtracting M element-wise from this.
Matrix.prototype.sub = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  var R = new Matrix();
  for (var i=0; i<this.M; i++) R.push(this[i].sub(M[i]));
  R.M = M.M; R.N = M.N;
  return R;
}

/// Adds the passed matrix element-wise from this and returns this.
Matrix.prototype.Add = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  for (var i=0; i<this.M; i++) this[i].Sub(M[i]);
  return this;
}

/// Returns a new matrix that is the result of adding M element-wise from this.
Matrix.prototype.add = function(M) {
  if (M.N != this.N || M.M != this.M) throw "dimension mismatch";
  var R = new Matrix();
  for (var i=0; i<this.M; i++) R.push(this[i].add(M[i]));
  R.M = M.M; R.N = M.N;
  return R;
}


/// Returns the maximum value in the matrix.
Matrix.prototype.max = function() {
  var m = -Infinity;
  for (var i=0; i<this.M; i++) m = Math.max(m, this[i].max());
  return m;
}

/// Constructs a new matrix of the same dimensions like this and other and the
/// values set to the result of the function f_op(this[i][j], other[i][j]) for each element.
Matrix.prototype.combine = function(other, f_op) {
  if (other.N != this.N || other.M != this.M) throw "dimension mismatch";
  var R = Matrix.construct(this.M, this.N);
  for (var i = 0; i<R.M; i++) for (var j=0; j<R.N; j++) R[i][j] = f_op(this[i][j], other[i][j]);
  return R;
}

/// Constructs a new matrix of the same dimensions like this and the
/// values set to the result of the function f(this[i][j]) for each element.
Matrix.prototype.map = function(f) {
  var R = Matrix.construct(this.M, this.N);
  for (var i = 0; i<R.M; i++) for (var j=0; j<R.N; j++) R[i][j] = f(this[i][j]);
  return R;
}

/// Returns the minimum value in the matrix.
Matrix.prototype.min = function() {
  var m = Infinity;
  for (var i=0; i<this.M; i++) m = Math.min(m, this[i].min());
  return m;
}
