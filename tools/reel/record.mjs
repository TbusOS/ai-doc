// Frames of the narrated reel: node tools/reel/record.mjs <frames.json> <out dir>
//
// frames.json (from build.py): { fps, end_card, frames: [{ s: scene | 'end', t, z, f: [x, y], sub }] }.
// Each scene is opened once in capture mode (?capture=<id>, the same page the GIF export uses);
// per frame: seek the scene to t, write the subtitle into the caption strip under the picture,
// scale the picture by z toward f (stage px). The caption strip sits above the picture, so the
// push-in never covers it. The end card replaces the picture of the last page with a card.
// Identical frames are copied, not shot again.
//
// The push-in must not cut a label. Per scene, the labels shown in the pushed-in frames are
// measured once at scale 1; their union box is that scene's limit: the scale is capped so the box
// still fits, and the centre is moved just enough to keep it in view. One box per scene, so the
// camera moves as smoothly as planned (a box per frame would make it jump when a label appears).
// Each frame is checked again before its screenshot; a cut label fails the run.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchOptions, useFontCache, closeFontCache } from '../net.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const [specPath, outDir] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const PW = process.env.PLAYWRIGHT || [
  join(root, 'tools/node_modules/playwright/index.mjs'),
  join(homedir(), 'claude-tools/sky-skills/node_modules/playwright/index.mjs'),
].find(existsSync);
const pw = await import(PW);
const page_url = pathToFileURL(join(root, 'docs/zh/explain/autoresearch.html')).href;

const STYLE = `
  .scene.is-capture .stage { position: relative; overflow: hidden; }
  .scene.is-capture .stage-svg, .reel-card { transform-origin: 600px 337px; will-change: transform; }
  .scene.is-capture .stage-caption { position: relative; z-index: 2; }
  .reel-card { width: 1200px; height: 675px; box-sizing: border-box; padding: 64px 72px; display: grid;
    grid-template-columns: 1fr 460px; gap: 48px; align-items: center; background: var(--card); color: var(--ink); }
  .reel-card .k { font-family: var(--font-hand); font-size: 26px; color: var(--accent-ink); margin: 0 0 14px; }
  .reel-card h2 { font-family: var(--font-hand); font-size: 44px; line-height: 1.25; margin: 0 0 28px; font-weight: 700; }
  .reel-card ul { list-style: none; padding: 0; margin: 0 0 36px; font-family: var(--font-hand); font-size: 26px; line-height: 1.7; color: var(--ink-2); }
  .reel-card li::before { content: "✓ "; color: var(--keep-ink); font-weight: 700; }
  .reel-card .u { font-family: var(--font-mono); font-size: 30px; font-weight: 600; color: var(--accent-ink);
    border: 2px solid var(--accent); border-radius: 14px; padding: 12px 20px; display: inline-block; }
  .reel-card img { width: 460px; border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 12px 36px rgba(30,26,21,.14); transform: rotate(1.5deg); }
`;

const W = 1200, H = 675, EDGE = 12;  // picture size (stage px); labels keep 12 px from the edge

// every label in document order, with its box (stage px) and whether it is fully in the picture
const LABELS = `(() => {
  const svg = document.querySelector('.scene.is-capture .stage-svg');
  const o = svg.parentNode.getBoundingClientRect();  // the stage: the picture's top left at scale 1, not scaled itself
  const shown = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05; };
  return [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && shown(t)).map(t => {
    const r = t.getBoundingClientRect();
    const b = [r.left - o.left, r.top - o.top, r.right - o.left, r.bottom - o.top];
    return { s: t.textContent.trim(), b, in: b[0] >= -0.5 && b[1] >= -0.5 && b[2] <= ${W} + 0.5 && b[3] <= ${H} + 0.5 };
  });
})()`;

// largest scale <= fr.z and nearest centre that keep box b in view
function fit(fr, b) {
  const lo = [Math.max(0, b[0] - EDGE), Math.max(0, b[1] - EDGE)], hi = [Math.min(W, b[2] + EDGE), Math.min(H, b[3] + EDGE)];
  const z = Math.floor(Math.min(fr.z, W / (hi[0] - lo[0]), H / (hi[1] - lo[1])) * 1e4) / 1e4;
  if (z <= 1) return { ...fr, z: 1 };
  const c = (f, i, size) => Math.round(Math.min(Math.max(f, (hi[i] * z - size) / (z - 1)), lo[i] * z / (z - 1)));
  return { ...fr, z, f: [c(fr.f[0], 0, W), c(fr.f[1], 1, H)] };
}

