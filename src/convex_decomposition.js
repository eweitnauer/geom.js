/// Copyright by Erik Weitnauer, 2012.

/// Decomposes the polygon into convex pieces. (Ordered!)
/** This algorithm works only for polygons that have no holes and no
  * intersections!
  *
  * It recursively splits the polygon until all pieces are convex. They are
  * returned as an array of Polygons. The 'settings' parameter can be used to
  * adjust the behavior of the decomposition algorithm. The depth parameter
  * should be omited or passed as 0.
  *
  * The decomposing algorithm works as follows:
  *   -# Preprocessing of the passed polygon if <tt>settings.preprocess == true</tt>.
  *     - order vertices if  <tt>settings.pre_order == true</tt>
  *       @see order_vertices()
  *     - merge close vertices if <tt>settings.pre_merge_vertices_min_dist > 0</tt>
  *       @see merge_vertices()
  *     - remove superficial vertices if <tt>settings.pre_remove_vertices_max_error > 0</tt>
  *       @see remove_superfical_vertices()
  *   -# If the polygon is concave (has at least one notch), recursively decompose the polygon into convex pieces.
  *     - if connecting the first notch of the polygon with another vertex
  *       yields two convex angles which are no smaller than <tt>settings.s1_min_angle</tt>
  *       the polygon is splitted there.
  *     - otherwise, the polygon is split at the line connecting the notch
  *       and the closest intersection point of the extended notch edges with
  *       the polygon.
  *     - call the decomposition method for both parts
  *   -# If the polygon is convex, check for number of vertices.
  *     - if the number of vertices is larger than <tt>settings.max_vertices</tt>
  *       the polygon is recursively split until all parts have a small enough
  *       number of vertices.
  *       @see split()
  *   -# After the polygon is completely decomposed, it is post-processed if <tt>settings.postprocess == true</tt>. NOT IMPLEMENTED!
  *     - if <tt>settings.post_move_vertices_inside_dist > 0</tt> the algorithm
  *       attempts to move vertices from the periphery of the original polygon
  *       towards its center to improve performance in the physics simulation.
  *       @see move_vertices_inside()
  */
Polygon.prototype.convex_decomposition = function(settings, depth) {
  if (typeof(depth) == 'undefined') depth = 0;
  var convex_polygons = [];

  if (settings.debug_text) {
    console.log("convex_decomposition on depth " + depth + " called for " + this);
  }

  if (settings.preprocess && depth==0) {
    if (settings.pre_order_vertices) this.order_vertices();
    if (settings.pre_merge_vertices_min_dist>0)
      this.merge_vertices({min_dist: settings.pre_merge_vertices_min_dist});
    if (settings.pre_remove_vertices_max_error>0)
      this.remove_superfical_vertices({max_error: settings.pre_remove_vertices_max_error});
    if (settings.debug_text) console.log("after preprocessing: " + this);
  }

  var pts = this.pts;
  var N = pts.length;
  if (N < 3) return []; // we need at least a triangle

  var notch_idx = this.find_notch();
  if (settings.debug_text) console.log("notch_idx is " + notch_idx);
  if (notch_idx < N) { // found a notch at position idx
    var A = pts[(N+notch_idx-1)%N], // vertex before the notch
        B = pts[notch_idx],         // the notch
        C = pts[(notch_idx+1)%N];   // vertex after the notch

    // We will apply two different strategies here:
    // 1. Check whether any of the vertices 'visible' from the notch B are
    // inside the angle(ABC) mirrored at B. If so, simply split the polygon
    // at the connection between B and that vertice. If not we proceed with 2.
    // 2. Find the closest intersection point of AB and CA with the edges of the
    // polygon. Choose the closer one.

    var ps = [];
    // first try strategy 1
    ps = this.cd_strategy_1(notch_idx, settings);
    // and if it could not be applied, strategy 2
    if (ps.length == 0) ps = this.cd_strategy_2(notch_idx, settings);
    // continue convex decomposition with the splitted parts
    convex_polygons = convex_polygons.concat(ps[0].convex_decomposition(settings, depth+1));
    convex_polygons = convex_polygons.concat(ps[1].convex_decomposition(settings, depth+1));
  } else { // found no notch --> the polygon is already convex
    // check the number of vertices
    if (settings.max_vertices < N) {
      if (settings.debug_text) console.log("Too much vertices, splitting...");
      convex_polygons = convex_polygons.concat(this.split(settings.max_vertices));
    } else {
      convex_polygons.push(this);
    }
  }
  return convex_polygons;
}

