/// Copyright by Erik Weitnauer, 2012-2013.

// Array Remove - adopted from John Resig (MIT Licensed)
// Will remove all elements between (including) from and to. Use negative indices
// to count from the back. In-place operation, returns the new length.
Array.remove = function(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = Math.max(0, from < 0 ? array.length + from : from);
  for (var i=0; i<rest.length; i++) array.push(rest[i]);
  return array.length;
};

/// The polygon is initialized as 'closed'.
Polygon = function(pts) {
  this.pts = [];
  this.closed = true;
  this.max_error = 0.2;
  if (pts) this.add_points(pts);
}

Polygon.prototype.copy = function() {
  var p = new Polygon();
  p.closed = this.closed;
  p.max_error = this.max_error;
  for (var i=0; i<this.pts.length; i++) p.pts.push(this.pts[i].copy());
  return p;
}

/// Translates the polygons so its centroid is at 0,0.
Polygon.prototype.move_to_origin = function() {
  var N = this.pts.length;
  var c = this.centroid();
  for (var i=0; i<N; i++) this.pts[i].Sub(c);
}

Polygon.prototype.push = function(pt) {
  this.pts.push(pt);
  return this.pts;
}

Polygon.prototype.add_points = function(pts) {
  for (var i=0; i<pts.length; ++i) this.pts.push(new Point(pts[i][0], pts[i][1]));
}

/// Returns the last vertex.
Polygon.prototype.back = function() {
  return this.pts[this.pts.length-1];
}

/// Ensures that the vertices are ordered counter-clockwise.
/** The vertices are reversed if they are in clockwise order. */
Polygon.prototype.order_vertices = function() {
  if (this.area()<0) this.pts.reverse();
}

/// Returns the bounding box as [x, y, width, height].
Polygon.prototype.bounding_box = function() {
  var minx = this.pts[0].x, maxx = minx
     ,miny = this.pts[0].y, maxy = miny;
  for (var i = 1; i < this.pts.length; i++) {
    minx = Math.min(minx, this.pts[i].x);
    maxx = Math.max(maxx, this.pts[i].x);
    miny = Math.min(miny, this.pts[i].y);
    maxy = Math.max(maxy, this.pts[i].y);
  };
  return {x:minx, y:miny, width:maxx-minx, height:maxy-miny};
}

/// Returns the area of the polygon.
/** The Surveyor's formular is used for the calculation. The area will be
 * negative if the vertices are in clockwise order and positive if the
 * vertices are in counter-clockwise order. Only gives correct results for
 * non self-intersecting polygons. */
Polygon.prototype.area = function() {
  var res = 0.0;
  var prev = this.back();
  for (var i=0; i<this.pts.length; i++) {
    res += prev.cross(this.pts[i]);
    prev = this.pts[i];
  }
  return res * 0.5;
}

/// Returns the centroid (center of gravity).
/** This method only works accurately, if the polygon has a non-zero area and
  * has no intersections. If the area is zero or the polygon is not closed,
  * it simply returns the center of the bounding box. */
Polygon.prototype.centroid = function() {
  var c = new Point(0,0);
  var N = this.pts.length;
  if (N===0) return c;
  var A = this.area();
  if (this.closed && Math.abs(A) >= Point.EPS) { // area not zero, use accurate formular
    var prev = this.back();
    for (var i=0; i<N; ++i) {
      c = c.add(prev.add(this.pts[i]).scale(prev.cross(this.pts[i])));
      prev = this.pts[i];
    }
    c = c.scale(1.0/(6.0*A));
  } else { // area is zero, or polygon is not closed
    var bb = this.bounding_box();
    return new Point(bb.x+bb.width/2, bb.y+bb.height/2);
  }
  return c;
}

/// Returns an array of edge lengths. If 'sorted' is 'true', the lengths are sorted in ascending
/// order. Otherwise, the edges are sorted like the vertices. Only if the polygon is closed, the
/// edge between last and first vertex is included in the array.
Polygon.prototype.get_edge_lengths = function(sorted) {
  var a = [], N = this.pts.length;
  for (var i=0; i<N-1; ++i) a.push(this.pts[i].dist(this.pts[i+1]));
  if (this.closed && N>1) a.push(this.pts[0].dist(this.pts[N-1]));
  if (sorted) a.sort(function(a,b) {return a-b}); // by default, some browsers sort lexically
  return a;
}

