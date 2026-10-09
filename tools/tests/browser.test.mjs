// Browser checks for the explainer page — things unit tests cannot see.
//   node --test tools/tests/browser.test.mjs
// Needs Playwright: tools/node_modules (cd tools && npm install), else sky-skills' copy;
// PLAYWRIGHT=<path to index.mjs> overrides.
// Pages are opened over file://, the same way check_objective.mjs opens them.
import test, { after } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
// behind a proxy: pass it to Chromium and serve the web fonts from disk
import { launchOptions, useFontCache, closeFontCache } from '../net.mjs';

const here = dirname(fileURLToPath(import.meta.url));
// PAGE=docs/zh/explain/<slug>--<tag>.html checks a preview page with only some scenes
const PAGE = pathToFileURL(resolve(process.env.PAGE || resolve(here, '../../docs/zh/explain/autoresearch.html'))).href;
const PW = process.env.PLAYWRIGHT || [
  resolve(here, '../node_modules/playwright/index.mjs'),
  join(homedir(), 'linux-kernel/github/sky-skills/node_modules/playwright/index.mjs'),
  join(homedir(), 'claude-tools/sky-skills/node_modules/playwright/index.mjs'),
].find(existsSync) || resolve(here, '../node_modules/playwright/index.mjs');
const skip = existsSync(PW) ? false : `playwright not found at ${PW}`;
const pw = skip ? {} : await import(PW);
const { chromium } = pw;
after(closeFontCache);

async function withPage(opts, fn) {
  const browser = await chromium.launch(launchOptions());
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...opts });
    await useFontCache(ctx, pw);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(opts.url || PAGE, { waitUntil: 'load', timeout: 180000 });  // first run fills the font cache
    await fn(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

const sceneSel = id => `.scene[data-scene="${id}"]`;
const mounted = page => page.evaluate(() => window.Explain.mounted);

test('every scene mounted without errors', { skip }, async () => {
  await withPage({}, async page => {
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('.scene[data-widget]')).map(s => s.dataset.scene));
    assert.deepEqual((await mounted(page)).map(m => m.id), ids);
  });
});

test('scrub bar moves every animation', { skip }, async () => {
  await withPage({}, async page => {
    for (const m of await mounted(page)) {
      const clock = page.locator(`${sceneSel(m.id)} .clock`);
      assert.match(await clock.textContent(), new RegExp('^' + m.duration.toFixed(1)), m.id);  // reduced motion: last frame
      await page.locator(`${sceneSel(m.id)} .scrub`).fill('400');
      assert.match(await clock.textContent(), new RegExp('^' + (0.4 * m.duration).toFixed(1) + ' '), m.id);
    }
  });
});

// Every toggle / slider / choice: the scene was told its starting value, and moving it changes the
// picture at one stop or more (a control that never changes anything is broken).
async function controlsOf(page, id) {
  return page.evaluate(sel => Array.from(document.querySelectorAll(sel + ' [data-option]'))
    .filter(el => el.matches('input[type="checkbox"], input[type="range"], button[data-value]'))
    .map(el => ({ option: el.dataset.option, kind: el.type === 'checkbox' ? 'toggle' : el.type === 'range' ? 'slider' : 'choice',
      value: el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.dataset.value,
      pressed: el.getAttribute('aria-pressed') === 'true', min: el.min, max: el.max })), sceneSel(id));
}

test('every control starts its scene with the value shown on the page', { skip }, async () => {
  await withPage({}, async page => {
    for (const m of await mounted(page)) {
      for (const c of await controlsOf(page, m.id)) {
        if (c.kind === 'choice' && !c.pressed) continue;
        assert.deepEqual(m.options[c.option], c.value, `${m.id}: ${c.option}`);
      }
    }
  });
});

test('every control changes the picture at some stop', { skip }, async () => {
  await withPage({}, async page => {
    for (const m of await mounted(page)) {
      const sec = sceneSel(m.id);
      const seen = new Set();
      for (const c of await controlsOf(page, m.id)) {
        const key = c.option + (c.kind === 'choice' ? '=' + c.value : '');
        if (seen.has(key) || (c.kind === 'choice' && c.pressed)) continue;
        seen.add(key);
        const flip = async on => {
          if (c.kind === 'toggle') await page.locator(`${sec} input[type="checkbox"][data-option="${c.option}"]`).setChecked(on);
          else if (c.kind === 'slider') await page.locator(`${sec} input[type="range"][data-option="${c.option}"]`).fill(on ? c.max : c.min);
          else await page.locator(on ? `${sec} button[data-option="${c.option}"][data-value="${c.value}"]`
            : `${sec} button[data-option="${c.option}"]:not([data-value="${c.value}"])`).first().click();
        };
        let changed = false;
        for (const t of m.stops.concat([m.duration])) {
          await page.locator(`${sec} .scrub`).fill(String(Math.round(1000 * t / m.duration)));
          await flip(false);
          const a = await page.locator(`${sec} .stage-svg`).innerHTML();
          await flip(true);
          const b = await page.locator(`${sec} .stage-svg`).innerHTML();
          await flip(false);
          if (a !== b) { changed = true; break; }
        }
        assert.ok(changed, `${m.id}: control ${key} never changes the picture`);
      }
    }
  });
});

