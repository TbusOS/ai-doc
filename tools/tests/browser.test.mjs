// Browser checks for the explainer page — things unit tests cannot see.
//   node --test tools/tests/browser.test.mjs
// Needs Playwright; borrowed from sky-skills (PLAYWRIGHT=<path to index.mjs> to override).
// Pages are opened over file://, the same way check_objective.mjs opens them.
import test from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(here, '../../docs/zh/explain/autoresearch.html')).href;
const PW = process.env.PLAYWRIGHT || join(homedir(), 'linux-kernel/github/sky-skills/node_modules/playwright/index.mjs');
const skip = existsSync(PW) ? false : `playwright not found at ${PW}`;
const { chromium } = skip ? {} : await import(PW);

async function withPage(opts, fn) {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...opts });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(opts.url || PAGE, { waitUntil: 'load' });
    await fn(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}

const clock = page => page.locator('.stage-controls .clock').first().textContent();
const caption = page => page.locator('.stage-caption').first().textContent();

test('scrub bar moves the animation', { skip }, async () => {
  await withPage({}, async page => {
    assert.match(await clock(page), /^27\.8 \//);           // reduced motion starts on the last frame
    await page.locator('.scrub').first().fill('400');
    assert.match(await clock(page), /^11\.1 \//);
  });
});

test('arrow keys step to the next station and change the caption', { skip }, async () => {
  await withPage({}, async page => {
    await page.locator('.scrub').first().fill('0');
    const before = await caption(page);
    await page.locator('.stage').first().focus();
    await page.keyboard.press('ArrowRight');
    assert.match(await clock(page), /^1\.0 \//);
    assert.notEqual(await caption(page), before);
  });
});

// sample every station stop plus its midpoint
async function eachFrame(page, fn) {
  const stops = await page.evaluate(() => window.LoopModel.stops());
  for (let i = 0; i < stops.length; i++) {
    for (const t of [stops[i], stops[i] + 0.5]) {
      await page.locator('.scrub').first().fill(String(Math.min(1000, Math.round((t / stops[stops.length - 1]) * 1000))));
      await fn(t);
    }
  }
}

for (const width of [1280, 390]) {
  test(`text stays inside its card (${width}px)`, { skip }, async () => {
    await withPage({ viewport: { width, height: 900 } }, async page => {
      await eachFrame(page, async t => {
        const bad = await page.evaluate(() => {
          const out = [];
          document.querySelectorAll('.stage-svg [data-fit]').forEach(el => {
            const box = document.querySelector(`.stage-svg [data-box="${el.dataset.fit}"]`);
            const b = el.getBBox(), c = box.getBBox();
            if (b.x < c.x - 0.5 || b.x + b.width > c.x + c.width + 0.5) out.push(`${el.textContent} (${(b.x + b.width).toFixed(0)} > ${(c.x + c.width).toFixed(0)})`);
          });
          return out;
        });
        assert.deepEqual(bad, [], `t=${t.toFixed(2)}`);
      });
    });
  });
}

function contrastScript() {
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
  document.querySelectorAll('.stage-svg [data-on]').forEach(el => {
    const bg = bgOf(document.querySelector(`.stage-svg [data-box="${el.dataset.on}"]`));
    const r = ratio(parse(getComputedStyle(el).fill).rgb, bg);
    if (r < 4.5) out.push(`${el.textContent}: ${r.toFixed(2)}`);
  });
  return out;
}

for (const scheme of ['light', 'dark']) {
  test(`readout and verdict text keep 4.5:1 contrast (${scheme})`, { skip }, async () => {
    await withPage({ colorScheme: scheme }, async page => {
      await eachFrame(page, async t => {
        assert.deepEqual(await page.evaluate(contrastScript), [], `t=${t.toFixed(2)}`);
      });
    });
  });
}

test('svg text renders at 9px or more on a 360px phone', { skip }, async () => {
  await withPage({ viewport: { width: 360, height: 800 } }, async page => {
    await eachFrame(page, async t => {
      const min = await page.evaluate(() => {
        let m = 99;
        document.querySelectorAll('.stage-svg text').forEach(el => {
          if (!el.textContent.trim()) return;
          const svg = el.ownerSVGElement;
          const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
          m = Math.min(m, parseFloat(getComputedStyle(el).fontSize) * scale);
        });
        return m;
      });
      assert.ok(min >= 9, `t=${t.toFixed(2)} min ${min.toFixed(2)}px`);
    });
  });
});

test('without JavaScript the stage is replaced by a readable transcript', { skip }, async () => {
  await withPage({ javaScriptEnabled: false }, async page => {
    assert.equal(await page.locator('.stage-svg').first().isVisible(), false);
    assert.equal(await page.locator('.stage-controls').first().isVisible(), false);
    const tr = page.locator('.stage-transcript').first();
    assert.equal(await tr.isVisible(), true);
    assert.match(await tr.textContent(), /results\.tsv/);
  });
});