const browser = await pw.chromium.launch(launchOptions());
const pages = {};
async function pageFor(id) {
  const key = id === 'end' ? 'vocab' : id;
  if (!pages[key]) {
    const p = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    await useFontCache(p, pw);
    await p.goto(`${page_url}?capture=${key}`, { waitUntil: 'load', timeout: 180000 });
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: STYLE });
    pages[key] = p;
  }
  const p = pages[key];
  if (id === 'end' && !(await p.$('.reel-card'))) {
    const c = spec.end_card;
    const img = pathToFileURL(join(root, c.image)).href;
    await p.evaluate(({ c, img }) => {
      const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      const svg = document.querySelector('.scene.is-capture .stage-svg');
      svg.style.display = 'none';
      const d = document.createElement('div');
      d.className = 'reel-card';
      d.innerHTML = `<div><p class="k">${esc(c.kicker)}</p><h2>${esc(c.title).replace(/\n/g, '<br>')}</h2><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`
        + `<span class="u">${esc(c.url)} →</span></div><img src="${img}" alt="">`;
      svg.parentNode.insertBefore(d, svg);
    }, { c, img });
    await p.waitForFunction(() => { const i = document.querySelector('.reel-card img'); return i && i.complete; });
  }
  return p;
}

const boxes = {};
for (const id of new Set(spec.frames.filter(f => f.s !== 'end' && f.z > 1).map(f => f.s))) {
  const p = await pageFor(id);
  const ts = [...new Set(spec.frames.filter(f => f.s === id && f.z > 1).map(f => f.t))];
  const b = [W, H, 0, 0];
  for (const t of ts) {
    // labels already sticking out of the scene at scale 1 are left alone
    for (const l of (await p.evaluate(`(() => { window.__explain.seek(${t}); return ${LABELS}; })()`)).filter(l => l.in)) {
      b[0] = Math.min(b[0], l.b[0]); b[1] = Math.min(b[1], l.b[1]); b[2] = Math.max(b[2], l.b[2]); b[3] = Math.max(b[3], l.b[3]);
    }
  }
  boxes[id] = b;
  const zmax = fit({ z: 9, f: [W / 2, H / 2] }, b).z;
  console.log(`  ${id}: labels within x ${b[0].toFixed(0)}–${b[2].toFixed(0)}, y ${b[1].toFixed(0)}–${b[3].toFixed(0)} -> push-in up to ${zmax}`);
}
const plan = spec.frames.map(f => boxes[f.s] ? fit(f, boxes[f.s]) : f);
console.log(`  push-in limited on ${plan.filter((f, i) => f.z !== spec.frames[i].z || f.f.join() !== spec.frames[i].f.join()).length} of ${plan.length} frames`);

mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) rmSync(join(outDir, f));
let prevKey = null, shot = 0, copied = 0;
const cut = [];
const t0 = Date.now();
for (let i = 0; i < plan.length; i++) {
  const fr = plan[i];
  const file = join(outDir, String(i).padStart(5, '0') + '.png');
  const key = JSON.stringify(fr);
  if (key === prevKey) { copyFileSync(join(outDir, String(i - 1).padStart(5, '0') + '.png'), file); copied++; continue; }
  const p = await pageFor(fr.s);
  await p.evaluate(fr => {
    if (fr.s !== 'end') window.__explain.seek(fr.t);
    const cap = document.querySelector('.scene.is-capture .stage-caption');
    cap.textContent = fr.sub;
    const pic = fr.s === 'end' ? document.querySelector('.reel-card') : document.querySelector('.scene.is-capture .stage-svg');
    pic.style.transformOrigin = `${fr.f[0]}px ${fr.f[1]}px`;
    pic.style.transform = fr.z === 1 ? '' : `scale(${fr.z})`;
  }, fr);
  if (fr.s !== 'end' && fr.z > 1) {
    const lost = await p.evaluate(`(() => {
      const svg = document.querySelector('.scene.is-capture .stage-svg'), keep = svg.style.transform;
      svg.style.transform = ''; const before = ${LABELS};
      svg.style.transform = keep; const after = ${LABELS};
      return before.filter((l, k) => l.in && !after[k].in).map(l => l.s);
    })()`);
    if (lost.length) cut.push(`frame ${i} (${fr.s} t=${fr.t} z=${fr.z} f=${fr.f}): ${lost.join(' | ')}`);
  }
  await p.locator('.scene.is-capture .stage').screenshot({ path: file, animations: 'disabled' });
  prevKey = key; shot++;
  if (shot % 300 === 0) console.log(`  frame ${i + 1}/${plan.length} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
await browser.close();
await closeFontCache();
console.log(`frames: ${plan.length} (${shot} shot, ${copied} copied) in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${resolve(outDir)}`);
if (cut.length) {
  console.log(`FAIL  the push-in cuts labels in ${cut.length} frames:\n  ` + cut.slice(0, 20).join('\n  '));
  process.exit(1);
}
console.log('  ok    no label cut by the push-in');