test('arrow keys step to the next stop', { skip }, async () => {
  await withPage({}, async page => {
    for (const m of await mounted(page)) {
      await page.locator(`${sceneSel(m.id)} .scrub`).fill('0');
      await page.locator(`${sceneSel(m.id)} .stage`).focus();
      await page.keyboard.press('ArrowRight');
      const next = m.stops.find(x => x > 1e-9);
      assert.match(await page.locator(`${sceneSel(m.id)} .clock`).textContent(), new RegExp('^' + next.toFixed(1) + ' '), m.id);
    }
  });
});

// every scene: each stop plus half a second after it; fn(t, svgSelector)
async function eachFrame(page, fn) {
  for (const m of await mounted(page)) {
    const total = m.duration;
    for (const stop of m.stops) {
      for (const t of [stop, Math.min(total, stop + 0.5)]) {
        await page.locator(`${sceneSel(m.id)} .scrub`).fill(String(Math.round((t / total) * 1000)));
        await fn(`${m.id} t=${t.toFixed(2)}`, `${sceneSel(m.id)} .stage-svg`);
      }
    }
  }
}

for (const width of [1280, 390]) {
  test(`text stays inside its card (${width}px)`, { skip }, async () => {
    await withPage({ viewport: { width, height: 900 } }, async page => {
      await eachFrame(page, async (where, svgSel) => {
        const bad = await page.evaluate(svgSel => {
          const out = [];
          const svg = document.querySelector(svgSel);
          svg.querySelectorAll('[data-fit]').forEach(el => {
            const box = svg.querySelector(`[data-box="${el.dataset.fit}"]`);
            const b = el.getBBox(), c = box.getBBox();
            if (b.x < c.x - 0.5 || b.x + b.width > c.x + c.width + 0.5) out.push(`${el.textContent} (${(b.x + b.width).toFixed(0)} > ${(c.x + c.width).toFixed(0)})`);
          });
          return out;
        }, svgSel);
        assert.deepEqual(bad, [], where);
      });
    });
  });
}

function contrastScript(svgSel) {
  const svg = document.querySelector(svgSel);
  const parse = c => { const v = (c.match(/[\d.]+/g) || []).map(Number); return { rgb: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 }; };
  const lum = rgb => {
    const [r, g, b] = rgb.map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const stageBg = parse(getComputedStyle(document.querySelector('.stage')).backgroundColor).rgb;
  // a translucent or empty card shows the stage through it
  const bgOf = el => {
    if (!el) return stageBg;
    const f = getComputedStyle(el).fill;
    if (!f || f === 'none') return stageBg;
    const { rgb, a } = parse(f);
    return rgb.map((v, i) => v * a + stageBg[i] * (1 - a));
  };
  const out = [];
  svg.querySelectorAll('[data-on]').forEach(el => {
    const bg = bgOf(svg.querySelector(`[data-box="${el.dataset.on}"]`));
    const r = ratio(parse(getComputedStyle(el).fill).rgb, bg);
    if (r < 4.5) out.push(`${el.textContent}: ${r.toFixed(2)}`);
  });
  return out;
}

for (const scheme of ['light', 'dark']) {
  test(`readout and verdict text keep 4.5:1 contrast (${scheme})`, { skip }, async () => {
    await withPage({ colorScheme: scheme }, async page => {
      await eachFrame(page, async (where, svgSel) => {
        assert.deepEqual(await page.evaluate(contrastScript, svgSel), [], where);
      });
    });
  });
}

test('svg text renders at 9px or more on a 360px phone', { skip }, async () => {
  await withPage({ viewport: { width: 360, height: 800 } }, async page => {
    await eachFrame(page, async (where, svgSel) => {
      const min = await page.evaluate(svgSel => {
        let m = 99;
        document.querySelectorAll(`${svgSel} text`).forEach(el => {
          if (!el.textContent.trim()) return;
          const svg = el.ownerSVGElement;
          const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
          m = Math.min(m, parseFloat(getComputedStyle(el).fontSize) * scale);
        });
        return m;
      }, svgSel);
      assert.ok(min >= 9, `${where} min ${min.toFixed(2)}px`);
    });
  });
});

test('without JavaScript the stage is replaced by a readable transcript', { skip }, async () => {
  await withPage({ javaScriptEnabled: false }, async page => {
    assert.equal(await page.locator('.stage-svg').first().isVisible(), false);
    assert.equal(await page.locator('.stage-controls').first().isVisible(), false);
    const tr = page.locator('.stage-transcript').first();
    assert.equal(await tr.isVisible(), true);
    assert.ok((await tr.textContent()).trim().length > 40);
  });
});

// ---- picks made inside a playing scene stay (ctx.pause) ----

const hasScene = (page, id) => page.locator(sceneSel(id)).count().then(n => n > 0);
const playing = (page, id) => page.locator(`${sceneSel(id)} .stage-controls .play`).getAttribute('aria-label').then(l => l === '暂停');
const svgText = (page, id) => page.locator(`${sceneSel(id)} .stage-svg text`).allTextContents();

async function startPlaying(page, id, permille) {
  const sec = sceneSel(id);
  const toStage = () => page.evaluate(sel => {
    const st = document.querySelector(sel + ' .stage');
    window.scrollTo(0, st.getBoundingClientRect().top + window.scrollY - 40);
  }, sec);
  await toStage();
  await page.waitForTimeout(300);  // scrolled into view, the scene starts by itself
  await page.locator(`${sec} .scrub`).fill(String(permille));  // pauses and seeks
  if (!(await playing(page, id))) await page.locator(`${sec} .stage-controls .play`).click();
  await toStage();  // using the controls below the stage may have scrolled it up
  await page.waitForTimeout(150);
  assert.ok(await playing(page, id), `${id} should be playing`);
}

test('where: before it plays, the first frame is the intro, not "your problem"', { skip }, async t => {
  await withPage({ reducedMotion: 'no-preference' }, async page => {
    if (!(await hasScene(page, 'where'))) return t.skip('no where scene on this page');
    const cap = await page.locator(`${sceneSel('where')} .stage-caption`).textContent();
    assert.doesNotMatch(cap, /^你的问题/);
    assert.match(await page.locator(`${sceneSel('where')} .clock`).textContent(), /^0\.0 /);
  });
});

test('where: answering while it plays shows "your problem" within 300 ms and keeps it until play or scrub', { skip }, async t => {
  await withPage({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 1200 } }, async page => {
    if (!(await hasScene(page, 'where'))) return t.skip('no where scene on this page');
    const sec = sceneSel('where');
    await startPlaying(page, 'where', 100);
    await page.locator(`${sec} button[data-option="fast"][data-value="no"]`).click();
    await page.waitForTimeout(300);
    assert.match(await page.locator(`${sec} .stage-caption`).textContent(), /^你的问题/);
    assert.equal(await playing(page, 'where'), false, 'the pick pauses the scene');
    await page.waitForTimeout(400);
    assert.match(await page.locator(`${sec} .stage-caption`).textContent(), /^你的问题/);
    await page.locator(`${sec} .scrub`).fill('0');
    assert.doesNotMatch(await page.locator(`${sec} .stage-caption`).textContent(), /^你的问题/);
  });
});

