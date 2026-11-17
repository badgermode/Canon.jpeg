// Film Lab — the screens and buttons.
//
// The heavy work (developing photos) happens in worker.js. This file handles choosing a film
// and photos, showing progress, and showing and saving the developed roll.

import { LAB_VERSION } from './develop.js';
import { makeContactSheet, formatDate } from './contact-sheet.js';
import { makeZip } from './zip.js';

const MAX_FRAMES = 72; // a half-frame 36-exposure roll

const $ = (id) => document.getElementById(id);
const screens = { load: $('load'), developing: $('developing'), results: $('results') };

const state = {
  films: [],
  film: null,
  files: [],
  roll: null, // { name, film, developedOn, frames: [{ file, blob, thumb, url, thumbUrl }], sheet, sheetUrl }
};

// ---------------------------------------------------------------------------
// Talking to the darkroom (worker)

const worker = new Worker('worker.js', { type: 'module' });
const pending = new Map();
let nextId = 1;
worker.onmessage = (e) => {
  const job = pending.get(e.data.id);
  pending.delete(e.data.id);
  e.data.ok ? job.resolve(e.data) : job.reject(new Error(e.data.error));
};
function darkroom(message) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, ...message });
  });
}

// ---------------------------------------------------------------------------
// Start-up

async function start() {
  $('version').textContent = `Film Lab ${LAB_VERSION}`;
  try {
    const index = await fetchJson('../films/index.json');
    state.films = await Promise.all(index.films.map((f) => fetchJson(`../films/${f}.json`)));
  } catch (err) {
    $('film-list').textContent = 'Could not load the film list. Check your connection and reload.';
    return;
  }
  state.film = state.films[0];
  renderFilms();
  registerOffline();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------
// 1. Load

function renderFilms() {
  const list = $('film-list');
  list.replaceChildren();
  for (const film of state.films) {
    const b = document.createElement('button');
    b.className = 'film';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(film === state.film));
    b.innerHTML = '<div class="canister"></div><div><strong></strong><span></span></div>';
    b.querySelector('strong').textContent = film.name;
    b.querySelector('span').textContent = film.description;
    b.onclick = () => { state.film = film; renderFilms(); };
    list.append(b);
  }
}

