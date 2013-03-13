/*******************************************************************************
Spatial Relations Analysis
2011-2013, Erik Weitnauer

Javascript implementation of the algorithmus from Isabelle Bloch in her paper
"Fuzzy Relative Position Between Objects in Image Processing: A Morphological
Approach", IEEE Transactions on Pattern Analysis and Machine Intelligence,
pp. 657-664, July, 1999.

Copyright 2011-2013 Erik Weitnauer (eweitnauer@gmail.com)
You may use this code for any purpose, just include this copyright notice. The
code is distributed without any warranty.
*******************************************************************************/

/** Resolution is in the width and height of the lookup table used for calculating
the spatial relation membership. The higher, the better the accuracy, the lower
the better the performance. Scale is the scaling factor for the shapes. Type is the
name of the spatial relationship. f_beta and f_member are functions used to calculate
the spatial membership (see I. Bloch's paper). If type is one of 'above', 'below',
'right', 'left', 'near' or 'far', they can be ommited and default function will be
used. Internally, the html canvas element is used for calculating the body matrix for
a given shape.*/
var SpatialRelationsAnalyzer = function(resolution, scale, type, f_beta, f_member) {
  var core = {};
  var res = core.res = resolution;
  core.scale = scale;
  var max_drot = 2*Math.PI/180; // 2 deg. tolerance for rotation change

  function beta_right(dx,dy) {
    // arccos([dx, dy] * [1, 0] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(dx/Math.sqrt(dx*dx+dy*dy)); // right of
  }

  function beta_left(dx,dy) {
    // arccos([dx, dy] * [-1, 0] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(-dx/Math.sqrt(dx*dx+dy*dy)); // left of
  }

  function beta_above(dx,dy) {
    // arccos([dx, dy] * [0, -1] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(-dy/Math.sqrt(dx*dx+dy*dy)); // above
  }

  function beta_below(dx,dy) {
    // arccos([dx, dy] * [0, 1] / length([dx,dy]))
    if (dx == 0 && dy == 0) return 0;
    else return Math.acos(dy/Math.sqrt(dx*dx+dy*dy)); // below
  }

  function dir_membership(val) {
    return Math.max(0, 1-2*val/Math.PI);
  }

  function dist_euklid(dx, dy) {
    return Math.sqrt(dx*dx + dy*dy);
  }

  function near_membership(val) {
    return 1-1/(1+Math.exp(25/res*(res/8-val)));
  }

  function far_membership(val) {
    if (val == 0) return 0;
    return 1/(1+Math.exp(25/res*(res/4-val)));
  }

  core.beta_fs = {'right': beta_right, 'left': beta_left,
            'above': beta_above, 'below': beta_below,
            'near': dist_euklid, 'far': dist_euklid};
  core.member_fs = {'right': dir_membership, 'left': dir_membership,
            'above': dir_membership, 'below': dir_membership,
            'near': near_membership, 'far': far_membership};

  core.f_beta = f_beta || core.beta_fs[type];
  core.f_member = f_member || core.member_fs[type];

  /// Returns the [min, avg, max] membership values for the given spatial relationship
  /// type. Calculates body_matrix of A and spatial landscape of R if neccessary.
  core.getMembership = function(A_shape, R_shape) {
    return calcObjectMembership(getSpatialMembershipMap(R_shape)
                               ,getBodyMatrix(A_shape)
                               ,scale*(A_shape.x - R_shape.x)
                               ,scale*(A_shape.y - R_shape.y));
  }

  /// Checks whether a <= x <= b.
  var is_in = function(x, a, b) {
    return a <= x && x <= b;
  }

  /// Will store one map per shape and type and reuse it if resolution did not change and
  /// rotation did not change by more than max_drot.
  var getSpatialMembershipMap = function(shape) {
    if (!shape._spatial_maps) shape._spatial_maps = {};
    var map = shape._spatial_maps[type]
    if (!map || map.res != res || !is_in(map.rot, shape.rot-max_drot, shape.rot+max_drot)) {
      map = shape._spatial_maps[type] = {res: res, rot: shape.rot
                                        ,data: calcSpatialMembershipMapFaster(getBodyMatrix(shape)
                                        ,core.f_beta, core.f_member)};
    }
    return map.data;
  }

  /// Will store one body matrix per shape and reuse it if resolution did not change
  /// and rotation did not change by more that ~ 2 deg.
  var getBodyMatrix = function(shape) {
    var bm = shape._body_matrix;
    if (!bm || bm.res != res || !is_in(bm.rot, shape.rot-max_drot, shape.rot+max_drot)) {
      bm = shape._body_matrix = {res: res, rot: shape.rot
                                ,data: calcBodyMatrix(shape)};
    }
    return bm.data;
  }

  /// Draws the shape onto a canvas, converts it to a matrix and returns the matrix.
  /// The dimensions of the matrix might be `res` or `res-1` depending on which one
  /// provides the better fit.
  var calcBodyMatrix = core.calcBodyMatrix = function(shape) {
    var w=res, h=res;
    var bb = shape.bounding_box();
    if (Math.ceil(bb.width * scale) % 2 != res%2) w = res-1;
    if (Math.ceil(bb.height * scale) % 2 != res%2) h = res-1;

    var can = document.createElement('canvas');
    can.width = w; can.height = h;
    var ctx = can.getContext("2d");
    ctx.clearRect(0,0,can.width,can.height);
    ctx.fillStyle = "black";

    ctx.translate(w/2, h/2);
    ctx.scale(scale, scale);
    ctx.translate(-shape.x || 0, -shape.y || 0); // center it
    shape.renderOnCanvas(ctx, false, true);

    // make sure we have at least a single pixel
    var B = canvasToMatrix(can);
    B[Math.floor(h/2)][Math.floor(w/2)] = 1;

    return B;
  }

  /// Creates and returns a matrix such that each canvas pixel with alpha==0
  /// is translated into zero, all others to one.
  /// The matrix gets a 'bounding_box' attribute {x0,x1,y0,y1} that surrounds
  /// all non-zero entries in the matrix.
  var canvasToMatrix = function(can) {
    var width = can.width, height = can.height;
    var img = can.getContext("2d").getImageData(0, 0, width, height).data;
    var M = Matrix.construct(height, width, 0);
    var xmin = width, xmax = 0, ymin = height, ymax = 0;
    for (var j=0; j<height; j++) for (var i=0; i<width; i++) {
      if (img[4*(j*width+i)+3] > 0) {
        M[j][i] = 1;
        xmin = Math.min(xmin, i);
        xmax = Math.max(xmax, i);
        ymin = Math.min(ymin, j);
        ymax = Math.max(ymax, j);
      }
    }
    M.bounding_box = {x0:xmin, y0:ymin, x1:xmax, y1: ymax};
    return M;
  }

  /// Calculates and returns the spatial membership map for the passed body matrix.
  /// Implementation like in the paper, with 8-neighbourhood and 2 full passes.
  var calcSpatialMembershipMapFast = core.calcSpatialMembershipMapFast =
  function(R, f_rel, f_mem) {
    //var t_start = Date.now();
    var N = R.N, M = R.M;
    // we will store points with best direction in 'O' first
    var O = Matrix.construct(M, N, null);
    // initialize
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      // is this a point in the reference object?
      if (R[i][j] == 1) O[i][j] = [i,j,0];
    }
    var pass = function(i,j) {
      var current = O[i][j];
      var check = function(ref) {
        var rel = f_rel(j-ref[1], i-ref[0]);
        if (current == 0 || rel <= current[2]) {
          current = [ref[0], ref[1], rel];
        }
      }
      if (i>0) {
        if (j>0 && O[i-1][j-1]) check(O[i-1][j-1]);
        if (O[i-1][j]) check(O[i-1][j]);
        if (j<N-1 && O[i-1][j+1]) check(O[i-1][j+1]);
      }
      if (i<M-1) {
        if (j>0 && O[i+1][j-1]) check(O[i+1][j-1]);
        if (O[i+1][j]) check(O[i+1][j]);
        if (j<N-1 && O[i+1][j+1]) check(O[i+1][j+1]);
      }
      if (j>0 && O[i][j-1]) check(O[i][j-1]);
      if (j<N-1 && O[i][j+1]) check(O[i][j+1]);
      // take the best reference point
      O[i][j] = current;
    }

    // first pass: forward iteration over O
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) pass(i,j);
    // second pass: backward iteration over O
    for (var i=M-1;i>=0;i--) for (var j=N-1;j>=0;j--) pass(i,j);

    // translate O reference points to memberships
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      if (R[i][j]==1) O[i][j] = -1;
      else if (O[i][j]) O[i][j] = f_mem(O[i][j][2])
      else O[i][j] = -1;
    }
    //console.log('spatial_membership_fast: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates and returns the spatial membership map for the passed body matrix.
  /// Faster version which uses 4-neighborhood, 2 1/4 passes and some optimizations.
  var calcSpatialMembershipMapFaster = core.calcSpatialMembershipMapFaster =
  function(R, f_rel, f_mem) {
    //var t_start = Date.now();
    var N = R.N, N1 = R.N-1, M = R.M, M1 = R.M-1;
    // we will store points with best direction in 'O' first
    var O = Matrix.construct(M, N, 0);
    // initialize
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      // is this a point in the reference object?
      O[i][j] = (R[i][j] == 1) ? [i,j,0] : [-1,-1,Infinity];
    }
    var pass = function(i,j,forward) {
      var current = O[i][j];
      var changed = false;
      var check = function(ref) {
        if (ref[0] == -1) return;
        var rel = f_rel(j-ref[1], i-ref[0]);
        if (rel <= current[2]) {
          current[0] = ref[0]; current[1] = ref[1]; current[2] = rel;
          changed = true;
        }
      }
      // use 4-neighborhood in the right direction
      if (forward) {
        if (i>0) check(O[i-1][j]);
        if (j>0) check(O[i][j-1]);
        if (changed) O[i][j] = current; // take the best reference point
      } else {
        if (i<M1) check(O[i+1][j]);
        if (j<N1) check(O[i][j+1]);
        if (changed) O[i][j] = current; // take the best reference point
      }
    }

    // first pass: forward iteration over O
    var y0 = R.bounding_box ? Math.max(0, R.bounding_box.y0-1) : 0;
    var x0 = R.bounding_box ? Math.max(0, R.bounding_box.x0-1) : 0;
    for (var i=y0;i<M;i++) for (var j=x0;j<N;j++) pass(i,j,true);
    // second pass: backward iteration over O
    for (var i=M1;i>=0;i--) for (var j=N1;j>=0;j--) pass(i,j, false);
    // third pass: forward iteration
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) pass(i,j,true);

    // translate O reference points to memberships
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      if (R[i][j]==1) O[i][j] = -1;
      else if (O[i][j][2] != Infinity) O[i][j] = f_mem(O[i][j][2])
      else O[i][j] = -1;
    }
    //console.log('spatial_membership_faster: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates the membership of the object in the matrix A when placed at
  /// 'x', 'y' in the membership landscape defined by the matrix R.
  /// Points in 'set' that are -1 are ignored. E.g., all points of the reference
  /// object can be marked as -1.
  /// Returns three measures [min=necessity, average, max=possibility].
  var calcObjectMembership = function(R, A, x, y) {
    //var t_start = Date.now();
    var max = null; // possibility
    var avg = 0;    // average
    var min = null; // neccessity
    // iterate over A
    var x0=0, y0=0, x1=A.N, y1=A.M;
    if (A.bounding_box) {
      var bb = A.bounding_box;
      x0 = bb.x0; x1 = bb.x1; y0 = bb.y0; y1 = bb.y1;
    }
    var num = 0;
    for (var i=y0;i<=y1;i++) for (var j=x0;j<=x1;j++) {
      if (!A[i][j]) continue; // skip points not in Object
      var ri = Math.round(i+y), rj = Math.round(j+x);
      if (ri>=R.M || ri<0) continue; // skip points outside 'R'
      if (rj>=R.N || rj<0) continue; // skip points outside 'R'
      var val = R[ri][rj];
      if (val == -1) continue; // skip points that overlap with reference Object
      min = (min === null) ? val : Math.min(min, val);
      avg += val;
      num++;
      max = (max === null) ? val : Math.max(max, val);
    }
    avg /= num;

    //console.log('calcObjectMembership: ' + (Date.now()-t_start) + ' ms.');
    return [min, avg, max];
  }

  var createCanvas = function(id, w, h) {
    return d3.select("body")
             .append('canvas')
             .attr('id', id)
             .attr('width', w)
             .attr('height', h)
             .style('width', '300px')
             .style('height', '300px')[0][0];
  }
  /// Draws the matrix `A` onto a canvas with side length `size` using w and h
  /// as the number of cells in x and y direction. If w and h are not set, A.N and
  /// A.M are used.
  core.debug_draw_matrix = function(A, size) {
    size = size || 300;
    w = A.N; h = A.M;
    var cell = size / Math.max(w, h);
    var can = d3.select('canvas#debug')[0][0] || createCanvas('debug', size, size);
    var ctx = can.getContext("2d");
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,size,size);
    for (var i=0; i<A.M; i++) for (var j=0; j<A.N; j++) {
       var val = Math.floor(A[i][j]*255);
       ctx.fillStyle = A[i][j] == -1 ? 'red' : 'rgb(' + val + ',' + val + ',' + val + ')';
       ctx.fillRect(j*cell, i*cell, cell+1, cell+1);
    }
  }

  /// Draws the spatial membership landscape in R and then the object in matrix
  /// A on top of it, using x, y and rot as transformation.
  core.debug_draw_A_R = function(A, R, dx, dy, size) {
    size = size || 300;
    var w, h, cell;
    if (R) {
      w = R.N; h = R.M;
      cell = size / Math.max(w, h);
      core.debug_draw_matrix(R, size);
    }
    if (A) {
      w = A.N; h = A.M;
      cell = size / Math.max(w, h);
      var can = d3.select('canvas#debug')[0][0] || createCanvas('debug', size, size);
      var ctx = can.getContext("2d");
      ctx.fillStyle = 'green';
      dx = Math.round(dx); dy = Math.round(dy);
      var w2 = A.N/2, h2 = A.M/2;
      for (var i=0; i<A.M; i++) for (var j=0; j<A.N; j++) {
        if (!A[i][j]) continue;
        var x = Math.round(j+dx), y = Math.round(i+dy);
        ctx.fillRect(x*cell, y*cell, cell, cell);
      };
      ctx.fillStyle = 'lightgreen';
      ctx.fillRect((w2-0.5+dx)*cell, (h2-0.5+dy)*cell, cell, cell);
    }
  }

  return core;
};