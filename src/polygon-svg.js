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
  var segs = path_node.getPathData({normalize: true}); // only need to support M, L, C, Z

  /// iterate over segments
  var ep = new Point(0,0), cp = null; // current end point
  for (var i=0; i<segs.length; ++i) {
    var seg = segs[i];
    if (seg.type === 'z' || seg.type === 'Z') {
      poly.closed = true;
      break; // just take the first subpath
    } else {
      switch (seg.type) {
        case 'M': ep = new Point(seg.values[0], seg.values[1]); cp = ep; poly.push(ep); break;
        case 'm': ep = ep.add(new Point(seg.values[0], seg.values[1])); cp = ep; poly.push(ep); break;
        case 'L': ep = new Point(seg.values[0], seg.values[1]); cp = ep; poly.push(ep); break;
        case 'l': ep = ep.add(new Point(seg.values[0], seg.values[1])); cp = ep; poly.push(ep); break;
        case 'C':
          var x1 = seg.values[0], y1 = seg.values[1]
            , x2 = seg.values[2], y2 = seg.values[3]
            , x  = seg.values[4], y  = seg.values[5];
          cp = new Point(x2, y2);
          ep = poly.sampleBezier(ep, new Point(x1, y1), cp, new Point(x, y));
          break;
        case 'c':
          var x1 = seg.values[0], y1 = seg.values[1]
            , x2 = seg.values[2], y2 = seg.values[3]
            , x  = seg.values[4], y  = seg.values[5];
          cp = new Point(x2+ep.x, y2+ep.y);
          ep = poly.sampleBezier(ep, new Point(x1+ep.x, y1+ep.y), cp, new Point(x+ep.x, y+ep.y));
          break;
        case 'Q':
          var x1 = seg.values[0], y1 = seg.values[1]
            , x  = seg.values[2], y  = seg.values[3];
          cp = new Point(x1, y1);
          ep = poly.sampleBezier2(ep, cp, new Point(x, y));
          break;
        case 'q':
          var x1 = seg.values[0], y1 = seg.values[1]
            , x  = seg.values[2], y  = seg.values[3];
          cp = new Point(x1+ep.x, y1+ep.y);
          ep = poly.sampleBezier2(ep, cp, new Point(x+ep.x, y+ep.y));
          break;
        case 'A': throw "not implemented!";
        case 'a': throw "not implemented!";
        case 'H': ep = new Point(seg.values[0], ep.y); cp = ep; poly.push(ep); break;
        case 'h': ep = new Point(seg.values[0]+ep.x, ep.y); cp = ep; poly.push(ep); break;
        case 'V': ep = new Point(ep.x, seg.values[0]); cp = ep; poly.push(ep); break;
        case 'v': ep = new Point(ep.x, seg.values[0]+ep.y); cp = ep; poly.push(ep); break;
        case 'S':
          var x2 = seg.values[0], y2 = seg.values[1]
            , x  = seg.values[2], y  = seg.values[3];
          var mirror_cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          cp = new Point(x2, y2);
          ep = poly.sampleBezier(ep, mirror_cp, cp, new Point(x, y));
          break;
        case 's':
          var x2 = seg.values[0], y2 = seg.values[1]
            , x  = seg.values[2], y  = seg.values[3];
          var mirror_cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          cp = new Point(x2+ep.x, y2+ep.y);
          ep = poly.sampleBezier(ep, mirror_cp, cp, new Point(x+ep.x, y+ep.y));
          break;
        case 'T':
          cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.values[0], seg.values[1]));
          break;
        case 't':
          cp = new Point(2*ep.x-cp.x, 2*ep.y-cp.y);
          ep = poly.sampleBezier2(ep, cp, new Point(seg.values[0]+ep.x, seg.values[1]+ep.y));
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
