// usage: node render.js <page.html> <outdir> stills 0.5,2.5,4.5   |   node render.js <page.html> <outdir> range <t0> <t1> <fps>
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, [page_, out, mode, ...rest] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const types = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); })
.listen(0, async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
  await p.goto(`http://localhost:${srv.address().port}/${page_}`);
  await p.waitForFunction('window.__ready', null, { timeout: 300000 });
  let times = [];
  if (mode === 'stills') times = rest[0].split(',').map(Number);
  else { const [t0, t1, fps] = rest.map(Number); for (let i = 0; t0 + i / fps < t1 - 1e-6; i++) times.push(t0 + i / fps); }
  const start = Date.now();
  for (let i = 0; i < times.length; i++) {
    const name = mode === 'stills' ? `still_${times[i].toFixed(2)}.png` : `f_${String(i).padStart(5, '0')}.png`;
    const fp = path.join(out, name);
    if (mode !== 'stills' && fs.existsSync(fp)) continue;                  // resumable
    await p.evaluate(t => window.renderAt(t), times[i]);
    await p.screenshot({ path: fp, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    if (i % 10 === 0 || mode === 'stills') console.log(`${i + 1}/${times.length}  ${((Date.now() - start) / 1000 / (i + 1)).toFixed(1)} s/frame`);
  }
  await b.close(); srv.close();
});
