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
var SpatialRelationAnalyzer = function(resolution, scale, type, f_beta, f_member) {
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
    //return Math.max(0, 1-2*val/Math.PI);
    var a = 2*Math.abs(val)/Math.PI-1;
    return Math.max(0, -a*a*a);
  }

  function dist_euklid(dx, dy) {
    return Math.sqrt(dx*dx + dy*dy);
  }

  function near_membership(val) {
    return 1-1/(1+Math.exp(30*(0.2-val/res/scale)));
    //return 1-1/(1+Math.exp(25/res*(res/12-val)));
  }

  function far_membership(val) {
    return 1/(1+Math.exp(20*(0.35-val/res/scale)));
    //if (val == 0) return 0;
    //return 1/(1+Math.exp(25/res*(res/4-val)));
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
  core.getMembership = function(A_shape, R_shape, debug_draw) {
    var R_map = core.getSpatialMembershipMap(R_shape)
       ,A = core.getBodyMatrix(A_shape)
       ,dx = scale*(A_shape.x - R_shape.x)
       ,dy = scale*(A_shape.y - R_shape.y);

    var val = calcObjectMembership(A, R_map, dx, dy);

    if (debug_draw) {
      var can = core.debug_get_canvas('debug');
      core.debug_draw_A_R(A, R_map, can, dx, dy);
    }

    return val;
  }

  /// Checks whether a <= x <= b.
  var is_in = function(x, a, b) {
    return a <= x && x <= b;
  }

  /// Will store one map per shape and type and reuse it if resolution did not change and
  /// rotation did not change by more than max_drot.
  core.getSpatialMembershipMap = function(shape) {
    if (!shape._spatial_maps) shape._spatial_maps = {};
    var map = shape._spatial_maps[type]
    if (!map || map.res != res || !is_in(map.rot, shape.rot-max_drot, shape.rot+max_drot)) {
      map = shape._spatial_maps[type] = {res: res, rot: shape.rot
                                        ,data: calcSpatialMembershipMapFaster(core.getBodyMatrix(shape)
                                        ,core.f_beta, core.f_member)};
    }
    return map.data;
  }

  /// Will store one body matrix per shape and reuse it if resolution did not change
  /// and rotation did not change by more that ~ 2 deg.
  core.getBodyMatrix = function(shape) {
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
    if (shape.rot != 0) ctx.rotate(shape.rot);
    ctx.translate(-shape.x || 0, -shape.y || 0); // center it
    shape.renderOnCanvas(ctx, false, true);

    // make sure we have at least a single pixel
    var B = canvasToMatrix(can);
    if (B.bounding_box.x0>B.bounding_box.x1) B[Math.floor(h/2)][Math.floor(w/2)] = 1;

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

  var calcSpatialMembershipMapAccurate = core.calcSpatialMembershipMapAccurate =
  function(R, f_rel, f_mem) {
    //var t_start = Date.now();

    var N = R.N, M = R.M;
    var x0=0, y0=0, x1=R.N-1, y1=R.M-1;
    if (R.bounding_box) {
      var bb = R.bounding_box;
      x0 = bb.x0; x1 = bb.x1; y0 = bb.y0; y1 = bb.y1;
    }
    var O = Matrix.construct(M, N, Infinity);

    // iterate over whole image space
    for (var si=0;si<M;si++) for (var sj=0;sj<N;sj++) {
      // is this a point in the reference object?
      if (R[si][sj] == 1) O[si][sj] = NaN;
      else {
        // iterate over reference object
        for (var i=y0;i<=y1;i++) for (var j=x0;j<=x1;j++) {
          if (R[i][j] != 1) continue;
          O[si][sj] = Math.min(O[si][sj], f_rel(sj-j, si-i));
        }
      }
    }

    // apply membership function
    O = O.map(f_mem);
    //console.log('accurate: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates and returns the spatial membership map for the passed body matrix.
  /// Implementation like in the paper, with 8-neighbourhood and 2 full passes.
  var calcSpatialMembershipMapFast = core.calcSpatialMembershipMapFast =
  function(R, f_rel, f_mem) {
    //var t_start = Date.now();
    var N = R.N, M = R.M;
    // we will store points with best direction in 'O' first
    var O = Matrix.construct(M, N);
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
      if (R[i][j]==1) O[i][j] = NaN;
      else if (O[i][j]) O[i][j] = f_mem(O[i][j][2])
      else O[i][j] = NaN;
    }
    //console.log('spatial_membership_fast: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates and returns the spatial membership map for the passed body matrix.
  /// Faster version which uses 4-neighborhood, 2 1/4 passes and some optimizations.
  /// The returned matrix is NaN at all places the object is.
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
    var pass = function(i, j, right, down) {
      var current = O[i][j];
      var changed = false;
      var check = function(ref) {
        if (ref[0] == -1) return;
        var rel = f_rel(j-ref[1], i-ref[0]);
        if (rel < current[2]) {
          current[0] = ref[0]; current[1] = ref[1]; current[2] = rel;
          changed = true;
        }
      }
      if (right && j>0) check(O[i][j-1]); // left
      if (!right && j<N1) check(O[i][j+1]); // right
      if (down && i>0) check(O[i-1][j]); // above
      if (!down && i<M1) check(O[i+1][j]); // below
      if (right && down && j>0 && i>0) check(O[i-1][j-1]); // left above
      if (right && !down && j>0 && i<M1) check(O[i+1][j-1]); // left below
      if (!right && down && j<N1 && i>0) check(O[i-1][j+1]); // right above
      if (!right && !down && j<N1 && i<M1) check(O[i+1][j+1]); // right below

      if (changed) O[i][j] = current;
    }

    var y0 = R.bounding_box ? Math.max(0, R.bounding_box.y0) : 0;
    var x0 = R.bounding_box ? Math.max(0, R.bounding_box.x0) : 0;
    var y1 = R.bounding_box ? Math.max(0, R.bounding_box.y1) : M1;
    var x1 = R.bounding_box ? Math.max(0, R.bounding_box.x1) : N1;
    for (var i=y0;i<M;i++) for (var j=x0;j<N;j++) pass(i,j,true,true);
    for (var i=y0;i<M;i++) for (var j=x1;j>=0;j--) pass(i,j,false,true);
    for (var i=y1;i>=0;i--) for (var j=x0;j<N;j++) pass(i,j,true,false);
    for (var i=y1;i>=0;i--) for (var j=x1;j>=0;j--) pass(i,j,false,false);

    // translate O reference points to memberships
    for (var i=0;i<M;i++) for (var j=0;j<N;j++) {
      if (R[i][j]==1) O[i][j] = NaN;
      else if (O[i][j][2] != Infinity) O[i][j] = f_mem(O[i][j][2])
      else O[i][j] = NaN;
    }
    //console.log('spatial_membership_faster: ' + (Date.now()-t_start) + ' ms.');
    return O;
  }

  /// Calculates the membership of the object in the matrix A when placed at
  /// 'x', 'y' in the membership landscape defined by the matrix R.
  /// Points in 'set' that are NaN are ignored. E.g., all points of the reference
  /// object can be marked as NaN.
  /// Returns three measures [min=necessity, average, max=possibility].
  var calcObjectMembership = core.calcObjectMembership = function(A, R, x, y) {
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
      if (isNaN(val)) continue; // skip points that overlap with reference Object
      min = (min === null) ? val : Math.min(min, val);
      avg += val;
      num++;
      max = (max === null) ? val : Math.max(max, val);
    }
    avg /= num;

    //console.log('calcObjectMembership: ' + (Date.now()-t_start) + ' ms.');
    return [min, avg, max];
  }

  /// Creates a new canvas with the given id. If a canvas with that id existed before, its
  /// reused but cleared.
  core.debug_get_canvas = function(id, caption, w, h) {
    w = w || 200; h = h || 200;
    var can = d3.select("canvas#"+id);
    if (can.empty()) {
      var div = d3.select("body")
                  .append('div')
                  .classed('debug-can-div', true)
                  .style('text-align', 'center');
      can = div.append('canvas')
               .attr('id', id);
      if (caption) {
        div.append('br');
        div.append('span')
           .text(caption);
      }
    }
    can.attr('width', w)
       .attr('height', h);
    can[0][0].getContext('2d').clearRect(0,0,w,h);

    return can[0][0];
  }

  /// Draws the matrix `A` onto the canvas. If color is not given, white is used.
  core.debug_draw_matrix = function(A, can, color, dx, dy) {
    color = color || 'white';
    dx = dx || 0; dy = dy || 0;
    dx = Math.round(dx); dy = Math.round(dy);
    var w = A.N, h = A.M;
    var cell = Math.min(can.width/w, can.height/h);
    var ctx = can.getContext("2d");
    for (var i=0; i<A.M; i++) for (var j=0; j<A.N; j++) {
      var col;
      if (isNaN(A[i][j])) {
        col = 'red';
        ctx.globalAlpha = 1;
      } else {
        col = color;
        ctx.globalAlpha = A[i][j] > 0 ? A[i][j] : 0;
      }
      ctx.fillStyle = col;
      var x0 = Math.round((j+dx)*cell), y0 = Math.round((i+dy)*cell)
         ,x1 = Math.round((j+1+dx)*cell), y1 = Math.round((i+1+dy)*cell);
      ctx.fillRect(x0, y0, x1-x0, y1-y0);
    }
  }

  /// Draws the spatial membership landscape in R and then the object in matrix
  /// A on top of it, using dx, dy as transformation.
  core.debug_draw_A_R = function(A, R, can, dx, dy) {
    var ctx = can.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,can.width,can.height);

    if (R) core.debug_draw_matrix(R, can);
    if (A) core.debug_draw_matrix(A, can, 'rgba(0,0,255,0.5)', dx, dy);
  }

  return core;
};

SpatialRelationAnalyzer.conjunction = function(A, B) {
  return A.combine(B, function(a,b) { return Math.min(a,b) });
}

SpatialRelationAnalyzer.disjunction = function(A, B) {
  return A.combine(B, function(a,b) { return Math.max(a,b) });
}

SpatialRelationAnalyzer.subtract = function(A, B) {
  return A.combine(B, function(a,b) { return Math.max(0, a-b) });
}