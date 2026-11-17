"""Make awkward test photos for the Film Lab tests (needs Python 3 + Pillow).

Usage: python3 make_fixtures.py OUTPUT_FOLDER
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)

# 1. A phone photo stored sideways with an "orientation" tag (as phones and the A590 do).
#    Pixels are 1200 wide x 900 tall, but the tag says "turn 90 degrees": it should develop upright.
h, w = 900, 1200
y, x = np.mgrid[0:h, 0:w]
img = np.zeros((h, w, 3), np.uint8)
img[..., 0] = (x / w * 255).astype(np.uint8)
img[..., 2] = (y / h * 255).astype(np.uint8)
img[: h // 6, :, :] = (250, 250, 250)  # white band along the top of the stored pixels
exif = Image.Exif()
exif[0x0112] = 6  # orientation: rotate 90 degrees clockwise to view
Image.fromarray(img).save(out / "IMG_0006.JPG", quality=92, exif=exif)

# 2. An oversized 12-megapixel photo (4000 x 3000): should be scaled to the A590's 3264 width.
h, w = 3000, 4000
y, x = np.mgrid[0:h, 0:w].astype(np.float32)
big = np.stack([120 + 80 * np.sin(x / 300), 120 + 80 * np.cos(y / 250), 120 + 60 * np.sin((x + y) / 400)], -1)
big += rng.normal(0, 6, big.shape)
Image.fromarray(np.clip(big, 0, 255).astype(np.uint8)).save(out / "IMG_0007.JPG", quality=90)

# 3. Not a photo at all: should be skipped with a message, not crash the roll.
(out / "IMG_0008.JPG").write_bytes(b"this is not a jpeg")
print("fixtures written to", out)
