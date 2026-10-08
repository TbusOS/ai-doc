const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const roots = [path.join(__dirname, '../../docs/assets/explain'), path.join(__dirname, '../../docs/assets/home')];
const files = [];
(function walkAll() {
  const walk = d => {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  };
  roots.forEach(walk);
})();

test('drawing code uses CSS variables, not hex colors', () => {
  assert.ok(files.length > 0);
  for (const f of files) {
    // any '#rgb' / '#rrggbb' not preceded by a word char or '&' (HTML entities like &#x2715; are fine)
    const hits = fs.readFileSync(f, 'utf8').match(/(?:^|[^&\w])#[0-9a-fA-F]{3,8}\b/gm);
    assert.equal(hits, null, `${path.basename(f)}: ${hits}`);
  }
});