/// Returns true if the vertex is convex. (Ordered!)
Polygon.prototype.is_convex = function(idx) {
  var N = this.pts.length;
  return (this.pts[idx].sub(this.pts[(idx+N-1)%N])).cross(this.pts[(idx+1)%N].sub(this.pts[idx])) >= 0;
}

/// Returns index of first concave vertex. (Ordered!)
/// If all vertices are convex, N is returned.
Polygon.prototype.find_notch = function() {
  var N = this.pts.length;
  for (var i=0; i<N; ++i) if (!this.is_convex(i)) return i;
  return N;
}

/// Intersects a line with the polygon.
/** Finds the closest intersection of the passed line with the polygon
  * and returns the index of the vertex before the intersection.
  * If omit1 or omit2 are in [0, N-1], the polygon sides that
  * include at least one of these points are not taken into account.
  * If there is no intersection, N is returned.
  * Params:
  *   origin... start point of ray (Point)
  *   direction ... direction of ray (Point)
  *   closest_intersection ... writes the intersection point into this point (opt.)
  *   omit1, omit2  ... indices of vertices, those edges should be omitted (opt.) */
Polygon.prototype.find_intersection = function(origin, direction,
    closest_intersection, omit1, omit2)
{
  var N = this.pts.length;
  var closest_hit_idx = N;
  if (typeof(omit1) == 'undefined') var omit1 = N;
  if (typeof(omit2) == 'undefined') var omit2 = N;
  if (typeof(closest_intersection) == 'undefined') var closest_intersection = new Point();
  // now iterate over all edges (i,i+1) and find the closest intersection
  for (var i=0; i<N; ++i) {
    // check whether we should omit the current edge
    if (omit1 < N && (i == omit1 || (N+i+1-omit1)%N==0)) continue;
    if (omit2 < N && (i == omit2 || (N+i+1-omit2)%N==0)) continue;

    var hit = new Point();
    if (Point.intersect_ray_with_segment(origin, direction, this.pts[(i+1)%N], this.pts[i], hit)) {
      if (closest_hit_idx == N || hit.dist2(origin) < closest_intersection.dist2(origin)) {
        closest_intersection.x = hit.x; closest_intersection.y = hit.y;
        closest_hit_idx = i;
      }
    }
  }
  return closest_hit_idx;
}


/// Returns true if v1 and v2 (passed as vertex indices) can see each other. (Ordered!)
/** This is the case if the line connecting v1 and v2 lies completely inside
  * the polygon (which means it does not intersect with any edges). Two
  * adjacent vertices can always see each other. A vertex can see itself. */
Polygon.prototype.is_visible = function(v1, v2) {
  var N = this.pts.length;
  // adjacent vertices?
  if (v1 == v2 || v1 == (v2+1)%N || v2 == (v1+1)%N) return true;
  var a = this.pts[(N+v1-1)%N], c = this.pts[(v1+1)%N];
  // the connecting line between v1 and v2 must be inside the polygon
  // this means that if v1 is convex, a-v1-v2 and v1-c-v2 must both be convex
  // if v1 is concave, at least one of a-v1-v2 and v1-c-v2 must be convex
  var convex_a_v1_v2 = (this.pts[v1].sub(a)).cross(this.pts[v2].sub(this.pts[v1])) >= 0;
  var convex_v1_c_v2 = (c.sub(this.pts[v1])).cross(this.pts[v2].sub(c)) >= 0;
  if (this.is_convex(v1)) {
    if (!(convex_a_v1_v2 && convex_v1_c_v2)) return false;
  } else {
    if (!(convex_a_v1_v2 || convex_v1_c_v2)) return false;
  }
  // therefore if v1 is a convex corner,
  var hit = new Point();
  var idx = this.find_intersection(this.pts[v1], this.pts[v2].sub(this.pts[v1]), hit, v1, v2);
  if (idx == N) return true;
  // there was an intersection, but maybe behind v2?
  return (hit.dist2(this.pts[v1]) > this.pts[v2].dist2(this.pts[v1]));
}

/// Splits the polygon into two parts along line between vertices v1 and v2.
/** Returns an array [p1,p2] with the two polygons resulting from the split.
  * p1's vertices will run from v1 to v2 and p2's vertices from v2 to v1 in
  * the same order as in the original polygon. So splitting a counter-clockwise
  * ordered polygon will result in two likely ordered parts. */
