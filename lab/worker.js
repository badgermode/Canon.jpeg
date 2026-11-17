// Film Lab — the darkroom.
//
// Runs in the background (a "Web Worker") so the screen stays responsive while photos develop.
// It receives one photo at a time, develops it, and sends back the finished JPEG plus a small
// thumbnail for the contact sheet. Only one full-size photo is in memory at a time.

import { prepareRecipe, developPixels, frameCrop, FULL_FRAME_LONG_EDGE } from './develop.js';

// The A590's photos are 3264 pixels wide. Larger photos (e.g. from a phone) are scaled down to
// that size: it matches the camera and keeps the phone's memory use safe.
const MAX_LONG_EDGE = FULL_FRAME_LONG_EDGE;
const THUMB_LONG_EDGE = 600;
const JPEG_QUALITY = 0.92;

let prepared = null;

self.onmessage = async (event) => {
  const { id, file, recipe, frameNumber, mode } = event.data;
  try {
    if (mode === 'film' && (!prepared || prepared.code !== recipe.code)) prepared = prepareRecipe(recipe);
    const result = await developOne(file, mode, frameNumber);
    self.postMessage({ id, ok: true, ...result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message ? err.message : err) });
  }
};

async function developOne(file, mode, frameNumber) {
  // Decode the JPEG, turning it upright if the camera recorded it sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const crop = frameCrop(bitmap.width, bitmap.height);
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(crop.width, crop.height));
  const width = Math.round(crop.width * scale), height = Math.round(crop.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  bitmap.close();

  if (mode === 'film') {
    const image = ctx.getImageData(0, 0, width, height);
    developPixels(image.data, width, height, prepared, frameNumber);
    ctx.putImageData(image, 0, 0);
  }

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  if (mode !== 'film') return { blob, width, height };

  const t = THUMB_LONG_EDGE / Math.max(width, height);
  const thumbCanvas = new OffscreenCanvas(Math.round(width * t), Math.round(height * t));
  const tctx = thumbCanvas.getContext('2d');
  tctx.imageSmoothingQuality = 'high';
  tctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumb = await thumbCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
  return { blob, thumb, width, height };
}
