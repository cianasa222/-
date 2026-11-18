// usage: node render.js <page.html> <outdir> stills 0.5,2.5,4.5   |   node render.js <page.html> <outdir> range <t0> <t1> <fps>
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, [page_, out, mode, ...rest] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const types = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); })
.listen(0, async () => {
  // RENDER_BROWSER=msedge (or chrome) -> use the installed browser with the real GPU (Windows/macOS laptops);
  // default: bundled Chromium with SwiftShader software GL (cloud machines without a GPU)
  const ch = process.env.RENDER_BROWSER;
  const b = ch ? await chromium.launch({ channel: ch, args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization'] })
               : await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const VW = +(process.env.VW || 1280), VH = +(process.env.VH || 720);
  const DPR = +(process.env.DPR || 1), SUB = Math.max(1, +(process.env.SUB || 1)), SHUTTER = +(process.env.SHUTTER || .5);
  const p = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
  await p.goto(`http://localhost:${srv.address().port}/${page_}`);
  await p.waitForFunction('window.__ready', null, { timeout: 300000 });
  let times = [];
  if (mode === 'stills') times = rest[0].split(',').map(Number);
  else { const [t0, t1, fps] = rest.map(Number);   // SUB subframes per frame, spread over SHUTTER of the frame interval (motion blur)
    for (let i = 0; t0 + i / fps < t1 - 1e-6; i++) for (let k = 0; k < SUB; k++) times.push(Math.max(0, t0 + i / fps + ((k + .5) / SUB - .5) * SHUTTER / fps)); }
  const start = Date.now(), from = +(process.env.FROM || 0);
  for (let i = from; i < times.length; i++) {
    const name = mode === 'stills' ? `still_${times[i].toFixed(3)}.png` : `f_${String(i).padStart(6, '0')}.png`;
    const fp = path.join(out, name);
    if (mode !== 'stills' && fs.existsSync(fp)) continue;                  // resumable
    await p.evaluate(t => window.renderAt(t), times[i]);
    await p.screenshot({ path: fp, clip: { x: 0, y: 0, width: VW, height: VH } });
    if (i % 20 === 0 || mode === 'stills') { const el = (Date.now() - start) / 1000, done = i + 1 - from, eta = el / done * (times.length - i - 1); console.log(`${i + 1}/${times.length}  ${(el / done).toFixed(2)} s/img  剩余约 ${Math.round(eta / 60)} 分钟`); }
  }
  await b.close(); srv.close();
});
