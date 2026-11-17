// Film Lab — makes the contact sheet.
//
// Laid out like a real one: the roll cut into strips of six frames, printed on white paper.
// Film edges print black, with the edge markings (film name and frame numbers) printed light.
// Upright photos lie sideways in the strip, exactly as they would on a negative.

const SHEET_WIDTH = 2400;
const MARGIN = 80;
const FRAMES_PER_STRIP = 6;
const STRIP_PAD = 20; // black film edge to the left and right of the frames
const FRAME_GAP = 14; // black gap between frames
const REBATE = 36; // black film edge above and below the frames
const STRIP_SPACING = 30; // white paper between strips
const HEADER = 130;
const FOOTER = 50;
const EDGE_INK = '#e0a84a';

export async function makeContactSheet({ frames, film, developedOn }) {
  const frameW = Math.floor((SHEET_WIDTH - 2 * MARGIN - 2 * STRIP_PAD - (FRAMES_PER_STRIP - 1) * FRAME_GAP) / FRAMES_PER_STRIP);
  const frameH = Math.round((frameW * 2) / 3);
  const stripW = 2 * STRIP_PAD + FRAMES_PER_STRIP * frameW + (FRAMES_PER_STRIP - 1) * FRAME_GAP;
  const stripH = frameH + 2 * REBATE;
  const strips = Math.max(1, Math.ceil(frames.length / FRAMES_PER_STRIP));
  const height = MARGIN + HEADER + strips * stripH + (strips - 1) * STRIP_SPACING + FOOTER + MARGIN;

  const canvas = new OffscreenCanvas(SHEET_WIDTH, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  // Paper
  ctx.fillStyle = '#f6f4ef';
  ctx.fillRect(0, 0, SHEET_WIDTH, height);

  // Header
  ctx.fillStyle = '#222';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 52px system-ui, sans-serif';
  ctx.fillText(film.name, MARGIN, MARGIN + 56);
  ctx.fillStyle = '#666';
  ctx.font = '28px system-ui, sans-serif';
  const count = `${frames.length} frame${frames.length === 1 ? '' : 's'}`;
  ctx.fillText(`${count}  ·  developed ${formatDate(developedOn)}`, MARGIN, MARGIN + 100);

  const x0 = Math.round((SHEET_WIDTH - stripW) / 2);
  for (let s = 0; s < strips; s++) {
    const y0 = MARGIN + HEADER + s * (stripH + STRIP_SPACING);
    const inStrip = frames.slice(s * FRAMES_PER_STRIP, (s + 1) * FRAMES_PER_STRIP);
    // a strip is only as long as the frames on it, like a real cut negative
    const thisStripW = 2 * STRIP_PAD + inStrip.length * frameW + (inStrip.length - 1) * FRAME_GAP;

    ctx.fillStyle = '#0d0b0a';
    ctx.fillRect(x0, y0, thisStripW, stripH);

    // Edge printing: film name along the top edge
    ctx.fillStyle = EDGE_INK;
    ctx.font = '600 18px ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < inStrip.length; i += 2) {
      ctx.fillText(film.short_name, x0 + STRIP_PAD + i * (frameW + FRAME_GAP) + 12, y0 + REBATE / 2);
    }

    for (let i = 0; i < inStrip.length; i++) {
      const number = s * FRAMES_PER_STRIP + i + 1;
      const fx = x0 + STRIP_PAD + i * (frameW + FRAME_GAP);
      const fy = y0 + REBATE;
      await drawFrame(ctx, inStrip[i].thumb, fx, fy, frameW, frameH);

      // Edge printing: frame numbers along the bottom edge
      ctx.fillStyle = EDGE_INK;
      ctx.font = '600 20px ui-monospace, monospace';
      ctx.fillText(String(number), fx + frameW / 2 - 8, y0 + stripH - REBATE / 2);
      ctx.font = '16px ui-monospace, monospace';
      ctx.fillText(`▸${number}A`, fx + frameW - 34, y0 + stripH - REBATE / 2);
    }
  }

  ctx.fillStyle = '#999';
  ctx.font = '22px system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Film Lab', MARGIN, height - MARGIN + 10);

  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
}

async function drawFrame(ctx, thumbBlob, x, y, w, h) {
  const bmp = await createImageBitmap(thumbBlob);
  ctx.save();
  if (bmp.height > bmp.width) {
    // upright photo: lies sideways on the strip
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(bmp, -h / 2, -w / 2, h, w);
  } else {
    ctx.drawImage(bmp, x, y, w, h);
  }
  ctx.restore();
  bmp.close();
}

export function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