$('file-input').addEventListener('change', (e) => {
  const files = [...e.target.files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  state.files = files;
  const n = files.length;
  $('file-label').textContent = n ? `${n} photo${n === 1 ? '' : 's'} chosen — change` : 'Choose photos';
  if (n > MAX_FRAMES) {
    $('file-note').textContent = `That's ${n} photos. A roll can hold at most ${MAX_FRAMES}; please choose fewer.`;
  } else if (n) {
    $('file-note').textContent = `${files[0].name} … ${files[n - 1].name}`;
  }
  $('develop-button').disabled = n === 0 || n > MAX_FRAMES;
});

$('develop-button').addEventListener('click', developRoll);

// ---------------------------------------------------------------------------
// 2. Developing

async function developRoll() {
  const film = state.film;
  const files = state.files;
  clearRoll();
  show('developing');
  const wakeLock = await keepScreenOn();

  const frames = [];
  const skipped = [];
  const started = performance.now();
  for (let i = 0; i < files.length; i++) {
    setProgress(i, files.length);
    try {
      const r = await darkroom({ file: files[i], recipe: film, frameNumber: frames.length + 1, mode: 'film' });
      frames.push({ file: files[i], blob: r.blob, thumb: r.thumb, url: URL.createObjectURL(r.blob), thumbUrl: URL.createObjectURL(r.thumb) });
    } catch (err) {
      console.warn('Could not develop', files[i].name, err);
      skipped.push(files[i].name);
    }
  }
  setProgress(files.length, files.length, 'Printing the contact sheet…');

  const developedOn = new Date();
  const name = `${isoDate(developedOn)} ${film.name}`;
  const sheet = frames.length ? await makeContactSheet({ frames, film, developedOn }) : null;
  state.roll = { name, film, developedOn, frames, sheet, sheetUrl: sheet && URL.createObjectURL(sheet), skipped,
    seconds: Math.round((performance.now() - started) / 1000) };

  if (wakeLock) wakeLock.release().catch(() => {});
  renderResults();
}

function setProgress(done, total, text) {
  $('progress-text').textContent = text ?? `Developing frame ${done + 1} of ${total}`;
  $('progress-bar').style.width = `${Math.round((done / total) * 100)}%`;
}

async function keepScreenOn() {
  try { return await navigator.wakeLock?.request('screen'); } catch { return null; }
}

// ---------------------------------------------------------------------------
// 3. The developed roll

function renderResults() {
  const roll = state.roll;
  show('results');
  $('roll-title').textContent = roll.name;
  const notes = [`${roll.frames.length} frames developed in ${roll.seconds} s.`];
  if (roll.skipped.length) notes.push(`Couldn't read ${roll.skipped.join(', ')} — left out.`);
  $('roll-note').textContent = notes.join(' ');

  $('contact-sheet').hidden = !roll.sheet;
  if (roll.sheet) $('contact-sheet').src = roll.sheetUrl;
  $('save-zip').disabled = $('save-sheet').disabled = !roll.frames.length;

  const grid = $('frames');
  grid.replaceChildren();
  roll.frames.forEach((frame, i) => {
    const b = document.createElement('button');
    b.innerHTML = '<img alt=""><span class="num"></span>';
    b.querySelector('img').src = frame.thumbUrl;
    b.querySelector('.num').textContent = i + 1;
    b.onclick = () => openViewer(i);
    grid.append(b);
  });
}

$('contact-sheet').addEventListener('click', () => window.open(state.roll.sheetUrl, '_blank'));

$('save-sheet').addEventListener('click', () => {
  download(state.roll.sheet, `${state.roll.name} - contact sheet.jpg`);
});

$('save-zip').addEventListener('click', async () => {
  const roll = state.roll;
  const button = $('save-zip');
  button.disabled = true;
  button.textContent = 'Packing…';
  try {
    const folder = roll.name;
    const entries = roll.frames.map((f, i) => ({ name: `${folder}/${pad(i + 1)}.jpg`, blob: f.blob }));
    entries.push({ name: `${folder}/contact-sheet.jpg`, blob: roll.sheet });
    entries.push({ name: `${folder}/roll-info.txt`, blob: new Blob([rollInfo(roll)], { type: 'text/plain' }) });
    download(await makeZip(entries, roll.developedOn), `${roll.name}.zip`);
  } finally {
    button.disabled = false;
    button.textContent = 'Save roll (ZIP)';
  }
});

function rollInfo(roll) {
  const lines = [
    `Film:       ${roll.film.name} (${roll.film.code})`,
    `Frames:     ${roll.frames.length}`,
    `Developed:  ${formatDate(roll.developedOn)}`,
    `Film Lab:   ${LAB_VERSION}`,
    '',
    'Frame  Original file',
    ...roll.frames.map((f, i) => `${pad(i + 1)}     ${f.file.name}`),
  ];
  if (roll.skipped.length) lines.push('', `Could not be read: ${roll.skipped.join(', ')}`);
  return lines.join('\r\n') + '\r\n';
}

$('new-roll').addEventListener('click', () => {
  clearRoll();
  state.files = [];
  $('file-input').value = '';
  $('file-label').textContent = 'Choose photos';
  $('file-note').textContent = "Pick the photos from one roll. They're developed in name order.";
  $('develop-button').disabled = true;
  show('load');
});

function clearRoll() {
  const roll = state.roll;
  if (!roll) return;
  for (const f of roll.frames) { URL.revokeObjectURL(f.url); URL.revokeObjectURL(f.thumbUrl); if (f.originalUrl) URL.revokeObjectURL(f.originalUrl); }
  if (roll.sheetUrl) URL.revokeObjectURL(roll.sheetUrl);
  state.roll = null;
}

// ---------------------------------------------------------------------------
// Viewer

let viewing = 0;

function openViewer(i) {
  viewing = i;
  $('viewer').hidden = false;
  showFrame();
}

function showFrame() {
  const frames = state.roll.frames;
  $('viewer-image').src = frames[viewing].url;
  $('viewer-count').textContent = `Frame ${viewing + 1} of ${frames.length}`;
  $('viewer-prev').disabled = viewing === 0;
  $('viewer-next').disabled = viewing === frames.length - 1;
}

$('viewer-close').addEventListener('click', () => { $('viewer').hidden = true; });
$('viewer-prev').addEventListener('click', () => { if (viewing > 0) { viewing--; showFrame(); } });
$('viewer-next').addEventListener('click', () => { if (viewing < state.roll.frames.length - 1) { viewing++; showFrame(); } });
$('viewer-save').addEventListener('click', () => {
  download(state.roll.frames[viewing].blob, `${state.roll.name} - ${pad(viewing + 1)}.jpg`);
});

// "Hold to see original": the same crop, without the film look, for as long as you hold.
const compare = $('viewer-compare');
let holding = false;
compare.addEventListener('pointerdown', async (e) => {
  e.preventDefault();
  holding = true;
  const frame = state.roll.frames[viewing];
  if (!frame.originalUrl) {
    compare.textContent = 'Loading…';
    const r = await darkroom({ file: frame.file, mode: 'original' });
    frame.originalUrl = URL.createObjectURL(r.blob);
    compare.textContent = 'Hold to see original';
  }
  if (holding) $('viewer-image').src = frame.originalUrl;
});
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
  compare.addEventListener(ev, () => { holding = false; showFrame(); });
}
compare.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------------------------------------------------------------------
// Helpers

function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}

function pad(n) { return String(n).padStart(2, '0'); }

function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function registerOffline() {
  const status = $('offline-status');
  if (!('serviceWorker' in navigator)) { status.textContent = 'online only'; return; }
  navigator.serviceWorker.register('sw.js').then(
    () => navigator.serviceWorker.ready.then(() => { status.textContent = 'works offline'; }),
    () => { status.textContent = 'online only'; },
  );
}

start();
