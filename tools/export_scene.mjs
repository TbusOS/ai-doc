// Export explainer scenes as GIF / MP4 for use outside the site (README, posts).
//
//   node tools/export_scene.mjs --scenes loop,progress --out media/ [--fps 15] [--theme light|dark]
//        [--page docs/zh/explain/autoresearch.html] [--gif-width 800] [--hold 1.5] [--reel reel.mp4]
//
// Why frame-by-frame instead of screen recording: every scene is a pure function
// of time (stateAt(t)), and capture mode (?capture=<scene>) exposes
// window.__explain.seek(t). Seeking to each frame gives the same video on every
// run; a screen recording drops frames and differs run to run.
//
// Output per scene: <out>/<scene>.gif and <out>/<scene>.mp4. With --reel, the
// scenes are also joined into one MP4 (captions are burned in by capture mode).
// Needs Playwright (PLAYWRIGHT=<index.mjs>) and ffmpeg (FFMPEG=<path>, default:
// the one bundled with imageio-ffmpeg in .venv).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function args(argv) {
  const o = { page: 'docs/zh/explain/autoresearch.html', fps: 15, theme: 'light', gifWidth: 800, hold: 1.5 };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--scenes') { o.scenes = v.split(','); i++; }
    else if (k === '--out') { o.out = v; i++; }
    else if (k === '--page') { o.page = v; i++; }
    else if (k === '--fps') { o.fps = +v; i++; }
    else if (k === '--theme') { o.theme = v; i++; }
    else if (k === '--gif-width') { o.gifWidth = +v; i++; }
    else if (k === '--hold') { o.hold = +v; i++; }
    else if (k === '--reel') { o.reel = v; i++; }
    else if (k === '--no-gif') o.noGif = true;
    else throw new Error('unknown option ' + k);
  }
  if (!o.scenes || !o.out) throw new Error('need --scenes a,b and --out <dir>');
  return o;
}

function findPlaywright() {
  const c = [process.env.PLAYWRIGHT,
    join(homedir(), 'linux-kernel/github/sky-skills/node_modules/playwright/index.mjs'),
    join(homedir(), 'claude-tools/sky-skills/node_modules/playwright/index.mjs')].filter(Boolean);
  const hit = c.find(existsSync);
  if (!hit) throw new Error('Playwright not found; set PLAYWRIGHT=<path to playwright/index.mjs>');
  return hit;
}

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const py = join(root, '.venv/bin/python3');
  if (existsSync(py)) {
    try { return execFileSync(py, ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim(); }
    catch (e) { /* fall through */ }
  }
  return 'ffmpeg';
}

// Frame times from 0 to the scene's duration, then `hold` seconds on the last frame.
export function frameTimes(duration, fps, hold) {
  const n = Math.max(1, Math.round(duration * fps));
  const times = [];
  for (let i = 0; i <= n; i++) times.push(Math.min(duration, i / fps));
  const extra = Math.round(hold * fps);
  for (let i = 0; i < extra; i++) times.push(duration);
  return times;
}

async function captureScene(browser, o, scene, dir) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1,
    colorScheme: o.theme === 'dark' ? 'dark' : 'light', reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const url = pathToFileURL(resolve(root, o.page)).href + '?capture=' + encodeURIComponent(scene);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => window.__explain && window.__explain.duration);
  if (!duration) throw new Error(`${scene}: capture mode did not start (no window.__explain) ${errors.join('; ')}`);
  const stage = page.locator('.scene.is-capture .stage');
  const times = frameTimes(duration, o.fps, o.hold);
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => window.__explain.seek(t), times[i]);
    await stage.screenshot({ path: join(dir, String(i).padStart(5, '0') + '.png'), animations: 'disabled' });
  }
  await page.close();
  if (errors.length) throw new Error(`${scene}: page errors: ${errors.join('; ')}`);
  return { duration, frames: times.length };
}

function encode(ff, o, frameDir, base) {
  const input = ['-y', '-loglevel', 'error', '-framerate', String(o.fps), '-i', join(frameDir, '%05d.png')];
  // The stage is 1200x675; H.264 with yuv420p needs even sides, so drop the last pixel row.
  execFileSync(ff, [...input, '-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow',
    '-movflags', '+faststart', base + '.mp4']);
  if (!o.noGif) {
    // Two-pass palette: one palette for the whole clip, only changed rectangles re-dithered.
    execFileSync(ff, [...input, '-vf',
      `scale=${o.gifWidth}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];` +
      '[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', base + '.gif']);
  }
}

async function main() {
  const o = args(process.argv.slice(2));
  const out = resolve(o.out);
  mkdirSync(out, { recursive: true });
  const ff = findFfmpeg();
  const { chromium } = await import(findPlaywright());
  const browser = await chromium.launch();
  const work = join(tmpdir(), 'aidoc-export-' + process.pid);
  const reelDir = join(work, '_reel');
  let reelIndex = 0;
  try {
    for (const scene of o.scenes) {
      const dir = join(work, scene);
      const info = await captureScene(browser, o, scene, dir);
      encode(ff, o, dir, join(out, scene));
      console.log(`${scene}: ${info.duration.toFixed(1)}s, ${info.frames} frames -> ${scene}.mp4${o.noGif ? '' : ', ' + scene + '.gif'}`);
      if (o.reel) {
        mkdirSync(reelDir, { recursive: true });
        for (const f of readdirSync(dir).sort()) copyFileSync(join(dir, f), join(reelDir, String(reelIndex++).padStart(5, '0') + '.png'));
      }
    }
    if (o.reel) {
      encode(ff, { ...o, noGif: true }, reelDir, resolve(o.reel).replace(/\.mp4$/, ''));
      console.log(`reel: ${reelIndex} frames -> ${o.reel}`);
    }
  } finally {
    await browser.close();
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e.message || e); process.exit(1); });
}
