/* Interactive score explorer for the Research, Methodology & Validation hero.
   Reads window.EQ_DISTRIBUTION and renders a smoothed density curve, a marker,
   and a plain-language readout.

   Percentiles are always computed from the raw, unsmoothed counts. Smoothing is
   applied to the drawn curve only, so the shape reads cleanly without changing
   any number reported to the reader. */

(function () {
  'use strict';

  var D = window.EQ_DISTRIBUTION;
  if (!D) { return; }

  var n = D.n, MIN = D.min, MAX = D.max, C = D.counts, MAXRAW = D.maxraw || D.max;

  /* Scale: all 28 items, score = raw total / 168 x 100 - the same scale as
     EQ-Norm-2026.xlsx and the team handoff. Replaces the old z-anchored
     conversion 75 + 10 * (raw - m) / s, whose anchors were stale and
     inflated the reported SD to about 11.1 against a true 9.40. */
  var toScore = function (raw) { return raw / MAXRAW * 100; };
  var toRaw = function (sc) { return sc / 100 * MAXRAW; };

  /* ---- exact percentiles from the real counts ---------------------------- */
  var pct = new Array(C.length), below = 0;
  for (var i = 0; i < C.length; i++) {
    pct[i] = (below + 0.5 * C[i]) / n * 100;
    below += C[i];
  }

  function pctAt(score) {
    var idx = toRaw(score) - MIN;
    if (idx <= 0) { return 0; }
    if (idx >= C.length - 1) { return 100; }
    var lo = Math.floor(idx), t = idx - lo;
    return pct[lo] + (pct[lo + 1] - pct[lo]) * t;
  }

  /* ---- gaussian smoothing, for the drawn curve only ---------------------- */
  function gaussianSmooth(values, sigma) {
    var half = Math.ceil(sigma * 3), kernel = [], sum = 0, k;
    for (k = -half; k <= half; k++) {
      var wt = Math.exp(-(k * k) / (2 * sigma * sigma));
      kernel.push(wt);
      sum += wt;
    }
    for (k = 0; k < kernel.length; k++) { kernel[k] /= sum; }

    return values.map(function (_, idx) {
      var acc = 0, used = 0;
      for (var j = 0; j < kernel.length; j++) {
        var q = idx + j - half;
        if (q < 0 || q >= values.length) { continue; }
        acc += values[q] * kernel[j];
        used += kernel[j];
      }
      return used ? acc / used : 0;
    });
  }

  /* ---- catmull-rom through the points, emitted as cubic beziers ---------- */
  function splinePath(pts) {
    if (pts.length < 2) { return ''; }
    var d = 'M ' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C ' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) + ', ' +
                   c2x.toFixed(2) + ' ' + c2y.toFixed(2) + ', ' +
                   p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
    }
    return d;
  }

  /* ---- geometry ---------------------------------------------------------- */
  var W = 1000, H = 320, P = { l: 8, r: 8, t: 30, b: 42 };
  /* window centered on the median (75) and ending at the scale maximum;
     do not shift off-center - the distribution is left-skewed and an
     off-center frame makes the lean read as a drawing error */
  var X0 = 50, X1 = 100;
  var iw = W - P.l - P.r, ih = H - P.t - P.b;
  var sx = function (s) { return P.l + (s - X0) / (X1 - X0) * iw; };

  var dense = gaussianSmooth(C, 2.5);
  var pts = [];
  for (var r = MIN; r <= MAX; r += 0.25) {
    var s = toScore(r);
    if (s < X0 - 3 || s > X1 + 3) { continue; }
    var pos = r - MIN, lo2 = Math.floor(pos), t2 = pos - lo2;
    var v = dense[lo2] + ((dense[lo2 + 1] === undefined ? dense[lo2] : dense[lo2 + 1]) - dense[lo2]) * t2;
    pts.push({ s: s, v: v });
  }
  var vmax = 0;
  pts.forEach(function (p) { if (p.v > vmax) { vmax = p.v; } });
  var sy = function (v) { return P.t + ih - (v / vmax) * ih; };

  var xy = pts.map(function (p) { return { x: sx(p.s), y: sy(p.v) }; });

  /* ---- draw -------------------------------------------------------------- */
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.getElementById('chart');
  if (!svg) { return; }

  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var a in attrs) { e.setAttribute(a, attrs[a]); }
    return e;
  }

  var defs = el('defs', {});
  var grad = el('linearGradient', { id: 'curveFill', x1: '0', y1: '0', x2: '0', y2: '1' });
  grad.appendChild(el('stop', { offset: '0%', 'class': 'grad-top' }));
  grad.appendChild(el('stop', { offset: '100%', 'class': 'grad-bottom' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  var baseline = P.t + ih;
  var areaD = splinePath(xy) + ' L ' + xy[xy.length - 1].x.toFixed(2) + ' ' + baseline +
              ' L ' + xy[0].x.toFixed(2) + ' ' + baseline + ' Z';

  for (var g = X0 + 5; g < X1; g += 5) {
    svg.appendChild(el('line', { 'class': 'grid', x1: sx(g), y1: P.t, x2: sx(g), y2: baseline }));
  }

  svg.appendChild(el('path', { 'class': 'curve-area', d: areaD }));
  svg.appendChild(el('path', { 'class': 'curve-line', d: splinePath(xy) }));
  svg.appendChild(el('line', { 'class': 'axis', x1: P.l, y1: baseline, x2: P.l + iw, y2: baseline }));

  for (var t = X0 + 5; t <= X1 - 5; t += 5) {
    var lbl = el('text', { 'class': 'xlab', x: sx(t), y: baseline + 26, 'text-anchor': 'middle' });
    lbl.textContent = t;
    svg.appendChild(lbl);
  }

  var hoverG = el('g', { 'class': 'hover', opacity: 0 });
  var hoverLine = el('line', { 'class': 'hover-line', x1: 0, y1: P.t, x2: 0, y2: baseline });
  hoverG.appendChild(hoverLine);
  svg.appendChild(hoverG);

  var youG = el('g', { 'class': 'you' });
  var youLine = el('line', { 'class': 'you-line', x1: 0, y1: P.t - 10, x2: 0, y2: baseline });
  var youDot = el('circle', { 'class': 'you-dot', cx: 0, cy: P.t - 10, r: 6 });
  var youTxt = el('text', { 'class': 'you-lab', x: 0, y: P.t - 20, 'text-anchor': 'middle' });
  youTxt.textContent = 'this score';
  youG.appendChild(youLine);
  youG.appendChild(youDot);
  youG.appendChild(youTxt);
  svg.appendChild(youG);

  /* ---- readout ----------------------------------------------------------- */
  var tip = document.getElementById('tip');
  var input = document.getElementById('score');
  var l1 = document.getElementById('line1');
  var l2 = document.getElementById('line2');

  function words(p) {
    if (p < 10) { return 'Most recent test-takers score higher than this.'; }
    if (p < 25) { return 'This sits below the middle of the current distribution.'; }
    if (p < 42) { return 'This sits a little below the middle of the current distribution.'; }
    if (p <= 58) { return 'This sits right around the middle of the current distribution.'; }
    if (p < 75) { return 'This sits somewhat above the middle of the current distribution.'; }
    if (p < 90) { return 'This sits in the upper quarter of the current distribution.'; }
    return 'This sits in the top tenth of the current distribution.';
  }

  function setMarker(sc) {
    sc = Math.min(100, Math.max(20, sc));
    var p = pctAt(sc);
    var x = sx(Math.min(X1, Math.max(X0, sc)));
    youLine.setAttribute('x1', x);
    youLine.setAttribute('x2', x);
    youDot.setAttribute('cx', x);
    youTxt.setAttribute('x', x);
    l1.innerHTML = 'Higher than <em>' + p.toFixed(0) + '%</em> of recent test-takers';
    l2.textContent = words(p);
  }

  function scoreFromEvent(e) {
    var rect = svg.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return X0 + (cx / rect.width * W - P.l) / iw * (X1 - X0);
  }

  function hover(e) {
    var s = Math.min(X1, Math.max(X0, scoreFromEvent(e)));
    var rect = svg.getBoundingClientRect();
    hoverG.setAttribute('opacity', 1);
    hoverLine.setAttribute('x1', sx(s));
    hoverLine.setAttribute('x2', sx(s));
    tip.style.opacity = 1;
    tip.style.left = (sx(s) / W * rect.width) + 'px';
    tip.style.top = (P.t / H * rect.height) + 'px';
    tip.textContent = Math.round(s) + '  ·  higher than ' + pctAt(s).toFixed(0) + '%';
  }

  svg.addEventListener('mousemove', hover);
  svg.addEventListener('touchstart', hover, { passive: true });
  svg.addEventListener('touchmove', function (e) { hover(e); e.preventDefault(); }, { passive: false });
  svg.addEventListener('mouseleave', function () {
    hoverG.setAttribute('opacity', 0);
    tip.style.opacity = 0;
  });
  svg.addEventListener('click', function (e) {
    var s = Math.round(Math.min(X1, Math.max(X0, scoreFromEvent(e))));
    input.value = s;
    setMarker(s);
  });

  input.addEventListener('input', function () {
    var v = parseFloat(input.value);
    if (!isNaN(v)) { setMarker(v); }
  });

  setMarker(75);

  /* ---- landmark tiles ----------------------------------------------------- */
  var landmarks = [[10, '10% score below'], [25, '25% score below'], [50, 'half score below'],
                   [75, '75% score below'], [90, '90% score below']];
  var box = document.getElementById('marks');
  if (box) {
    landmarks.forEach(function (m) {
      var lo = X0, hi = 100;
      for (var i = 0; i < 40; i++) {
        var mid = (lo + hi) / 2;
        if (pctAt(mid) < m[0]) { lo = mid; } else { hi = mid; }
      }
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'mark';
      d.setAttribute('aria-label', 'Set score to ' + ((lo + hi) / 2).toFixed(0));
      d.innerHTML = '<b>' + ((lo + hi) / 2).toFixed(0) + '</b><span>' + m[1] + '</span>';
      d.addEventListener('click', function () {
        var v = Math.round((lo + hi) / 2);
        input.value = v;
        setMarker(v);
      });
      box.appendChild(d);
    });
  }
})();