Polygon.prototype.split_at = function(v1, v2) {
  var result = [new Polygon(), new Polygon()];
  var N = this.pts.length;
  // add points from v1 to v2 in counter-clockwise order
  for (var i=v1;; ++i) {
    if (i==N) i=0;
    result[0].pts.push(this.pts[i].copy());
    if (i==v2) break;
  }

  // add points from v2 to v1 in counter-clockwise order
  for (var i=v2;; ++i) {
    if (i==N) i=0;
    result[1].pts.push(this.pts[i].copy());
    if (i==v1) break;
  }
  return result;
}

/// Splits the polygon until all parts have at most 'max_vertices' vertices.
/** If the polygon is convex and ordered, the splitted parts will also be
 * convex and ordered. 'max_vertices' must be at least 3.
 * Returns an array containing the splitted polygons. */
Polygon.prototype.split = function(max_vertices) {
  if (max_vertices < 3) return [];
  var N = this.pts.length;
  if (N <= max_vertices) { // nothing to do...
    return [this];
  }
  // Splitting algorithm:
  // To have as little pieces as possible and to avoid acute angles, we
  // search for the vertex with the biggest angle and split the polygon at the
  // line from this vertex to the vertex that is N/2 vertices away from it.
  var biggest_idx = this.find_biggest_angle();
  var opposing_idx = (biggest_idx + Math.round(N/2))%N;
  // split the polygon into two parts
  var parts = this.split_at(biggest_idx, opposing_idx);
  // recursively call this method for each part
  var result = parts[0].split(max_vertices);
  return result.concat(parts[1].split(max_vertices));
}

/// Returns the inner angle of a vertex. (Ordered!)
/** The angle is in [0, 2*PI] and is larger than PI for concave vertices. */
Polygon.prototype.angle = function(idx) {
  var N = this.pts.length;
  var a = this.pts[(N+idx-1)%N],
      b = this.pts[idx],
      c = this.pts[(idx+1)%N];
  var ang = Math.acos(a.sub(b).normalize().mul(c.sub(b).normalize()));
  if (!this.is_convex(idx)) return 2*Math.PI - ang;
  else return ang;
}

/// Returns the index of the vertex with the biggest angle. (Ordered!)
Polygon.prototype.find_biggest_angle = function() {
  var N = this.pts.length;
  var max_angle;
  var max_idx=N;
  for (var i=0; i<N; ++i) {
    var ang = this.angle(i);
    if (max_idx == N || max_angle < ang) {
      max_idx = i;
      max_angle = ang;
    }
  }
  return max_idx;
}

/// Merges all adjacent vertices whose distance is smaller than 'args.min_dist'
/// (default is Point.EPS). When the polygon has 'args.min_vertex_count' (default
/// is 3) or less vertices, no more vertices are merged. */
Polygon.prototype.merge_vertices = function(args) {
  if (args.min_dist == undefined) args.min_dist = Point.EPS;
  if (args.min_vertex_count == undefined) args.min_vertex_count = 3;
  // its more complicated than I thought, because of sequences like 0,0,1,0,0
  // which should be turned into 0,1
  if (args.min_vertex_count < 1) args.min_vertex_count = 1;
  for (;;) {
    var changed = false;
    var N = this.pts.length;
    if (N <= args.min_vertex_count) return;
    var mpts = [];
    // first check, whether first and last point can be merged
    if (this.pts[0].dist(this.back()) < args.min_dist) {
      // yes, so merge them and omit the last point later
      mpts.push(this.back().add(this.pts[0]).scale(0.5));
      N -= 1;
      changed = true;
    } else {
      // no, so just use the first point
      mpts.push(this.pts[0]);
    }
    // now iterate over the rest of the points
    for (var i=1; i<N; ++i) {
      if (mpts[mpts.length-1].dist(this.pts[i]) < args.min_dist) { // merge the two points?
        mpts[mpts.length-1] = mpts[mpts.length-1].add(this.pts[i]).scale(0.5); // yes
        changed = true;
      } else
        mpts.push(this.pts[i]); // no
    }
    if (changed) this.pts = mpts;
    else return;
  }
}

