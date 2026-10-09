// Headless Chromium behind a proxy: pass the proxy on, keep the web fonts on disk.
// Used by the browser tests and by export_scene.mjs.
//
// The explainer pages load ~70 web-font files from Google Fonts and jsdelivr. Chromium does
// not read the proxy env vars, and Playwright does not pass them: where the only way out is a
// proxy, the font stylesheet hangs, the load event never fires, and goto times out. Through a
// slow proxy one page still takes up to a minute (2026-10-09: direct connection timed out
// after 15 s; through the proxy 24–55 s per page, ~55 KB/s).
//
//   launchOptions()            { proxy } for chromium.launch, from HTTPS_PROXY / NO_PROXY
//   useFontCache(target, pw)   target: a browser context or a page; pw: the Playwright module.
//                              https fonts and stylesheets come from tools/.font-cache
//                              (git-ignored) after the first download. Same files, same metrics.
//   closeFontCache()           call once at the end
//
// Downloads run in their own request context, not the page's: a font subset the page asks for
// late (a card showing a rare glyph) still lands in the cache after that page has closed.
// Only 200 responses are kept, with content-type and access-control-allow-origin (a cross-origin
// font without the latter is not used). Local addresses are never cached. To clear: delete the dir.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE = process.env.FONT_CACHE || join(dirname(fileURLToPath(import.meta.url)), '.font-cache');
const KEEP_HEADERS = ['content-type', 'access-control-allow-origin'];
const LOCAL = /^https?:\/\/(localhost|127\.|\[::1\])/;
const cacheable = (url, type) => url.startsWith('https://') && !LOCAL.test(url) && (type === 'font' || type === 'stylesheet');
const fileOf = url => join(CACHE, createHash('sha1').update(url).digest('hex'));

export function launchOptions(env = process.env) {
  const server = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;
  return server ? { proxy: { server, bypass: env.NO_PROXY || env.no_proxy || '' } } : {};
}

let api = null;
const downloads = new Map();

function download(pw, url, headers) {
  if (!downloads.has(url)) downloads.set(url, (async () => {
    const { proxy } = launchOptions();
    api = api || pw.request.newContext(proxy ? { proxy } : {});
    const res = await (await api).fetch(url, { headers, timeout: 180000 });
    const body = await res.body();
    const keep = Object.fromEntries(KEEP_HEADERS.filter(k => res.headers()[k]).map(k => [k, res.headers()[k]]));
    if (res.status() === 200) {
      const f = fileOf(url);
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(f + '.tmp', body); renameSync(f + '.tmp', f);
      writeFileSync(f + '.json', JSON.stringify(keep));  // written last: marks the entry complete
    }
    return { status: res.status(), headers: keep, body };
  })().catch(e => { downloads.delete(url); throw e; }));  // a failed download is tried again next time
  return downloads.get(url);
}

export async function useFontCache(target, pw) {
  await target.route(() => true, async route => {
    const req = route.request(), url = req.url();
    if (!cacheable(url, req.resourceType())) return route.fallback();
    const f = fileOf(url);
    let r;
    if (existsSync(f + '.json')) r = { status: 200, headers: JSON.parse(readFileSync(f + '.json', 'utf8')), body: readFileSync(f) };
    else {
      const ua = req.headers()['user-agent'];  // Google Fonts picks the font format by user agent
      try { r = await download(pw, url, ua ? { 'user-agent': ua } : {}); }
      catch { return route.abort().catch(() => {}); }
    }
    await route.fulfill(r).catch(() => {});  // the page may have closed meanwhile
  });
}

export async function closeFontCache() {
  if (api) await (await api).dispose();
  api = null;
}
