"""Crop and export the site photos from photo-sources/*.jpg into public/photos/*.webp.
Each entry: output name, source id, crop box as fractions (x0, y0, x1, y1), output widths."""
from PIL import Image, ImageOps
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'photos')
os.makedirs(OUT, exist_ok=True)

SQ = [1000, 560]
JOBS = [
    # hero trays (square)
    ('tray-brisket', 'F3', (0.235, 0.0, 0.985, 1.0), SQ),
    ('tray-beef-platter', 'F22', (0.14, 0.0, 0.89, 1.0), SQ),
    ('tray-mixed-platter', 'F10', (0.125, 0.0, 0.875, 1.0), SQ),
    ('tray-alfaham', 'F26', (0.10, 0.0, 0.85, 1.0), SQ),
    ('tray-momos', 'F30', (0.0, 0.14, 1.0, 0.89), SQ),
    ('tray-burger', 'F5', (0.19, 0.14, 0.835, 1.0), SQ),
    # place (square)
    ('place-pergola-dusk', 'V20', (0.0, 0.14, 1.0, 0.893), [900]),
    ('place-room', 'V21', (0.2, 0.0, 0.95, 1.0), [900]),
    ('place-yard-night', 'V5', (0.12, 0.0, 0.87, 1.0), [900]),
    # 4:5
    ('pulled-beef-tray', 'F44', (0.06, 0.30, 0.81, 1.0), [900]),
    # gallery 5:6
    ('g-brisket-tray', 'F3', (0.30, 0.0, 0.925, 1.0), [700]),
    ('g-pergola-day', 'V31', (0.0, 0.0, 0.625, 1.0), [700]),
    ('g-burger', 'F5', (0.16, 0.0, 0.785, 1.0), [700]),
    ('g-mojitos', 'F43', (0.0, 0.38, 1.0, 1.0), [700]),
    ('g-yard-tree', 'V9', (0.36, 0.0, 0.985, 1.0), [700]),
    ('g-cheese-chicken', 'F53', (0.0, 0.25, 1.0, 0.925), [700]),
    ('g-room-windows', 'V18', (0.0, 0.0, 0.625, 1.0), [700]),
    ('g-alfaham-rice', 'F41', (0.0, 0.07, 1.0, 0.97), [700]),
    ('g-mixed-platter', 'F10', (0.36, 0.0, 0.985, 1.0), [700]),
    # social card 1200x630
    ('og', 'F3', (0.0, 0.14, 1.0, 0.84), [1200]),
]

for name, src, (x0, y0, x1, y1), widths in JOBS:
    im = ImageOps.exif_transpose(Image.open(os.path.join(HERE, f'{src}.jpg'))).convert('RGB')
    w, h = im.size
    crop = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
    for width in widths:
        out = crop.resize((width, round(crop.height * width / crop.width)), Image.LANCZOS)
        suffix = f'-{width}' if len(widths) > 1 else ''
        ext = 'jpg' if name == 'og' else 'webp'
        path = os.path.join(OUT, f'{name}{suffix}.{ext}')
        out.save(path, quality=78 if ext == 'webp' else 82, method=6) if ext == 'webp' else out.save(path, quality=82)
        print(f'{name}{suffix}.{ext}', out.size, os.path.getsize(path) // 1024, 'KB')