/// Every vertex, that can be removed without an error > 'args.max_error'.
/// (default: Point.EPS). An vertex is removed, if its distance from the line
/// connecting its neighbours is not bigger than 'args.max_error'. This means
/// that, e.g. all vertices with an angle of 180 deg will be removed. When the
/// polygon has 'args.min_vertex_count' (default 3) or less vertices, no more
/// vertices are removed.
Polygon.prototype.remove_superfical_vertices = function(args) {
  if (args.max_error == undefined) args.max_error = Point.EPS;
  if (args.min_vertex_count == undefined) args.min_vertex_count = 3;
  if (args.min_vertex_count < 3) args.min_vertex_count = 3;
  for (;;) {
    var changed = false;
    var N = this.pts.length;
    var i = N-1;
    for (;;) {
      if (N <= args.min_vertex_count) return;
      var A = this.pts[(N+i-1)%N], C = this.pts[(i+1)%N];
      // if this.pts[i] is lying between A and C, we can simply take its distance to
      // AC as the error
      var AC = C.sub(A), ACn = AC.normalize();
      var prod = AC.mul(this.pts[i].sub(A));
      var error;
      if (prod >= 0 && prod < AC.mul(AC)) {
        var proj_i = A.add(ACn.scale((this.pts[i].sub(A)).mul(ACn)));
        error = this.pts[i].dist(proj_i);
      } else {
        // if this.pts[i] is lying in front of A, take its distance to a as error,
        // if it is lying behind C, take its distance to C as error
        if (prod < 0) error = this.pts[i].dist(A);
        else error = this.pts[i].dist(C);
      }
      if (error <= args.max_error) {
        Array.remove(this.pts, i);
        N -= 1;
        changed = true;
      }
      if (i==0) break;
      else i-=1;
    }
    if (!changed) return;
  }
}

Polygon.prototype.toString = function() {
  var points = [];
  for (var i=0; i<this.pts.length; i++) points.push(this.pts[i].x + ',' + this.pts[i].y);
  return '(' + points.join(' ') + ')';
}

