// Film Lab end-to-end test, in an emulated Android phone (Pixel 7) running Chrome.
//
// Usage: node e2e.mjs PHOTO_FOLDER OUTPUT_FOLDER
//
// Serves the repository the way GitHub Pages does (under /Canon.jpeg/), develops every photo in
// PHOTO_FOLDER as one roll, saves the ZIP and screenshots to OUTPUT_FOLDER, checks the results,
// then checks the Lab still opens with the phone offline.
// Needs Node.js and Playwright (with Chromium). The ZIP check uses Python 3 + Pillow.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [photoDir, outDir] = process.argv.slice(2).map((p) => path.resolve(p));
fs.mkdirSync(outDir, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.md': 'text/plain' };
const PREFIX = '/Canon.jpeg/';
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(PREFIX)) { res.writeHead(404).end(); return; }
  let file = path.join(repo, url.slice(PREFIX.length));
  if (!file.startsWith(repo)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://localhost:${server.address().port}${PREFIX}`;

const failures = [];
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) failures.push(what); };

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 7'], acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

// Front page redirects to the Lab
await page.goto(base);
await page.waitForURL(/\/lab\/$/);
await page.waitForSelector('.film[aria-checked="true"]');
check(true, 'front page opens the Lab, and the film list loads');
await page.screenshot({ path: path.join(outDir, '1-load.png') });

// Choose photos and develop
const photos = fs.readdirSync(photoDir).filter((f) => /\.jpe?g$/i.test(f)).map((f) => path.join(photoDir, f));
await page.setInputFiles('#file-input', photos);
check(await page.isEnabled('#develop-button'), `${photos.length} photos chosen, Develop button enabled`);
await page.click('#develop-button');
await page.waitForSelector('#developing:not([hidden])');
await page.screenshot({ path: path.join(outDir, '2-developing.png') });
await page.waitForSelector('#results:not([hidden])', { timeout: 300_000 });
await page.waitForFunction(() => document.getElementById('contact-sheet').complete);
console.log('      ', await page.textContent('#roll-note'));
await page.screenshot({ path: path.join(outDir, '3-results.png'), fullPage: true });

// Viewer and "hold to see original"
await page.click('#frames button >> nth=0');
await page.waitForSelector('#viewer:not([hidden])');
await page.waitForFunction(() => document.getElementById('viewer-image').complete);
await page.screenshot({ path: path.join(outDir, '4-viewer.png') });
const developedSrc = await page.getAttribute('#viewer-image', 'src');
await page.locator('#viewer-compare').dispatchEvent('pointerdown');
await page.waitForFunction((s) => document.getElementById('viewer-image').src !== s, developedSrc);
await page.locator('#viewer-compare').dispatchEvent('pointerup');
check((await page.getAttribute('#viewer-image', 'src')) === developedSrc, 'hold-to-compare shows the original, then returns');
await page.click('#viewer-close');

// Save the roll as a ZIP
const [zipDownload] = await Promise.all([page.waitForEvent('download'), page.click('#save-zip')]);
const zipPath = path.join(outDir, zipDownload.suggestedFilename());
await zipDownload.saveAs(zipPath);
const [sheetDownload] = await Promise.all([page.waitForEvent('download'), page.click('#save-sheet')]);
await sheetDownload.saveAs(path.join(outDir, 'contact-sheet.jpg'));

const report = JSON.parse(execFileSync('python3', ['-I', '-c', `
import json, sys, zipfile, io
from PIL import Image
z = zipfile.ZipFile(sys.argv[1])
bad = z.testzip()
out = {"bad": bad, "files": []}
for n in z.namelist():
    entry = {"name": n, "size": z.getinfo(n).file_size}
    if n.endswith(".jpg"):
        entry["dims"] = Image.open(io.BytesIO(z.read(n))).size
    out["files"].append(entry)
info = [n for n in z.namelist() if n.endswith("roll-info.txt")]
out["info"] = z.read(info[0]).decode() if info else ""
print(json.dumps(out))
`, zipPath]));

const frames = report.files.filter((f) => /\/\d\d\.jpg$/.test(f.name));
check(report.bad === null, 'ZIP is valid (every file passes its checksum)');
check(frames.length === photos.length - 1, `ZIP holds ${frames.length} developed frames (one unreadable file left out)`);
check(report.files.some((f) => f.name.endsWith('/contact-sheet.jpg')), 'ZIP holds the contact sheet');
check(report.info.includes('IMG_0008.JPG'), 'roll-info.txt notes the unreadable file');
const is32 = (d) => Math.abs(Math.max(...d) / Math.min(...d) - 1.5) < 0.01;
check(frames.every((f) => is32(f.dims)), 'every frame is cropped to 3:2');
check(frames.every((f) => Math.max(...f.dims) <= 3264), 'no frame is larger than the A590 (3264 px)');
const sideways = frames[5];
check(sideways && sideways.dims[1] > sideways.dims[0], `sideways-stored photo developed upright (${sideways?.dims.join('x')})`);
check(frames[6] && Math.max(...frames[6].dims) === 3264, `12 MP photo scaled to A590 size (${frames[6]?.dims.join('x')})`);
for (const f of report.files) console.log(`       ${f.name}  ${(f.size / 1024).toFixed(0)} KB  ${f.dims ? f.dims.join('x') : ''}`);

// Offline: reload with the network off
await page.waitForFunction(() => document.getElementById('offline-status').textContent === 'works offline', null, { timeout: 15_000 });
await context.setOffline(true);
await page.reload();
await page.waitForSelector('.film[aria-checked="true"]', { timeout: 10_000 });
check(true, 'the Lab reopens and loads its film list with the phone offline');
await context.setOffline(false);

check(errors.length === 0, `no errors in the browser console${errors.length ? ': ' + errors.join(' | ') : ''}`);

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} check(s) FAILED` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