test('progress: tapping a green dot while it plays opens its card and keeps it (touch)', { skip }, async t => {
  await withPage({ reducedMotion: 'no-preference', hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }, async page => {
    if (!(await hasScene(page, 'progress'))) return t.skip('no progress scene on this page');
    const m = (await mounted(page)).find(x => x.id === 'progress');
    await startPlaying(page, 'progress', Math.ceil(1000 * (m.stops[4] + 0.3) / m.duration));  // on the 4th kept dot (#8)
    // the svg is redrawn every frame: read the dot's place in one go (the first green dot is #0, the baseline)
    const dot = await page.evaluate(sel => {
      const r = document.querySelector(sel + ' circle[data-dot="keep"]').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, sceneSel('progress'));
    await page.touchscreen.tap(dot.x, dot.y);
    await page.waitForTimeout(300);
    assert.ok((await svgText(page, 'progress')).some(s => s.includes('实验 #0')), 'card of #0 shown');
    assert.equal(await playing(page, 'progress'), false, 'the tap pauses the scene');
    await page.waitForTimeout(400);
    assert.ok((await svgText(page, 'progress')).some(s => s.includes('实验 #0')), 'card of #0 still shown');
  });
});

for (const width of [1280, 390]) {
  test(`progress: the #39 card keeps "token" whole (${width}px)`, { skip }, async t => {
    await withPage({ viewport: { width, height: 900 } }, async page => {
      if (!(await hasScene(page, 'progress'))) return t.skip('no progress scene on this page');
      const m = (await mounted(page)).find(x => x.id === 'progress');
      // stops: start, then one per kept dot (#0 #2 #6 #8 #14 #23 #28 #32 #38 #39 ...); a little past the
      // stop, since the slider has 1000 steps and rounding may land just before it
      await page.locator(`${sceneSel('progress')} .scrub`).fill(String(Math.ceil(1000 * (m.stops[10] + 0.3) / m.duration)));
      const txt = await svgText(page, 'progress');
      assert.ok(txt.some(s => s.includes('实验 #39')), txt.join(' | '));
      assert.ok(txt.some(s => /\btoken。/.test(s)) && !txt.some(s => /toke$/.test(s)), txt.join(' | '));
      // #38 already changed this line: the card says the code shown is the default
      assert.ok(txt.some(s => s.includes('#38 已改过这一行')), txt.join(' | '));
    });
  });
}
