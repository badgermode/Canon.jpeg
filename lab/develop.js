// Film Lab — the developing maths.
//
// Everything in this file is "pure": it takes numbers in and gives numbers back.
// It knows nothing about the screen, files or the phone, which makes it easy to test.
//
// How a photo is developed, in order:
//   1. Undo the JPEG's brightness encoding, so we work with light as it was ("linear light").
//   2. Colour mix + white balance, folded into one 3x3 grid of numbers (a matrix).
//   3. The film's tone curves: how bright each tone comes out. This is where a film's contrast,
//      shadow and highlight character live. One master curve, plus optional extra curves for
//      the red, green and blue layers (real film layers don't respond identically).
//   4. Split toning: a colour cast in the shadows and another in the highlights.
//   5. Saturation.
//   6. Grain.

export const LAB_VERSION = '0.1.0';

// ---------------------------------------------------------------------------
// Step 1: JPEG values (0-255) to linear light (0-1). Computed once, looked up per pixel.

const SRGB_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const v = i / 255;
  SRGB_TO_LINEAR[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(x) {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------
// Step 3: tone curves.
//
// A curve is a list of points [input, output], both from 0 (black) to 1 (white), exactly like
// the curves tool in a photo editor. [[0, 0], [1, 1]] is a straight line and changes nothing.
// Between the points we draw a smooth line that never wiggles back on itself, so a curve can
// never accidentally turn bright things darker than dark things.

export function makeCurve(points) {
  const pts = (points && points.length >= 2 ? points : [[0, 0], [1, 1]])
    .map(([x, y]) => [x, y])
    .sort((a, b) => a[0] - b[0]);
  const n = pts.length;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  // Fritsch-Carlson adjustment: keeps the smooth line from overshooting between points
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return function curve(x) {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// The tone curves are stored as lookup tables, one per colour layer, indexed by the square root
// of the linear light value. The square root gives fine steps in the shadows, where the eye
// notices banding most. Each table also converts linear light back into screen values.
const CURVE_SIZE = 4096;
const CURVE_SCALE = 4095; // index = sqrt(x) * 4095, so the table covers x = 0 .. 1

export function buildCurveTables(tone = {}) {
  const master = makeCurve(tone.curve);
  const layers = [makeCurve(tone.red), makeCurve(tone.green), makeCurve(tone.blue)];
  return layers.map((layer) => {
    const table = new Float32Array(CURVE_SIZE);
    for (let i = 0; i < CURVE_SIZE; i++) {
      const s = i / CURVE_SCALE;
      table[i] = clamp(layer(master(linearToSrgb(s * s))), 0, 1);
    }
    return table;
  });
}

// ---------------------------------------------------------------------------
// Step 2: colour mix and white balance as one matrix.

function multiply3x3(a, b) {
  const out = new Array(9);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      out[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return out;
}

export function buildColourMatrix(lab) {
  const mix = (lab.colour_mix ?? [[1, 0, 0], [0, 1, 0], [0, 0, 1]]).flat();
  const warmth = lab.white_balance?.warmth ?? 0; // + = warmer (more red, less blue)
  const tint = lab.white_balance?.tint ?? 0; //     + = greener, - = more magenta
  let gr = 1 + warmth, gg = 1 + tint, gb = 1 - warmth;
  const norm = 0.2126 * gr + 0.7152 * gg + 0.0722 * gb; // keep overall brightness the same
  gr /= norm; gg /= norm; gb /= norm;
  const wb = [gr, 0, 0, 0, gg, 0, 0, 0, gb];
  return Float32Array.from(multiply3x3(wb, mix));
}

// ---------------------------------------------------------------------------
// Step 4: split toning. A tint is given as a hue on the colour wheel
// (0 = red, 60 = yellow, 120 = green, 180 = cyan, 240 = blue, 300 = magenta) and an amount.

export function hueToTint(hue, amount) {
  if (!amount) return [0, 0, 0];
  const h = (((hue % 360) + 360) % 360) / 60;
  const x = 1 - Math.abs((h % 2) - 1);
  const [r, g, b] =
    h < 1 ? [1, x, 0] : h < 2 ? [x, 1, 0] : h < 3 ? [0, 1, x] :
    h < 4 ? [0, x, 1] : h < 5 ? [x, 0, 1] : [1, 0, x];
  const mean = (r + g + b) / 3;
  const v = [r - mean, g - mean, b - mean];
  const len = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => (c / len) * amount);
}

// ---------------------------------------------------------------------------
// Step 6: grain.
//
// Grain is made from two seamless noise tiles of slightly different sizes (1024 and 1021
// pixels). Added together they don't visibly repeat across a photo. "size" softens the noise
// into larger clumps; "amount" sets how strong it is.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blurTile(src, n, k) {
  // one pass of a small soft blur [k, 1, k], wrapping around the edges so the tile stays seamless
  const tmp = new Float32Array(n * n);
  const norm = 1 / (1 + 2 * k);
  for (let y = 0; y < n; y++) {
    const row = y * n;
    for (let x = 0; x < n; x++) {
      const l = x === 0 ? n - 1 : x - 1, r = x === n - 1 ? 0 : x + 1;
      tmp[row + x] = (src[row + x] + k * (src[row + l] + src[row + r])) * norm;
    }
  }
  for (let y = 0; y < n; y++) {
    const up = (y === 0 ? n - 1 : y - 1) * n, dn = (y === n - 1 ? 0 : y + 1) * n, row = y * n;
    for (let x = 0; x < n; x++) src[row + x] = (tmp[row + x] + k * (tmp[up + x] + tmp[dn + x])) * norm;
  }
}

export function makeGrainTile(n, size, seed) {
  const rand = mulberry32(seed);
  const tile = new Float32Array(n * n);
  for (let i = 0; i < tile.length; i++) tile[i] = rand() + rand() + rand() - 1.5; // bell-shaped noise
  for (let extra = Math.max(0, size - 1); extra > 0; extra -= 1) blurTile(tile, n, Math.min(extra, 1));
  let sumSq = 0;
  for (let i = 0; i < tile.length; i++) sumSq += tile[i] * tile[i];
  const scale = 1 / Math.sqrt(sumSq / tile.length); // normalise to a standard strength of 1
  for (let i = 0; i < tile.length; i++) tile[i] *= scale;
  return tile;
}

// ---------------------------------------------------------------------------
// Putting it together.

const GRAIN_STRENGTH = 0.045; // grain "amount" 1.0 = this much variation (on a 0-1 scale)

// Turn a film recipe into everything the pixel loop needs. Done once per roll.
export function prepareRecipe(recipe) {
  const lab = recipe.lab;
  const grain = lab.grain ?? { amount: 0 };
  const prepared = {
    code: recipe.code,
    matrix: buildColourMatrix(lab),
    curves: buildCurveTables(lab.tone),
    saturation: lab.saturation ?? 1,
    monochrome: recipe.type === 'black-and-white',
    shadowTint: hueToTint(lab.shadows?.hue ?? 0, lab.shadows?.amount ?? 0),
    highlightTint: hueToTint(lab.highlights?.hue ?? 0, lab.highlights?.amount ?? 0),
    grainAmount: (grain.amount ?? 0) * GRAIN_STRENGTH,
    grainA: null,
    grainB: null,
  };
  if (prepared.grainAmount > 0) {
    prepared.grainA = makeGrainTile(1024, grain.size ?? 1, 1);
    prepared.grainB = makeGrainTile(1021, grain.size ?? 1, 2);
  }
  return prepared;
}

// Develop one photo in place. `data` is the RGBA pixel array from a canvas.
// `frameNumber` makes each frame's grain different, as on a real roll.
// Grain strength is set for a full-size A590 photo (3264 pixels across). Real grain belongs to
// the frame, not the pixel, so a smaller photo gets proportionally finer grain: it then looks
// the same as a full-size frame shrunk to that size.
export const FULL_FRAME_LONG_EDGE = 3264;

export function developPixels(data, width, height, p, frameNumber = 1) {
  const m = p.matrix, lin = SRGB_TO_LINEAR;
  const [cR, cG, cB] = p.curves;
  const sat = p.saturation, mono = p.monochrome;
  const [sr, sg, sb] = p.shadowTint, [hr, hg, hb] = p.highlightTint;
  const amp = p.grainAmount * Math.min(1, Math.max(width, height) / FULL_FRAME_LONG_EDGE);
  const gA = p.grainA, gB = p.grainB;
  const rand = mulberry32(frameNumber * 7919);
  const offA = (rand() * 1024) | 0, offB = (rand() * 1021) | 0;
  const maxIdx = CURVE_SIZE - 1;

  let i = 0;
  for (let y = 0; y < height; y++) {
    const rowA = ((y + offA) & 1023) * 1024;
    const rowB = ((y + offB) % 1021) * 1021;
    let colB = offB % 1021;
    for (let x = 0; x < width; x++, i += 4) {
      const r0 = lin[data[i]], g0 = lin[data[i + 1]], b0 = lin[data[i + 2]];

      let r = m[0] * r0 + m[1] * g0 + m[2] * b0;
      let g = m[3] * r0 + m[4] * g0 + m[5] * b0;
      let b = m[6] * r0 + m[7] * g0 + m[8] * b0;

      let ri = (Math.sqrt(r > 0 ? r : 0) * CURVE_SCALE) | 0;
      let gi = (Math.sqrt(g > 0 ? g : 0) * CURVE_SCALE) | 0;
      let bi = (Math.sqrt(b > 0 ? b : 0) * CURVE_SCALE) | 0;
      r = cR[ri > maxIdx ? maxIdx : ri];
      g = cG[gi > maxIdx ? maxIdx : gi];
      b = cB[bi > maxIdx ? maxIdx : bi];

      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (mono) {
        r = g = b = L;
      } else {
        const ws = (1 - L) * (1 - L), wh = L * L;
        r += ws * sr + wh * hr;
        g += ws * sg + wh * hg;
        b += ws * sb + wh * hb;
        r = L + (r - L) * sat;
        g = L + (g - L) * sat;
        b = L + (b - L) * sat;
      }

      if (amp > 0) {
        // strongest in the mid-tones, weaker in deep shadows and bright highlights
        const weight = 0.35 + 2.6 * L * (1 - L);
        const n = (gA[rowA + ((x + offA) & 1023)] + gB[rowB + colB]) * 0.7071 * amp * weight;
        r += n; g += n; b += n;
        if (++colB === 1021) colB = 0;
      }

      data[i] = r * 255 + 0.5; // the pixel array clamps to 0-255 by itself
      data[i + 1] = g * 255 + 0.5;
      data[i + 2] = b * 255 + 0.5;
    }
  }
}

// ---------------------------------------------------------------------------
// Framing: crop to the shape of a 35mm frame (3:2), upright or sideways.

export function frameCrop(width, height, ratio = 3 / 2) {
  const target = width >= height ? ratio : 1 / ratio;
  let w = width, h = height;
  if (width / height > target) w = Math.round(height * target);
  else h = Math.round(width / target);
  return { x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2), width: w, height: h };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