/// Returns array [p1,p2] of splitted polygons, if successful or an empty array
/// if not.
Polygon.prototype.cd_strategy_1 = function(notch_idx, settings) {
  // Strategy 1:
  // Find all vertices that are in the angle of the notch (but at least 15 deg
  // different from the two egdes of the notch) and visible from the notch.
  // Then take the one closest to the notch.
  if (settings.debug_text) console.log("Applying strategy 1 to notch at " + notch_idx + "...");

  var pts = this.pts;
  var N = pts.length;
  var A = pts[(N+notch_idx-1)%N], // vertex before the notch
      B = pts[notch_idx],         // the notch
      C = pts[(notch_idx+1)%N],   // vertex after the notch
      AB = B.sub(A), BA = A.sub(B), CB = B.sub(C), BC = C.sub(B);
  var split_point = N;
  // now iterate over all vertices to find the ones in the angle of the notch.
  for (var i=0; i<N; ++i) {
    // dont check for A, B and C
    if ((i==notch_idx) || ((N+i-notch_idx-1)%N==0) || ((N+i-notch_idx+1)%N==0)) continue;
    var BI = pts[i].sub(B);
    // check if pts[i] lies between ba and bc
    // if so, the sign of cross(ba, bi) and cross(bc, bi) should be different
    if (BA.cross(BI) * BC.cross(BI) >= 0) {
      if (settings.debug_text) console.log("==> " + i + " is outside of the angle");
      continue;
    }
    // check that angle to both edges is at least settings.min_angle
    var angle_a = Math.acos(BA.normalize().mul(BI.normalize()));
    var angle_c = Math.acos(BC.normalize().mul(BI.normalize()));
    if ((Math.abs(angle_a) < settings.s1_min_angle) || (Math.abs(angle_c) < settings.s1_min_angle)) {
      if (settings.debug_text) console.log("==> " + i + " has angle < " + settings.s1_min_angle*180/Math.PI + " deg with edges of vertex " + notch_idx);
      continue;
    }
    // check if the point is visible
    if (!this.is_visible(notch_idx, i)) {
      if (settings.debug_text) console.log("==> " + i + " is not visible from " + notch_idx);
      continue;
    }
    // we have our candidate! - now take the closest
    if (split_point == N || pts[i].dist2(B) < pts[split_point].dist2(B)) {
      if (settings.debug_text) console.log("==> " + i + " is new nearest split point");
      split_point = i;
    }
  }

  if (split_point < N) {
    if (settings.debug_text) console.log("Strategy1 ==> using vertex " + split_point + " as splitting point.");
    return this.split_at(notch_idx, split_point);
  } else return [];
}

/// Returns array [p1,p2] of splitted polygons.
/// Finds the intersection of the rays from the notch along its adjacent edges
/// with the rest of the polygon.
Polygon.prototype.cd_strategy_2 = function(notch_idx, settings) {
  if (settings.debug_text) console.log("Applying strategy 2 to notch at " + notch_idx + "...");

  var pts = this.pts;
  var N = pts.length;
  var A = pts[(N+notch_idx-1)%N], // vertex before the notch
      B = pts[notch_idx],         // the notch
      C = pts[(notch_idx+1)%N],   // vertex after the notch
      AB = B.sub(A), BA = A.sub(B), CB = B.sub(C), BC = C.sub(B);

  // get the first intersection of AB and CB with the polygon
  var closest_hit, closest_hit_ab = new Point(), closest_hit_cb = new Point(); // closest intersection points
  var closest_hit_idx,
      closest_hit_idx_ab = this.find_intersection(B, AB, closest_hit_ab, (N+notch_idx-1)%N, notch_idx),
      closest_hit_idx_cb = this.find_intersection(B, CB, closest_hit_cb, (notch_idx+1)%N, notch_idx);
  // now take the closer one
  if (B.dist2(closest_hit_ab) <= B.dist2(closest_hit_cb)) {
    closest_hit = closest_hit_ab;
    closest_hit_idx = closest_hit_idx_ab;
  } else {
    closest_hit = closest_hit_cb;
    closest_hit_idx = closest_hit_idx_cb;
  }
  if (settings.debug_text) console.log("==> the closest intersection found is " + closest_hit);
  if (settings.debug_text) console.log("==> the vertex in front of it has the index " + closest_hit_idx);

  // now we split the polygon at notch_idx and closest_idx
  var p1 = new Polygon();
  // add points from notch to intersection in counter-clockwise order
  for (var i=notch_idx;; ++i) {
    if (i==N) i=0;
    p1.pts.push(pts[i].copy());
    if (i==closest_hit_idx) break;
  }
  p1.pts.push(closest_hit.copy());

  var p2 = new Polygon();
  // add points from intersection to notch in counter-clockwise order
  // since the notch is on the line from a to the hit point, we do not need to
  // add it to the polygon
  for (var i=closest_hit_idx+1;; ++i) {
    if (i==N) i=0;
    if (i==notch_idx) break;
    p2.pts.push(pts[i].copy());
  }
  p2.pts.push(closest_hit.copy());

  return [p1,p2];
}

