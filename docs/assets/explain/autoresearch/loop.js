/* autoresearch scene 4 drawing — experiment loop + git ratchet + results.tsv.
 * State comes from LoopModel.stateAt(t); this file only draws it.
 * Colors are CSS variables (set via style=, since SVG presentation attributes
 * do not accept var()). Two layouts: landscape 1200×675, portrait 540×1080
 * (svg narrower than 780px), so text never renders below ~9px. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.LoopModel;

  var GEO = {
    landscape: {
      W: 1200, H: 675,
      roundLabel: { x: 30, y: 52, size: 28, descX: 140, descY: 52, descSize: 16 },
      ring: { cx: 290, cy: 330, R: 205, pillW: 134, pillH: 46, font: 20 },
      center: { w: 236 },
      branch: { titleX: 612, titleY: 64, x0: 662, dx: 125, y: 134, drop: 210, hash: 14 },
      score: { x: 612, y: 318, x2: 880, size: 30 },
      table: { x: 612, titleY: 372, headY: 404, rowY: 438, rowH: 36, font: 14, right: 1180,
               cols: [['commit', 0], ['val_bpb', 74], ['memory_gb', 156], ['status', 242], ['description', 324]] }
    },
    portrait: {
      W: 540, H: 1080,
      roundLabel: { x: 24, y: 44, size: 26, descX: 24, descY: 76, descSize: 16 },
      ring: { cx: 270, cy: 300, R: 170, pillW: 120, pillH: 44, font: 19 },
      center: { w: 220 },
      branch: { titleX: 24, titleY: 562, x0: 72, dx: 130, y: 616, drop: 690, hash: 15 },
      score: { x: 24, y: 800, x2: 280, size: 26 },
      table: { x: 24, titleY: 866, headY: 898, rowY: 934, rowH: 38, font: 15, right: 520,
               cols: [['commit', 0], ['val_bpb', 76], ['status', 166], ['description', 256]] }
    }
  };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function tag(name, attrs, inner) {
    var a = '';
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) a += ' ' + k + '="' + attrs[k] + '"';
    return '<' + name + a + (inner === undefined ? '/>' : '>' + inner + '</' + name + '>');
  }

  function text(x, y, str, style, extra) {
    var attrs = { x: x, y: y, style: style };
    for (var k in extra || {}) attrs[k] = extra[k];
    return tag('text', attrs, esc(str));
  }

  function fill(t, size, fam, weight) {
    return 'fill:var(' + t + ');font-size:' + size + 'px;font-family:var(' + (fam || '--font-hand') + ')' +
      (weight ? ';font-weight:' + weight : '');
  }

  function fmt(template, vars) {
    return template.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] !== undefined ? vars[k] : ''; });
  }

  function lerp(a, b, p) { return a + (b - a) * p; }

  function polar(cx, cy, R, deg) {
    var r = deg * Math.PI / 180;
    return [cx + R * Math.cos(r), cy + R * Math.sin(r)];
  }

  var STATION_DEG = M.STATIONS.map(function (_, k) { return -90 + k * 60; });

  /* ---------- pieces ---------- */

  function drawRoundLabel(g, s, copy) {
    var L = g.roundLabel;
    if (s.phase !== 'run') return '';
    var row = M.ROWS[s.round];
    return text(L.x, L.y, fmt(copy.labels.round, { n: s.round + 1 }), fill('--ink', L.size, '--font-hand')) +
      text(L.descX, L.descY, row.desc, fill('--ink-2', L.descSize, '--font-mono'));
  }

  function dotAngle(s) {
    if (s.phase !== 'run') return -90;
    var k = M.STATIONS.indexOf(s.station);
    var from = k === 0 ? -150 : STATION_DEG[k - 1];
    var p = T.ease.inOut(T.clamp(s.local / 0.35, 0, 1));
    return lerp(from, STATION_DEG[k], p);
  }

  function drawRing(g, s, copy, noReset) {
    var R = g.ring, out = '';
    out += tag('circle', { cx: R.cx, cy: R.cy, r: R.R, style: 'fill:none;stroke:var(--line);stroke-width:2;stroke-dasharray:6 7' });

    var ang = dotAngle(s);
    if (s.phase === 'run' && ang > -90) {
      var a = polar(R.cx, R.cy, R.R, -90), b = polar(R.cx, R.cy, R.R, ang);
      var large = ang - -90 > 180 ? 1 : 0;
      out += tag('path', { d: 'M' + a[0] + ' ' + a[1] + ' A' + R.R + ' ' + R.R + ' 0 ' + large + ' 1 ' + b[0] + ' ' + b[1],
        style: 'fill:none;stroke:var(--accent);stroke-width:4;stroke-linecap:round' });
    }
    if (s.phase === 'outro') {
      out += tag('circle', { cx: R.cx, cy: R.cy, r: R.R, style: 'fill:none;stroke:var(' + (noReset ? '--crash' : '--keep') + ');stroke-width:4;opacity:' + T.ease.out(s.local).toFixed(3) });
    }

    // the dot is drawn under the pills: visible while travelling, hidden once it arrives
    var d = polar(R.cx, R.cy, R.R, ang);
    var dot = s.phase === 'run' ? tag('circle', { cx: d[0].toFixed(2), cy: d[1].toFixed(2), r: 9, style: 'fill:var(--accent);stroke:var(--card);stroke-width:3' }) : '';
    var base = out;
    out = '';
    var cur = s.phase === 'run' ? M.STATIONS.indexOf(s.station) : -1;
    M.STATIONS.forEach(function (key, k) {
      var p = polar(R.cx, R.cy, R.R, STATION_DEG[k]);
      var active = k === cur && s.local >= 0.3;
      var done = k < cur;
      var box = 'fill:var(' + (active ? '--accent-soft' : '--card') + ');stroke:var(' +
        (active ? '--accent' : done ? '--ink-3' : '--line') + ');stroke-width:' + (active ? 2.5 : 1.5);
      var pill = { x: p[0] - R.pillW / 2, y: p[1] - R.pillH / 2, width: R.pillW, height: R.pillH, rx: R.pillH / 2 };
      if (active) out += tag('rect', Object.assign({ style: 'fill:var(--card)' }, pill));
      out += tag('rect', Object.assign({ style: box }, pill));
      out += text(p[0], p[1] + R.font * 0.36, copy.stations[key].label,
        fill(active ? '--accent-ink' : '--ink', R.font, '--font-hand', active ? 700 : 400), { 'text-anchor': 'middle' });
    });

    return base + dot + out;
  }

  function centerLines(g, lines) {
    // lines: [{t, style, gap}]
    var R = g.ring, total = 0, out = '';
    lines.forEach(function (l) { total += l.gap; });
    var y = R.cy - total / 2;
    lines.forEach(function (l) {
      y += l.gap;
      out += text(R.cx, y, l.t, l.style, { 'text-anchor': 'middle' });
    });
    return out;
  }

  function drawCenter(g, s, copy, prevBest, noReset) {
    var R = g.ring, W = g.center.w, out = '';
    var left = R.cx - W / 2;
    if (s.phase === 'intro') {
      return centerLines(g, [
        { t: '1 轮 = 6 站', style: fill('--ink', 30, '--font-hand', 700), gap: 30 },
        { t: '变好就留下', style: fill('--keep-ink', 20, '--font-hand'), gap: 36 },
        { t: '没变好就退回', style: fill('--ink-2', 20, '--font-hand'), gap: 30 }
      ]);
    }
    if (s.phase === 'outro') {
      return centerLines(g, [
        { t: '4 轮跑完', style: fill('--ink', 30, '--font-hand', 700), gap: 30 },
        { t: noReset ? '保留 2 · 变差没撤 1 · 崩溃 1' : '保留 2 · 丢弃 1 · 崩溃 1', style: fill('--ink-2', 19, '--font-hand'), gap: 36 },
        { t: '一晚约 100 轮', style: fill('--accent-ink', 21, '--font-hand', 700), gap: 32 }
      ]);
    }
    var row = M.ROWS[s.round];
    var k = s.station;
    var appear = 'opacity:' + T.ease.out(T.clamp((s.local - 0.2) / 0.3, 0, 1)).toFixed(3);

    if (k === 'edit') {
      var h = 132, top = R.cy - h / 2;
      out += tag('rect', { x: left, y: top, width: W, height: h, rx: 10, style: 'fill:var(--card);stroke:var(--ink);stroke-width:1.5' });
      out += tag('rect', { x: left, y: top, width: W, height: 30, rx: 10, style: 'fill:var(--paper-2)' });
      out += text(left + 14, top + 21, 'train.py', fill('--ink', 15, '--font-mono', 600));
      [52, 74].forEach(function (dy) {
        out += tag('rect', { x: left + 14, y: top + dy, width: W * (dy === 52 ? 0.55 : 0.4), height: 6, rx: 3, style: 'fill:var(--line)' });
      });
      var line = s.round === 0 ? '（原样不改）' : '+ ' + row.desc;
      out += tag('g', { style: appear },
        tag('rect', { x: left + 8, y: top + 92, width: W - 16, height: 28, rx: 6, style: 'fill:var(--accent-soft)' }) +
        text(left + 16, top + 111, line, fill('--accent-ink', 15, '--font-mono', 600)));
      return out;
    }
    if (k === 'commit') {
      return tag('g', { style: appear }, centerLines(g, [
        { t: 'git commit', style: fill('--ink-2', 17, '--font-mono'), gap: 18 },
        { t: row.commit, style: fill('--ink', 30, '--font-mono', 600), gap: 46 }
      ]));
    }
    if (k === 'train') {
      var p = s.local, rr = 52, cy = R.cy - 22;
      var secs = Math.round((1 - p) * 300);
      var mmss = Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2);
      var a0 = polar(R.cx, cy, rr, -90), a1 = polar(R.cx, cy, rr, -90 + 359.9 * p);
      out += tag('circle', { cx: R.cx, cy: cy, r: rr, style: 'fill:var(--card);stroke:var(--line);stroke-width:8' });
      if (p > 0.001) {
        out += tag('path', { d: 'M' + a0[0] + ' ' + a0[1] + ' A' + rr + ' ' + rr + ' 0 ' + (p > 0.5 ? 1 : 0) + ' 1 ' + a1[0] + ' ' + a1[1],
          style: 'fill:none;stroke:var(--accent);stroke-width:8;stroke-linecap:round' });
      }
      out += text(R.cx, cy + 9, mmss, fill('--ink', 26, '--font-mono', 600), { 'text-anchor': 'middle' });
      var cmd = copy.commands.train.split(' > ');
      out += text(R.cx, cy + rr + 32, cmd[0], fill('--ink-2', 15, '--font-mono'), { 'text-anchor': 'middle' });
      out += text(R.cx, cy + rr + 52, '> ' + cmd[1], fill('--ink-2', 15, '--font-mono'), { 'text-anchor': 'middle' });
      return out;
    }
    if (k === 'read' || k === 'decide' || k === 'log') {
      if (k === 'read') {
        var th = 112, tt = R.cy - th / 2;
        out += tag('rect', { x: left, y: tt, width: W, height: th, rx: 10, style: 'fill:var(--ink)' });
        out += text(left + 12, tt + 30, copy.commands.read, fill('--paper', 15, '--font-mono'));
        if (s.local > 0.35) {
          if (s.readout) out += text(left + 12, tt + 62, s.readout, fill('--keep', 17, '--font-mono', 600));
          else {
            out += text(left + 12, tt + 62, '（什么也没有）', fill('--crash', 17, '--font-mono', 600));
            out += text(left + 12, tt + 92, copy.commands.tail, fill('--paper', 15, '--font-mono'));
          }
        }
        return out;
      }
      if (k === 'decide') {
        var lines = [];
        if (s.round === 0) lines.push({ t: '基线 ' + row.bpb.toFixed(6), style: fill('--ink', 24, '--font-mono', 600), gap: 30 });
        else if (row.status === 'crash') lines.push({ t: '没有分数', style: fill('--crash-ink', 26, '--font-hand', 700), gap: 30 });
        else {
          lines.push({ t: row.bpb.toFixed(6), style: fill('--ink', 24, '--font-mono', 600), gap: 26 });
          lines.push({ t: '< ' + prevBest.toFixed(6) + ' ?', style: fill('--ink-2', 20, '--font-mono'), gap: 32 });
        }
        out += centerLines(g, lines.concat([{ t: '', style: '', gap: 50 }]));
        if (s.verdict) {
          var stamp = { baseline: ['基线 ✓', '--keep'], keep: ['保留 ✓', '--keep'], discard: ['丢弃', '--discard'], crash: ['崩溃 ✗', '--crash'] }[s.verdict];
          var sp = T.ease.out(T.clamp((s.local - 0.5) / 0.25, 0, 1));
          var sc = (1.6 - 0.6 * sp).toFixed(3);
          out += tag('g', { transform: 'translate(' + R.cx + ' ' + (R.cy + 46) + ') rotate(-8) scale(' + sc + ')', style: 'opacity:' + sp.toFixed(3) },
            tag('rect', { x: -66, y: -24, width: 132, height: 46, rx: 8, style: 'fill:none;stroke:var(' + stamp[1] + ');stroke-width:3' }) +
            text(0, 9, stamp[0], fill(stamp[1], 24, '--font-hand', 700), { 'text-anchor': 'middle' }));
        }
        return out;
      }
      return tag('g', { style: appear }, centerLines(g, [
        { t: '写进 results.tsv', style: fill('--ink', 22, '--font-hand', 700), gap: 22 },
        { t: '（只记录，不提交）', style: fill('--ink-2', 17, '--font-hand'), gap: 34 }
      ]));
    }
    return out;
  }

  function nodeY(g, s, node) {
    var B = g.branch;
    if (node.onBranch) return B.y;
    if (s.phase === 'run' && node.round === s.round && s.station === 'decide') {
      return lerp(B.y, B.drop, T.ease.inOut(T.clamp((s.local - 0.5) / 0.35, 0, 1)));
    }
    return B.drop;
  }

  function drawBranch(g, s, copy) {
    var B = g.branch, out = '';
    out += text(B.titleX, B.titleY, copy.labels.branch_title + '  ', fill('--ink', 17, '--font-head', 700)) +
      text(B.titleX + 78, B.titleY, copy.branch, fill('--ink-2', 15, '--font-mono'));
    out += tag('line', { x1: B.x0 - 30, y1: B.y, x2: B.x0 + B.dx * 3 + 40, y2: B.y, style: 'stroke:var(--line-soft);stroke-width:2;stroke-dasharray:3 6' });

    var xs = function (i) { return B.x0 + i * B.dx; };
    // solid line through committed nodes that are on the branch (decided)
    var onb = s.nodes.filter(function (n) { return n.onBranch && n.status !== 'pending'; });
    for (var j = 1; j < onb.length; j++) {
      var bad = onb[j].status === 'discard' || onb[j - 1].status === 'discard';
      out += tag('line', { x1: xs(onb[j - 1].round), y1: B.y, x2: xs(onb[j].round), y2: B.y,
        style: 'stroke:var(' + (bad ? '--crash' : '--ink') + ');stroke-width:4;stroke-linecap:round' });
    }
    // pending node hangs off HEAD with a dashed link
    s.nodes.forEach(function (n) {
      if (n.status === 'pending' && s.head >= 0) {
        out += tag('line', { x1: xs(s.head), y1: B.y, x2: xs(n.round), y2: B.y, style: 'stroke:var(--accent);stroke-width:3;stroke-dasharray:6 6' });
      }
    });
    // git reset arrows for dropped discards
    s.nodes.forEach(function (n) {
      if (n.status !== 'discard' || n.onBranch) return;
      var y = nodeY(g, s, n), x = xs(n.round), hx = xs(n.round - 1);
      var op = y >= B.drop - 1 ? 1 : 0;
      if (!op) return;
      out += tag('path', { d: 'M' + (x - 18) + ' ' + (y - 6) + ' C' + (x - 50) + ' ' + (y - 10) + ' ' + (hx + 30) + ' ' + (B.y + 40) + ' ' + (hx + 12) + ' ' + (B.y + 20),
        style: 'fill:none;stroke:var(--discard);stroke-width:2;stroke-dasharray:5 5', 'marker-end': 'url(#loop-arrow)' });
      out += text(x + 24, y + 6, 'git reset', fill('--ink-2', B.hash, '--font-mono'));
    });

    s.nodes.forEach(function (n) {
      var x = xs(n.round), y = nodeY(g, s, n);
      var st = n.status;
      var style = {
        pending: 'fill:var(--card);stroke:var(--accent);stroke-width:3;stroke-dasharray:4 4',
        keep: 'fill:var(--keep);stroke:var(--card);stroke-width:3',
        discard: 'fill:var(--card);stroke:var(--discard);stroke-width:3;stroke-dasharray:4 4',
        crash: 'fill:var(--card);stroke:var(--crash);stroke-width:3'
      }[st];
      out += tag('circle', { cx: x, cy: y.toFixed(2), r: 15, style: style });
      if (st === 'keep') out += tag('path', { d: 'M' + (x - 6) + ' ' + y + ' l4 4 l8 -9', style: 'fill:none;stroke:var(--card);stroke-width:3;stroke-linecap:round;stroke-linejoin:round' });
      if (st === 'crash') out += tag('path', { d: 'M' + (x - 6) + ' ' + (y - 6) + ' l12 12 M' + (x + 6) + ' ' + (y - 6) + ' l-12 12', style: 'stroke:var(--crash);stroke-width:3;stroke-linecap:round' });
      out += text(x, y + 38, n.commit, fill(st === 'keep' ? '--ink' : '--ink-2', B.hash, '--font-mono'), { 'text-anchor': 'middle' });
    });

    if (s.head >= 0) {
      var hx2 = xs(s.head);
      out += tag('rect', { x: hx2 - 30, y: B.y - 50, width: 60, height: 24, rx: 6, style: 'fill:var(--ink)' });
      out += text(hx2, B.y - 33, 'HEAD', fill('--paper', 14, '--font-mono', 600), { 'text-anchor': 'middle' });
    }
    return out;
  }

  function drawScore(g, s, copy, noReset) {
    var S = g.score, out = '';
    out += text(S.x, S.y - S.size - 6, copy.labels.best, fill('--ink-2', 18, '--font-hand'));
    out += text(S.x, S.y, s.best === null ? '—' : s.best.toFixed(6), fill('--keep-ink', S.size, '--font-mono', 600));
    if (noReset && s.headBpb !== null && s.best !== null && s.headBpb > s.best) {
      out += text(S.x2, S.y - S.size - 6, copy.labels.head_score, fill('--ink-2', 18, '--font-hand'));
      out += text(S.x2, S.y, s.headBpb.toFixed(6), fill('--crash-ink', S.size, '--font-mono', 600));
    }
    return out;
  }

  function drawTable(g, s, copy) {
    var Tb = g.table, out = '';
    out += text(Tb.x, Tb.titleY, copy.labels.table_title, fill('--ink', 17, '--font-mono', 600));
    Tb.cols.forEach(function (c) { out += text(Tb.x + c[1], Tb.headY, c[0], fill('--ink-2', Tb.font, '--font-mono')); });
    out += tag('line', { x1: Tb.x, y1: Tb.headY + 10, x2: Tb.right, y2: Tb.headY + 10, style: 'stroke:var(--line);stroke-width:1.5' });
    for (var j = 0; j < s.rows; j++) {
      var row = M.ROWS[j], y = Tb.rowY + j * Tb.rowH;
      var fresh = s.phase === 'run' && j === s.round && s.station === 'log';
      var p = fresh ? T.ease.out(T.clamp((s.local - 0.3) / 0.4, 0, 1)) : 1;
      var cells = {
        commit: [row.commit, '--ink'],
        val_bpb: [row.bpb.toFixed(6), '--ink'],
        memory_gb: [row.mem.toFixed(1), '--ink-2'],
        status: [row.status, row.status === 'keep' ? '--keep-ink' : row.status === 'crash' ? '--crash-ink' : '--ink-2'],
        description: [row.desc, '--ink-2']
      };
      var inner = tag('rect', { x: Tb.x - 6, y: y - Tb.rowH * 0.62, width: Tb.right - Tb.x + 12, height: Tb.rowH - 6, rx: 6,
        style: 'fill:var(' + (fresh ? '--accent-soft' : j % 2 ? '--paper-2' : '--card') + ')' });
      Tb.cols.forEach(function (c) {
        var cell = cells[c[0]];
        inner += text(Tb.x + c[1], y, cell[0], fill(cell[1], Tb.font, '--font-mono', c[0] === 'status' ? 700 : 400));
      });
      out += tag('g', { transform: 'translate(' + ((1 - p) * 14).toFixed(2) + ' 0)', style: 'opacity:' + p.toFixed(3) }, inner);
    }
    return out;
  }

  function captionFor(s, copy, noReset, prevBest) {
    var sp = copy.special;
    if (s.phase === 'intro') return sp.intro;
    if (s.phase === 'outro') return noReset ? sp.outro_noreset : sp.outro;
    var row = M.ROWS[s.round];
    if (s.station === 'edit' && s.round === 0) return sp.edit_baseline;
    if (s.station === 'read' && row.status === 'crash') return sp.read_crash;
    if (s.station === 'decide' && s.verdict) {
      var key = s.verdict === 'discard' && noReset ? 'discard_noreset' : s.verdict;
      return fmt(copy.verdicts[key], { bpb: row.bpb.toFixed(6), best: prevBest === null ? '' : prevBest.toFixed(6) });
    }
    return copy.stations[s.station].caption;
  }

  var DEFS = '<defs><marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
    '<path d="M0 0 L10 5 L0 10 z" style="fill:var(--discard)"/></marker></defs>';

  window.Explain.register('loop', function (svg, ctx) {
    var copy = ctx.copy;
    var opts = { noReset: false };
    var mode = 'landscape';

    function prevBestFor(s) {
      if (s.phase !== 'run') return null;
      return M.stateAt(M.INTRO + s.round * M.ROUND + 1e-6, opts).best;
    }

    return {
      duration: M.duration(),
      stops: M.stops(),
      setOption: function (key, value) { opts[key] = value; },
      layout: function (width) {
        mode = width > 0 && width < 780 ? 'portrait' : 'landscape';
        var g = GEO[mode];
        svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
      },
      render: function (t) {
        var g = GEO[mode];
        var s = M.stateAt(t, opts);
        var prevBest = prevBestFor(s);
        svg.innerHTML = DEFS + drawRoundLabel(g, s, copy) + drawRing(g, s, copy, opts.noReset) + drawCenter(g, s, copy, prevBest, opts.noReset) +
          drawBranch(g, s, copy) + drawScore(g, s, copy, opts.noReset) + drawTable(g, s, copy);
        ctx.caption(captionFor(s, copy, opts.noReset, prevBest));
      }
    };
  });
})();