/** Parses an SVG rect node into a new closed Polygon with 4 vertices.*/
Polygon.fromSVGRect = function(rect_node) {
  var poly = new Polygon();
  var x = Number(rect_node.getAttribute('x'))
     ,y = Number(rect_node.getAttribute('y'))
     ,w = Number(rect_node.getAttribute('width'))
     ,h = Number(rect_node.getAttribute('height'));
  poly.add_points([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
  poly.order_vertices();
  return poly;
}

/** Parses a svg path decripition, samples it with a number of linear pieces (so that the sampling
  error is no bigger that max_error) and returns the result as a Polygon. If last and first vertex
  are closer than 1e-3 to each other, the 'closed' property of the Polygon is set to 'true'. If the
  'remove_duplicates' parameter is passed as true, adjacent vertices that are closer to each other
  than 1e-3 are merged. */
Polygon.fromSVGPath = function(path_node, max_error, remove_duplicates) {
  var poly = new Polygon();
  poly.closed = false;
  poly.max_error = max_error;

  // get the path segments, insert their start and end points and depending
  // on their type more points to interpolate curved parts
  var segs = []
  var segList = path_node.pathSegList;
  for (var i=segList.numberOfItems-1; i>=0; --i) segs[i] = segList.getItem(i);

  /// iterate over segments
  var ep = new Point(0,0), cp = null; // current end point
  for (var i=0; i<segs.length; ++i) {
    var seg = segs[i];
    if (seg.pathSegType == SVGPathSeg.PATHSEG_CLOSEPATH) {
      poly.closed = true;
      break; // just take the first subpath
    } else {
      switch (seg.pathSegType) {
        case SVGPathSeg.PATHSEG_MOVETO_ABS: ep = new Point(seg.x, seg.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_MOVETO_REL: ep = ep.add(new Point(seg.x, seg.y)); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_ABS: ep = new Point(seg.x, seg.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_REL: ep = ep.add(new Point(seg.x, seg.y)); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS:
          cp = new Point(seg.x2, seg.y2);
          ep = poly.sampleBezier(ep, new Point(seg.x1, seg.y1), cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL:
          cp = new Point(seg.x2+ep.x, seg.y2+ep.y);
          ep = poly.sampleBezier(ep, new Point(seg.x1+ep.x, seg.y1+ep.y),
            cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS:
          cp = new Point(seg.x1, seg.y1);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL:
          cp = new Point(seg.x1+ep.x, seg.y1+ep.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        case SVGPathSeg.PATHSEG_ARC_ABS: throw "not implemented!";
        case SVGPathSeg.PATHSEG_ARC_REL: throw "not implemented!";
        case SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS: ep = new Point(seg.x, ep.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL: ep = new Point(seg.x+ep.x, ep.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS: ep = new Point(ep.x, seg.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL: ep = new Point(ep.x, seg.y+ep.y); cp = ep; poly.push(ep); break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:
          var mirror_cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          cp = new Point(seg.x2, seg.y2);
          ep = poly.sampleBezier(ep, mirror_cp, cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:
          var mirror_cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          cp = new Point(seg.x2+ep.x, seg.y2+ep.y);
          ep = poly.sampleBezier(ep, mirror_cp, cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:
          cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x, seg.y));
          break;
        case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:
          cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.x+ep.x, seg.y+ep.y));
          break;
        default: unknown = true; break;
      }
    }
  }
  if (poly.pts.length>1 && poly.pts[0].equals(poly.pts[poly.pts.length-1], 1e-3)) poly.closed = true;
  if (remove_duplicates) poly.remove_superfical_vertices({max_error: 1e-3});
  poly.order_vertices();
  return poly;
}

/// The function approximates a 3rd order bezier by straight line segments that
/// are no further away from the curve than 'this.max_error'. All points except the
/// start and end point are added to the polygon. It returns the end point 'd'.
Polygon.prototype.sampleBezier = function(A, B, C, D) {
  var EPS = 1e-6;
 /* The Algorithm:
  * We first transform the points to a coordinate system with its origin in A
  * and the x-axis on AD. We then project the points to the y-axis
  * (perpendicular to AD) and derivate the curve formular to derive the value
  * of t for which the curve is the furthest away from AD. If the distance is
  * bigger than max_error, we split the curve at that point and call the
  * function recursively for the two curve parts. */
  if (this.max_error <= EPS) throw "max_error must be bigger than EPS";
  if (A.equals(B, EPS) && A.equals(C, EPS) && A.equals(D, EPS)) {
    // all points are the same, so we do nothing
    return;
  }

  var error = 0; // the max. distance between curve and AD
  var t_extreme = 0; // point on the curve that has the max. distance to AD

  // vector AD on which we will project
  var AD = D.sub(A);
  if (AD.len() < EPS) {
    // start point A and end point D of the curve are very close to each other,
    // we will asume they are identical here and project onto AB or AC instead
    // of AD
    AD = (B.dist(A) > B.dist(C)) ? B.sub(A) : B.sub(C);
  }
  // now get the perpendicular to AD
  var pAD = new Point(-AD.y, AD.x);
  pAD.Normalize();
  // now we project B and C onto the perpendicular vector to AD (A and D will be projected to 0)
  var b = (B.sub(A)).mul(pAD);
  var c = (C.sub(A)).mul(pAD);

  // the bezier curve still has the same form:
  // p(t) = (1-t)^3*a + 3(1-t)^2*t*b + 3(1-t)*t^2*c + t^3*d
  // since  a and d are zero we get the derivative
  // p'(t) = 3b(3t^2 - 4t + 1)  +  3c(2t - 3t^2)
  // to get the extremal points we need to solve the quadratic equation
  // 0 = 3(b-c)t^2 + 2(c-2b)t + b
  var k1 = 3*(b-c); var k2 = 2*(c-2*b); var k3 = b;

  if (Math.abs(k1) < EPS) { // points b and c are almost identical
    // we get the equation 0 = -2bt + b and therefore t = 0.5 and
    // p(0.5) = 3*0.125*b + 3*0.125*c
    error = 0.375*Math.abs(b + c);
    t_extreme = 0.5;
  }
  else // points b and c are not identical
  {
    var discriminant = k2*k2 - 4*k1*k3;

    if(Math.abs(discriminant) < EPS) { // discriminant is zero, one solution
      var t = -0.5 * k2 / k1;
      if (0.0 < t && t < 1.0) { // t has to be in the interval [0,1]
        error = 3.0 * Math.abs(b*(1-t)*(1-t)*t + c*(1-t)*t*t);
        t_extreme = t;
      }
    }
    else if (discriminant > 0) // two solutions
    {
      var t1 = 0.5 * (-k2 - Math.sqrt(discriminant)) / k1;
	    var t2 = 0.5 * (-k2 + Math.sqrt(discriminant)) / k1;

	    var v_min = 0.0, v_max = 0.0;
	    var val1 = 0.0, val2 = 0.0;

	    if(0.0 < t1 && t1 < 1.0) {// t has to be in the interval [0,1]
		    val1 = 3.0 * (b*(1-t1)*(1-t1)*t1 + c*(1-t1)*t1*t1);
		    v_min = Math.min(v_min, val1);
		    v_max = Math.max(v_max, val1);
	    }

	    if(0.0 < t2 && t2 < 1.0) {// t has to be in the interval [0,1]
		    val2 = 3.0 * (b*(1-t2)*(1-t2)*t2 + c*(1-t2)*t2*t2);
		    v_min = Math.min(v_min, val2);
		    v_max = Math.max(v_max, val2);
	    }
	    error = v_max - v_min;
	    t_extreme = (Math.abs(val1) > Math.abs(val2)) ? t1 : t2;
    }
    else { /* no real solution, this should never happen */ }
  }

  if (error > this.max_error) {
    // the error is too big, split the curve at t_extreme
    // (1-t)^3*a + 3(1-t)^2*t*b + 3(1-t)*t^2*c + t^3*d
    var t = t_extreme;
    var a1 = A;
    var b1 = A.scale(1-t).add(B.scale(t));
    var c1 = A.scale((1-t)*(1-t)).add(B.scale(2*(1-t)*t)).add(C.scale(t*t));
    var d1 = A.scale((1-t)*(1-t)*(1-t)).add(B.scale(3*(1-t)*(1-t)*t)).add(C.scale(3*(1-t)*t*t)).add(D.scale(t*t*t));
    var a2 = d1;
    var b2 = B.scale((1-t)*(1-t)).add(C.scale(2*(1-t)*t)).add(D.scale(t*t));
    var c2 = C.scale(1-t).add(D.scale(t));
    var d2 = D;
    this.sampleBezier(a1, b1, c1, d1);
    this.sampleBezier(a2, b2, c2, d2);
  } else { // error is fine, just add D to the result
    this.pts.push(D);
  }
  return D;
}

/// 2nd order bezier curve interpolation (by using 3rd order implementation).
/// Adds points to the polygon, except start and end point. Returns end point.
Polygon.prototype.sampleBezier2 = function(a, b, c) {
  return this.sampleBezier(a, new Point((a.x+2*b.x)/3, (a.y+2*b.y)/3),
                           new Point((2*b.x+c.x)/3, (2*b.y+c.y)/3), c);
}

/// Draws itself onto an svg image. Will consider this.x and this.y if set.
Polygon.prototype.renderInSvg = function(doc, parent_node, vertex_element) {
  if (arguments.length<3) var vertex_element = false;
  var poly;
  if (this.closed) poly = doc.createElementNS('http://www.w3.org/2000/svg','polygon');
  else poly = doc.createElementNS('http://www.w3.org/2000/svg','polyline');
  var dx=this.x||0, dy=this.y||0;
  var points = [];
  for (var i=0; i<this.pts.length; ++i) points.push((this.pts[i].x+dx) + ',' + (this.pts[i].y+dy));
  poly.setAttribute('points', points.join(' '));
  poly.style.setProperty('stroke', 'red');
  poly.style.setProperty('stroke-width', '.5px');
  poly.style.setProperty('fill', 'none');
  parent_node.appendChild(poly);
  if (vertex_element) for (var i=0; i<this.pts.length; ++i) {
    var ve = vertex_element.cloneNode(true);
    ve.setAttribute('cx', this.pts[i].x+dx);
    ve.setAttribute('cy', this.pts[i].y+dy);
    parent_node.appendChild(ve);
  }
  return poly;
}

/// Draws itself onto a canvas. Will consider this.x and this.y if set.
Polygon.prototype.renderOnCanvas = function(ctx, do_stroke, do_fill) {
  var dx=this.x||0, dy=this.y||0;
  ctx.beginPath();
  ctx.moveTo(this.pts[0].x + dx, this.pts[0].y + dy);
  for (var i=1; i<this.pts.length; i++) ctx.lineTo(this.pts[i].x + dx, this.pts[i].y + dy);
  if (this.closed) ctx.closePath();
  if (do_stroke) ctx.stroke();
  if (do_fill) ctx.fill();
}

if (typeof(exports) != 'undefined') { exports.Polygon = Polygon }
