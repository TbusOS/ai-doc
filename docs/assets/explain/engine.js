/* Explainer scene engine.
 *
 * A scene widget registers a factory:
 *   Explain.register('loop', function (svg, ctx) {
 *     return { duration, stops, render(t), setOption?(key, value), layout?(widthPx) };
 *   });
 * ctx = { copy: <this scene's object from zh.json>, data: <whole zh.json>, caption(text) }.
 *
 * The engine owns time: play / pause / step / scrub / speed, pauses scenes that
 * leave the viewport, shows the final frame when the reader asked for reduced
 * motion, and in capture mode (?capture=<sceneId>) exposes
 * window.__explain = { duration, seek(t) } for the GIF / MP4 exporter. */
(function () {
  'use strict';

  var T = window.ExplainTimeline;
  var registry = {};
  var mounted = [];  // every mounted scene; only one plays at a time
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var captureId = new URLSearchParams(window.location.search).get('capture');
  var SPEEDS = [1, 2, 0.5];

  document.documentElement.classList.add('js');

  function register(name, factory) { registry[name] = factory; }

  function readData() {
    var el = document.getElementById('explain-data');
    if (!el) return { scenes: [] };
    try { return JSON.parse(el.textContent); } catch (e) { return { scenes: [] }; }
  }

  function findCopy(data, id) {
    var scenes = data.scenes || [];
    for (var i = 0; i < scenes.length; i++) if (scenes[i].id === id) return scenes[i];
    return {};
  }

  function mount(section, data) {
    var factory = registry[section.dataset.widget];
    if (!factory) return null;
    var svg = section.querySelector('.stage-svg');
    var stage = section.querySelector('.stage');
    var capEl = section.querySelector('.stage-caption');
    var ctx = {
      copy: findCopy(data, section.dataset.scene),
      data: data,
      caption: function (text) { if (capEl && capEl.textContent !== text) capEl.textContent = text; }
    };
    var w;
    try {
      w = factory(svg, ctx);
    } catch (err) {
      // a broken scene must not take the others down: show its text version instead
      section.classList.add('scene-broken');
      var tr = section.querySelector('.stage-transcript');
      if (tr) tr.open = true;
      console.error('scene "' + section.dataset.scene + '" failed to start:', err);
      return null;
    }
    ctx.redraw = function () { paint(); };
    var transcript = section.querySelector('.stage-transcript');
    if (transcript) transcript.open = false;  // the animation is running; the text version stays one click away
    var s = { t: 0, playing: false, played: false, pausedByView: false, speedIdx: 0, last: 0 };

    var ui = {
      play: section.querySelector('.stage-controls .play'),
      prev: section.querySelector('.stage-controls .prev'),
      next: section.querySelector('.stage-controls .next'),
      scrub: section.querySelector('.stage-controls .scrub'),
      speed: section.querySelector('.stage-controls .speed'),
      clock: section.querySelector('.stage-controls .clock')
    };

    function paint() {
      w.render(s.t);
      if (ui.scrub) ui.scrub.value = String(Math.round((s.t / w.duration) * 1000));
      if (ui.clock) ui.clock.textContent = s.t.toFixed(1) + ' / ' + w.duration.toFixed(1) + ' s';
      if (ui.play) {
        ui.play.textContent = s.playing ? '❚❚' : '▶';
        ui.play.setAttribute('aria-label', s.playing ? '暂停' : '播放');
      }
    }

    function tick(now) {
      if (!s.playing) return;
      var dt = Math.min(0.1, (now - s.last) / 1000);
      s.last = now;
      s.t = Math.min(w.duration, s.t + dt * SPEEDS[s.speedIdx]);
      if (s.t >= w.duration) s.playing = false;
      paint();
      if (s.playing) window.requestAnimationFrame(tick);
    }

    function play() {
      mounted.forEach(function (other) { if (other.widget !== w && other.state.playing) other.pause(); });
      if (s.t >= w.duration - 1e-6) s.t = 0;
      s.playing = true; s.played = true; s.pausedByView = false;
      s.last = performance.now();
      paint();
      window.requestAnimationFrame(tick);
    }

    function pause() { s.playing = false; paint(); }
    function seek(t) { s.t = T.clamp(t, 0, w.duration); paint(); }

    function relayout() {
      if (w.layout) w.layout(svg.getBoundingClientRect().width);
      paint();
    }

    if (ui.play) ui.play.addEventListener('click', function () { s.playing ? pause() : play(); });
    if (ui.prev) ui.prev.addEventListener('click', function () { pause(); seek(T.prevStop(w.stops, s.t)); });
    if (ui.next) ui.next.addEventListener('click', function () { pause(); seek(T.nextStop(w.stops, s.t)); });
    if (ui.scrub) ui.scrub.addEventListener('input', function () {
      var t = (+ui.scrub.value / 1000) * w.duration;  // read first: pause() repaints the slider
      pause(); seek(t);
    });
    if (ui.speed) ui.speed.addEventListener('click', function () {
      s.speedIdx = (s.speedIdx + 1) % SPEEDS.length;
      ui.speed.textContent = SPEEDS[s.speedIdx] + '×';
    });

    if (stage) {
      stage.setAttribute('tabindex', '0');
      stage.addEventListener('keydown', function (e) {
        if (e.key === ' ') { e.preventDefault(); s.playing ? pause() : play(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); pause(); seek(T.nextStop(w.stops, s.t)); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); pause(); seek(T.prevStop(w.stops, s.t)); }
      });
    }

    // scene controls: checkbox (bool), range slider (number), button group (string)
    var options = {};  // what the scene was last told, per control (read by the browser tests)
    function tell(key, value) { options[key] = value; if (w.setOption) w.setOption(key, value); }
    function setOption(key, value) { tell(key, value); paint(); }
    Array.prototype.forEach.call(section.querySelectorAll('input[type="checkbox"][data-option]'), function (box) {
      box.addEventListener('change', function () { setOption(box.dataset.option, box.checked); });
    });
    Array.prototype.forEach.call(section.querySelectorAll('input[type="range"][data-option]'), function (range) {
      var out = section.querySelector('output[data-for="' + range.dataset.option + '"]');
      range.addEventListener('input', function () {
        if (out) out.textContent = range.value;
        setOption(range.dataset.option, +range.value);
      });
    });
    Array.prototype.forEach.call(section.querySelectorAll('button[data-option][data-value]'), function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(section.querySelectorAll('button[data-option="' + btn.dataset.option + '"]'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        setOption(btn.dataset.option, btn.dataset.value);
      });
    });

    // Push every control's starting value before the first frame: the scene must not rely on its
    // own defaults matching the copy, and the browser may restore a checkbox state after "back".
    Array.prototype.forEach.call(section.querySelectorAll('input[type="checkbox"][data-option]'), function (box) {
      tell(box.dataset.option, box.checked);
    });
    Array.prototype.forEach.call(section.querySelectorAll('input[type="range"][data-option]'), function (range) {
      var out = section.querySelector('output[data-for="' + range.dataset.option + '"]');
      if (out) out.textContent = range.value;
      tell(range.dataset.option, +range.value);
    });
    Array.prototype.forEach.call(section.querySelectorAll('button[data-option][aria-pressed="true"]'), function (btn) {
      tell(btn.dataset.option, btn.dataset.value);
    });

    if (window.ResizeObserver) new ResizeObserver(relayout).observe(svg);

    s.t = reduced ? w.duration : 0;
    relayout();

    return {
      section: section, stage: stage || section, widget: w, state: s, options: options,
      play: play, pause: pause, seek: seek,
      onVisible: function (ratio) {
        if (reduced) return;
        if (ratio >= 0.5 && (!s.played || s.pausedByView)) play();
        else if (ratio < 0.15 && s.playing) { pause(); s.pausedByView = true; }
      }
    };
  }

  // observe the stage, not the whole scene: a scene with its text and source list
  // is taller than the window, so its visible ratio never reaches 0.5
  function watchViewport(scenes) {
    if (!window.IntersectionObserver) return;
    var byEl = new Map(scenes.map(function (sc) { return [sc.stage, sc]; }));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { byEl.get(e.target).onVisible(e.intersectionRatio); });
    }, { threshold: [0, 0.15, 0.5] });
    scenes.forEach(function (sc) { io.observe(sc.stage); });
  }

  function watchReveal() {
    var els = document.querySelectorAll('.rise');
    if (!window.IntersectionObserver) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px 20% 0px' });  // start the fade a little before it scrolls in
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* theme button: auto -> light -> dark */
  var THEME_ICONS = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
  };
  var THEME_NAMES = { auto: '跟随系统', light: '浅色', dark: '深色' };

  function storedTheme() {
    try { return window.localStorage.getItem('aidoc-theme') || 'auto'; } catch (e) { return 'auto'; }
  }

  function applyTheme(mode) {
    if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mode);
    try { window.localStorage.setItem('aidoc-theme', mode); } catch (e) { /* storage blocked: theme lasts this page only */ }
    var btn = document.querySelector('.theme-btn');
    if (btn) {
      btn.innerHTML = THEME_ICONS[mode];
      btn.setAttribute('aria-label', '切换主题（当前：' + THEME_NAMES[mode] + '）');
      btn.dataset.mode = mode;
    }
  }

  function initTheme() {
    applyTheme(storedTheme());
    var btn = document.querySelector('.theme-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var order = ['auto', 'light', 'dark'];
      applyTheme(order[(order.indexOf(btn.dataset.mode || 'auto') + 1) % order.length]);
    });
  }

  function start() {
    var data = readData();
    var sections = Array.prototype.slice.call(document.querySelectorAll('.scene[data-widget]'));

    if (captureId) {
      document.body.classList.add('capture');
      var target = sections.filter(function (el) { return el.dataset.scene === captureId; })[0];
      if (!target) return;
      target.classList.add('is-capture');
      var sc = mount(target, data);
      if (!sc) return;
      mounted.push(sc);
      sc.seek(0);
      window.__explain = { duration: sc.widget.duration, seek: function (t) { sc.seek(t); } };
      return;
    }

    initTheme();
    watchReveal();
    var scenes = sections.map(function (el) { return mount(el, data); }).filter(Boolean);
    Array.prototype.push.apply(mounted, scenes);
    window.Explain.mounted = scenes.map(function (sc) {
      return { id: sc.section.dataset.scene, stops: sc.widget.stops, duration: sc.widget.duration, options: sc.options };
    });
    watchViewport(scenes);
  }

  window.Explain = { register: register };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
