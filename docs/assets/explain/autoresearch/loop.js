/* autoresearch scene 4 drawing — experiment loop + git ratchet + results.tsv.
 * State comes from LoopModel.stateAt(t); this file only draws it.
 * Colors are CSS variables set via style= (SVG presentation attributes do not
 * accept var()). Text that sits on a card carries data-on="<box id>" and text
 * that must stay inside a card carries data-fit="<box id>"; the browser tests
 * check both. Two layouts: landscape 1200×675 and portrait 540×1080 (svg
 * narrower than 780px); portrait text is never set below 15px, so it renders
 * at 9px or more down to a 360px phone. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var M = window.LoopModel;
  var N = M.STATIONS.length;

  var GEO = {
    landscape: {
      W: 1200, H: 675, minFont: 13,
      roundLabel: { x: 30, y: 52, size: 28, descX: 140, descY: 52, descSize: 16 },
      ring: { cx: 290, cy: 330, R: 205, pillW: 134, pillH: 46, font: 20 },
      center: { w: 250 },
      branch: { titleX: 612, titleY: 64, nameDX: 78, x0: 662, dx: 125, y: 134, drop: 210, hash: 14 },
      score: { x: 612, y: 318, x2: 880, size: 30 },
      table: { x: 612, titleY: 372, headY: 404, rowY: 438, rowH: 36, font: 14, right: 1180,
               cols: [['commit', 0], ['val_bpb', 74], ['memory_gb', 156], ['status', 242], ['description', 324]] }
    },
    portrait: {
      W: 540, H: 1080, minFont: 15,
      roundLabel: { x: 24, y: 44, size: 26, descX: 24, descY: 76, descSize: 16 },
      ring: { cx: 270, cy: 300, R: 185, pillW: 120, pillH: 44, font: 19 },
      center: { w: 236 },
      branch: { titleX: 24, titleY: 562, nameDX: 80, x0: 72, dx: 130, y: 616, drop: 690, hash: 16 },
      score: { x: 24, y: 800, x2: 280, size: 26 },
      table: { x: 24, titleY: 866, headY: 898, rowY: 934, rowH: 38, font: 16, right: 520,
               cols: [['commit', 0], ['val_bpb', 76], ['status', 166], ['description', 256]] }
    }
  };

  var STATION_DEG = M.STATIONS.map(function (_, k) { return -90 + k * 360 / N; });

  var D = window.ExplainDraw;
  var tag = D.tag, lerp = D.lerp, polar = D.polar, fmt = D.fmt, Painter = D.Painter;

  /* ---------- pieces ---------- */

  function drawRoundLabel(g, P, s, copy) {
    var L = g.roundLabel;
    if (s.phase !== 'run') return '';
    return P.text(L.x, L.y, fmt(copy.labels.round, { n: s.round + 1 }), P.style('--ink', L.size)) +
      P.text(L.descX, L.descY, M.ROWS[s.round].desc, P.style('--ink-2', L.descSize, '--font-mono'));
  }

  function dotAngle(s) {
    if (s.phase !== 'run') return -90;
    var k = M.STATIONS.indexOf(s.station);
    var from = k === 0 ? -90 - 360 / N : STATION_DEG[k - 1];
    return lerp(from, STATION_DEG[k], T.ease.inOut(T.clamp(s.local / 0.35, 0, 1)));
  }

  function drawRing(g, P, s, copy, noReset) {
    var R = g.ring, base = '';
    base += tag('circle', { cx: R.cx, cy: R.cy, r: R.R, style: 'fill:none;stroke:var(--line);stroke-width:2;stroke-dasharray:6 7' });
    var ang = dotAngle(s);
    if (s.phase === 'run' && ang > -90) {
      var a = polar(R.cx, R.cy, R.R, -90), b = polar(R.cx, R.cy, R.R, ang);
      base += tag('path', { d: 'M' + a[0] + ' ' + a[1] + ' A' + R.R + ' ' + R.R + ' 0 ' + (ang + 90 > 180 ? 1 : 0) + ' 1 ' + b[0] + ' ' + b[1],
        style: 'fill:none;stroke:var(--accent);stroke-width:4;stroke-linecap:round' });
    }
    if (s.phase === 'outro') {
      base += tag('circle', { cx: R.cx, cy: R.cy, r: R.R,
        style: 'fill:none;stroke:var(' + (noReset ? '--crash' : '--keep') + ');stroke-width:4;opacity:' + T.ease.out(s.local).toFixed(3) });
    }
    // the dot sits under the pills: visible while travelling, hidden once it arrives
    var d = polar(R.cx, R.cy, R.R, ang);
    var dot = s.phase === 'run' ? tag('circle', { cx: d[0].toFixed(2), cy: d[1].toFixed(2), r: 9, style: 'fill:var(--accent);stroke:var(--card);stroke-width:3' }) : '';

    var pills = '', cur = s.phase === 'run' ? M.STATIONS.indexOf(s.station) : -1;
    M.STATIONS.forEach(function (key, k) {
      var p = polar(R.cx, R.cy, R.R, STATION_DEG[k]);
      var active = k === cur && s.local >= 0.3;
      var box = { x: p[0] - R.pillW / 2, y: p[1] - R.pillH / 2, width: R.pillW, height: R.pillH, rx: R.pillH / 2 };
      pills += tag('rect', Object.assign({ style: 'fill:var(--card);stroke:var(' + (k < cur ? '--ink-3' : '--line') + ');stroke-width:1.5' }, box));
      if (active) pills += tag('rect', Object.assign({ style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:2.5' }, box));
      pills += P.text(p[0], p[1] + R.font * 0.36, copy.stations[key].label,
        P.style(active ? '--accent-ink' : '--ink', R.font, '--font-hand', active ? 700 : 400), { 'text-anchor': 'middle' });
    });
    return base + dot + pills;
  }

  function centerLines(g, P, lines) {
    var R = g.ring, total = 0, out = '';
    lines.forEach(function (l) { total += l.gap; });
    var y = R.cy - total / 2;
    lines.forEach(function (l) {
      y += l.gap;
      if (l.t) out += P.text(R.cx, y, l.t, l.style, Object.assign({ 'text-anchor': 'middle' }, l.extra || {}));
    });
    return out;
  }

  var STAMP = {
    baseline: ['基线 ✓', '--keep', '--keep-ink'],
    keep: ['变好 ✓', '--keep', '--keep-ink'],
    discard: ['没变好', '--discard', '--ink-2'],
    crash: ['崩溃 ✗', '--crash', '--crash-ink']
  };

  function drawCenter(g, P, s, copy, prevBest, noReset) {
    var R = g.ring, W = g.center.w, out = '', left = R.cx - W / 2;
    if (s.phase === 'intro') {
      return centerLines(g, P, [
        { t: '1 轮 = ' + N + ' 站', style: P.style('--ink', 30, '--font-hand', 700), gap: 30 },
        { t: '变好就留下', style: P.style('--keep-ink', 20), gap: 36 },
        { t: '没变好就退回', style: P.style('--ink-2', 20), gap: 30 }
      ]);
    }
    if (s.phase === 'outro') {
      return centerLines(g, P, [
        { t: '4 轮跑完', style: P.style('--ink', 30, '--font-hand', 700), gap: 30 },
        { t: noReset ? '变差、崩溃都没撤' : '保留 2 · 丢弃 1 · 崩溃 1', style: P.style(noReset ? '--crash-ink' : '--ink-2', 19), gap: 36 },
        { t: '一晚约 100 轮', style: P.style('--accent-ink', 21, '--font-hand', 700), gap: 32 }
      ]);
    }
    var row = M.ROWS[s.round], k = s.station;
    var appear = 'opacity:' + T.ease.out(T.clamp((s.local - 0.2) / 0.3, 0, 1)).toFixed(3);

    if (k === 'edit') {
      var h = 132, top = R.cy - h / 2;
      out += tag('rect', { x: left, y: top, width: W, height: h, rx: 10, style: 'fill:var(--card);stroke:var(--ink);stroke-width:1.5' });
      out += tag('rect', { x: left, y: top, width: W, height: 30, rx: 10, style: 'fill:var(--paper-2)' });
      out += P.text(left + 14, top + 21, 'train.py', P.style('--ink', 15, '--font-mono', 600));
      out += tag('rect', { x: left + 14, y: top + 52, width: W * 0.55, height: 6, rx: 3, style: 'fill:var(--line)' });
      out += tag('rect', { x: left + 14, y: top + 72, width: W * 0.4, height: 6, rx: 3, style: 'fill:var(--line)' });
      var line = s.round === 0 ? '（原样不改）' : '+ ' + row.desc;
      out += tag('g', { style: appear },
        tag('rect', { x: left + 8, y: top + 90, width: W - 16, height: 32, rx: 6, style: 'fill:var(--accent-soft)', 'data-box': 'edit' }) +
        P.fit(left + 16, top + 112, line, '--accent-ink', 15, '--font-mono', 600, W - 32, 'edit'));
      return out;
    }
    if (k === 'commit') {
      return tag('g', { style: appear }, centerLines(g, P, [
        { t: 'git commit', style: P.style('--ink-2', 17, '--font-mono'), gap: 18 },
        { t: row.commit, style: P.style('--ink', 30, '--font-mono', 600), gap: 46 }
      ]));
    }
    if (k === 'train') {
      var p = s.local, rr = 50, cy = R.cy - 26;
      var secs = Math.round((1 - p) * 300);
      var mmss = Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2);
      var a0 = polar(R.cx, cy, rr, -90), a1 = polar(R.cx, cy, rr, -90 + 359.9 * p);
      out += tag('circle', { cx: R.cx, cy: cy, r: rr, style: 'fill:var(--card);stroke:var(--line);stroke-width:8' });
      if (p > 0.001) {
        out += tag('path', { d: 'M' + a0[0] + ' ' + a0[1] + ' A' + rr + ' ' + rr + ' 0 ' + (p > 0.5 ? 1 : 0) + ' 1 ' + a1[0] + ' ' + a1[1],
          style: 'fill:none;stroke:var(--accent);stroke-width:8;stroke-linecap:round' });
      }
      out += P.text(R.cx, cy + 9, mmss, P.style('--ink', 26, '--font-mono', 600), { 'text-anchor': 'middle' });
      var cmd = copy.commands.train.split(' > ');
      out += tag('rect', { x: left, y: cy + rr + 12, width: W, height: 52, rx: 8, style: 'fill:none', 'data-box': 'train-cmd' });
      out += P.fit(R.cx, cy + rr + 32, cmd[0], '--ink-2', 15, '--font-mono', 400, W, 'train-cmd', 'middle');
      out += P.fit(R.cx, cy + rr + 54, '> ' + cmd[1], '--ink-2', 15, '--font-mono', 400, W, 'train-cmd', 'middle');
      return out;
    }
    if (k === 'read') {
      var th = 136, tt = R.cy - th / 2 - 6, avail = W - 24;
      var parts = copy.commands.read.split('\\|');
      out += tag('rect', { x: left, y: tt, width: W, height: th, rx: 10, style: 'fill:var(--term-bg)', 'data-box': 'term' });
      out += P.fit(left + 12, tt + 28, parts[0] + '\\|', '--term-ink', 15, '--font-mono', 400, avail, 'term');
      out += P.fit(left + 12, tt + 50, '  ' + parts[1], '--term-ink', 15, '--font-mono', 400, avail, 'term');
      if (s.local > 0.35) {
        if (s.readout) {
          out += P.fit(left + 12, tt + 88, s.readout, '--term-ok', 17, '--font-mono', 600, avail, 'term');
          out += P.fit(left + 12, tt + 114, s.vram, '--term-ok', 15, '--font-mono', 400, avail, 'term');
        } else {
          out += P.fit(left + 12, tt + 88, '（什么也没有）', '--term-err', 17, '--font-mono', 600, avail, 'term');
          out += P.fit(left + 12, tt + 114, copy.commands.tail, '--term-ink', 15, '--font-mono', 400, avail, 'term');
        }
      }
      return out;
    }
    if (k === 'decide') {
      var lines = [];
      if (s.round === 0) lines.push({ t: '基线 ' + row.bpb.toFixed(6), style: P.style('--ink', 24, '--font-mono', 600), gap: 30 });
      else if (row.status === 'crash') lines.push({ t: '没有分数', style: P.style('--crash-ink', 26, '--font-hand', 700), gap: 30 });
      else {
        lines.push({ t: row.bpb.toFixed(6), style: P.style('--ink', 24, '--font-mono', 600), gap: 26 });
        lines.push({ t: '< ' + prevBest.toFixed(6) + ' ?', style: P.style('--ink-2', 20, '--font-mono'), gap: 32 });
      }
      out += centerLines(g, P, lines.concat([{ t: '', gap: 50 }]));
      if (s.verdict) {
        var st = STAMP[s.verdict];
        var sp = T.ease.out(T.clamp((s.local - 0.5) / 0.25, 0, 1));
        out += tag('g', { transform: 'translate(' + R.cx + ' ' + (R.cy + 46) + ') rotate(-8) scale(' + (1.6 - 0.6 * sp).toFixed(3) + ')', style: 'opacity:' + sp.toFixed(3) },
          tag('rect', { x: -70, y: -24, width: 140, height: 46, rx: 8, style: 'fill:none;stroke:var(' + st[1] + ');stroke-width:3' }) +
          P.text(0, 9, st[0], P.style(st[2], 24, '--font-hand', 700), { 'text-anchor': 'middle', 'data-on': 'stage' }));
      }
      return out;
    }
    if (k === 'log') {
      return tag('g', { style: appear }, centerLines(g, P, [
        { t: '写进 results.tsv', style: P.style('--ink', 22, '--font-hand', 700), gap: 22 },
        { t: '（只记录，不提交）', style: P.style('--ink-2', 17), gap: 34 }
      ]));
    }
    // git: advance or reset (program.md steps 8-9)
    var v = s.verdict, lines2;
    var headCommit = M.ROWS[Math.max(0, v === 'discard' || v === 'crash' ? s.head : s.round)].commit;
    if (v === 'baseline' || v === 'keep') {
      lines2 = [{ t: '分支前进一格', style: P.style('--keep-ink', 26, '--font-hand', 700), gap: 28 },
                { t: 'HEAD → ' + row.commit, style: P.style('--ink-2', 17, '--font-mono'), gap: 34 }];
    } else if (noReset) {
      lines2 = [{ t: '不 reset', style: P.style('--crash-ink', 26, '--font-hand', 700), gap: 28 },
                { t: v === 'crash' ? '崩溃的代码留下了' : '变差的代码留下了', style: P.style('--ink-2', 18), gap: 34 }];
    } else if (v === 'discard') {
      lines2 = [{ t: 'git reset', style: P.style('--ink', 26, '--font-mono', 600), gap: 28 },
                { t: '退回 ' + headCommit, style: P.style('--ink-2', 17, '--font-mono'), gap: 34 }];
    } else {
      lines2 = [{ t: '跳过这个点子', style: P.style('--ink', 24, '--font-hand', 700), gap: 28 },
                { t: '分支停在 ' + headCommit, style: P.style('--ink-2', 17, '--font-mono'), gap: 34 }];
    }
    return tag('g', { style: appear }, centerLines(g, P, lines2));
  }

  function nodeY(g, s, node) {
    var B = g.branch;
    if (node.onBranch) return B.y;
    if (s.phase === 'run' && node.round === s.round && s.station === 'git') {
      return lerp(B.y, B.drop, T.ease.inOut(T.clamp((s.local - 0.3) / 0.4, 0, 1)));
    }
    return B.drop;
  }

  function drawBranch(g, P, s, copy) {
    var B = g.branch, out = '';
    var xs = function (i) { return B.x0 + i * B.dx; };
    out += P.text(B.titleX, B.titleY, copy.labels.branch_title, P.style('--ink', 17, '--font-head', 700)) +
      P.text(B.titleX + B.nameDX, B.titleY, copy.branch, P.style('--ink-2', 15, '--font-mono'));
    out += tag('line', { x1: B.x0 - 30, y1: B.y, x2: xs(3) + 40, y2: B.y, style: 'stroke:var(--line-soft);stroke-width:2;stroke-dasharray:3 6' });

    var onb = s.nodes.filter(function (n) { return n.onBranch && n.status !== 'pending'; });
    for (var j = 1; j < onb.length; j++) {
      var bad = onb[j].status !== 'keep';
      out += tag('line', { x1: xs(onb[j - 1].round), y1: B.y, x2: xs(onb[j].round), y2: B.y,
        style: 'stroke:var(' + (bad ? '--crash' : '--ink') + ');stroke-width:4;stroke-linecap:round' });
    }
    s.nodes.forEach(function (n) {
      if (n.status === 'pending' && s.head >= 0) {
        out += tag('line', { x1: xs(s.head), y1: B.y, x2: xs(n.round), y2: B.y, style: 'stroke:var(--accent);stroke-width:3;stroke-dasharray:6 6' });
      }
    });
    s.nodes.forEach(function (n) {
      if (n.status !== 'discard' || n.onBranch) return;
      var y = nodeY(g, s, n);
      if (y < B.drop - 1) return;
      var x = xs(n.round), hx = xs(n.resetTo);
      out += tag('path', { d: 'M' + (x - 18) + ' ' + (y - 6) + ' C' + (x - 50) + ' ' + (y - 10) + ' ' + (hx + 30) + ' ' + (B.y + 40) + ' ' + (hx + 12) + ' ' + (B.y + 20),
        style: 'fill:none;stroke:var(--discard);stroke-width:2;stroke-dasharray:5 5', 'marker-end': 'url(#loop-arrow)' });
      out += P.text(x + 24, y + 6, 'git reset', P.style('--ink-2', B.hash, '--font-mono'));
    });
    s.nodes.forEach(function (n) {
      var x = xs(n.round), y = nodeY(g, s, n), st = n.status;
      var style = {
        pending: 'fill:var(--card);stroke:var(--accent);stroke-width:3;stroke-dasharray:4 4',
        keep: 'fill:var(--keep);stroke:var(--card);stroke-width:3',
        discard: 'fill:var(--card);stroke:var(--discard);stroke-width:3;stroke-dasharray:4 4',
        crash: 'fill:var(--card);stroke:var(--crash);stroke-width:3'
      }[st];
      out += tag('circle', { cx: x, cy: y.toFixed(2), r: 15, style: style });
      if (st === 'keep') out += tag('path', { d: 'M' + (x - 6) + ' ' + y + ' l4 4 l8 -9', style: 'fill:none;stroke:var(--card);stroke-width:3;stroke-linecap:round;stroke-linejoin:round' });
      if (st === 'crash') out += tag('path', { d: 'M' + (x - 6) + ' ' + (y - 6) + ' l12 12 M' + (x + 6) + ' ' + (y - 6) + ' l-12 12', style: 'stroke:var(--crash);stroke-width:3;stroke-linecap:round' });
      out += P.text(x, y + 38, n.commit, P.style(st === 'keep' ? '--ink' : '--ink-2', B.hash, '--font-mono'), { 'text-anchor': 'middle' });
    });
    if (s.head >= 0) {
      var hx2 = xs(s.head);
      out += tag('rect', { x: hx2 - 32, y: B.y - 52, width: 64, height: 26, rx: 6, style: 'fill:var(--ink)' });
      out += P.text(hx2, B.y - 33, 'HEAD', P.style('--paper', 14, '--font-mono', 600), { 'text-anchor': 'middle' });
    }
    return out;
  }

  function drawScore(g, P, s, copy, noReset) {
    var S = g.score, out = '';
    out += P.text(S.x, S.y - S.size - 6, copy.labels.best, P.style('--ink-2', 18));
    out += P.text(S.x, S.y, s.best === null ? '—' : s.best.toFixed(6), P.style('--keep-ink', S.size, '--font-mono', 600));
    if (noReset && s.head >= 0 && s.best !== null) {
      var headNode = s.nodes[s.head];
      var val = headNode.status === 'crash' ? '跑不起来' : s.headBpb > s.best ? s.headBpb.toFixed(6) : null;
      if (val) {
        out += P.text(S.x2, S.y - S.size - 6, copy.labels.head_score, P.style('--ink-2', 18));
        out += P.text(S.x2, S.y, val, P.style('--crash-ink', S.size, headNode.status === 'crash' ? '--font-hand' : '--font-mono', 600));
      }
    }
    return out;
  }

  function drawTable(g, P, s, copy) {
    var Tb = g.table, out = '';
    out += P.text(Tb.x, Tb.titleY, copy.labels.table_title, P.style('--ink', 17, '--font-mono', 600));
    Tb.cols.forEach(function (c) { out += P.text(Tb.x + c[1], Tb.headY, c[0], P.style('--ink-2', Tb.font, '--font-mono')); });
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
        inner += P.text(Tb.x + c[1], y, cell[0], P.style(cell[1], Tb.font, '--font-mono', c[0] === 'status' ? 700 : 400));
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
    var vars = { bpb: row.bpb.toFixed(6), best: prevBest === null ? '' : prevBest.toFixed(6) };
    if (s.station === 'edit' && s.round === 0) return sp.edit_baseline;
    if (s.station === 'read' && row.status === 'crash') return sp.read_crash;
    if (s.station === 'decide' && s.verdict) return fmt(copy.verdicts[s.verdict], vars);
    if (s.station === 'git' && s.local >= 0.3) {
      var key = (s.verdict === 'discard' || s.verdict === 'crash') && noReset ? s.verdict + '_noreset' : s.verdict;
      return fmt(copy.actions[key], vars);
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
      return M.stateAt(M.SCHED[s.round * N].start, opts).best;
    }

    return {
      duration: M.duration(),
      stops: M.stops(),
      setOption: function (key, value) { opts[key] = value; },
      layout: function (width) {
        mode = width > 0 && width < 780 ? 'portrait' : 'landscape';
        svg.setAttribute('viewBox', '0 0 ' + GEO[mode].W + ' ' + GEO[mode].H);
      },
      render: function (t) {
        var g = GEO[mode], P = Painter(g);
        var s = M.stateAt(t, opts);
        var prevBest = prevBestFor(s);
        svg.innerHTML = DEFS + drawRoundLabel(g, P, s, copy) + drawRing(g, P, s, copy, opts.noReset) +
          drawCenter(g, P, s, copy, prevBest, opts.noReset) + drawBranch(g, P, s, copy) +
          drawScore(g, P, s, copy, opts.noReset) + drawTable(g, P, s, copy);
        ctx.caption(captionFor(s, copy, opts.noReset, prevBest));
      }
    };
  });
})();
