// Stops and duration of each scene, from its model: node tools/reel/scene_info.mjs intro loop
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
global.ExplainTimeline = require(join(root, 'docs/assets/explain/timeline.js'));
const out = {};
for (const id of process.argv.slice(2)) {
  const M = require(join(root, `docs/assets/explain/autoresearch/${id}-model.js`));
  out[id] = { stops: M.stops(), duration: M.duration() };
}
process.stdout.write(JSON.stringify(out));
