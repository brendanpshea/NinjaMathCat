"""Cut each generated sheet of four stacked backgrounds into backdrops.

    python tools/cut_backdrops.py          every sheet in assets/backdrops/sheets/
    python tools/cut_backdrops.py a        just sheet a

A sheet is four panels stacked top to bottom with thin white lines between
them (see assets/backdrops/prompts.md). The lines are found by looking for rows
that are pale and even all the way across; where they can't be found, the sheet
is cut into equal quarters. Each panel loses any white border, is cropped to the
stage's 2.4:1 shape (from the top, so the ground along the bottom stays), scaled
to 1920 x 800 and saved as assets/backdrops/<id>.webp. Needs Pillow.
"""

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / "assets" / "backdrops"
SIZE = (1920, 800)  # the stage's shape, 2.4:1
SMALLEST = 1600  # a panel narrower than this gets blurry when scaled up


def is_gutter(gray, y):
    """Whether row y of a greyscale image is a pale, even line."""
    values = [gray.getpixel((x, y)) for x in range(0, gray.width, max(1, gray.width // 200))]
    mean = sum(values) / len(values)
    spread = sum((v - mean) ** 2 for v in values) / len(values)
    return mean > 232 and spread < 80


def gutter_runs(gray):
    """Runs of gutter rows, as (first, last) pairs."""
    runs, start = [], None
    for y in range(gray.height):
        if is_gutter(gray, y):
            start = y if start is None else start
        elif start is not None:
            runs.append((start, y - 1))
            start = None
    if start is not None:
        runs.append((start, gray.height - 1))
    return runs


def panel_bounds(image, count):
    """Top and bottom rows of each panel: between the gutters nearest each cut, or equal slices."""
    gray = image.convert("L")
    runs = gutter_runs(gray)
    height = image.height
    cuts = []
    for i in range(1, count):
        expected = height * i / count
        near = [r for r in runs if abs((r[0] + r[1]) / 2 - expected) < height / (count * 4)]
        if not near:
            print(f"  no line found near row {expected:.0f}: cutting into equal slices")
            return [(round(height * i / count), round(height * (i + 1) / count)) for i in range(count)]
        cuts.append(min(near, key=lambda r: abs((r[0] + r[1]) / 2 - expected)))
    tops = [0] + [last + 1 for _, last in cuts]
    bottoms = [first for first, _ in cuts] + [height]
    return list(zip(tops, bottoms))


def trim(panel):
    """The panel without any pale, even border rows or columns."""
    gray = panel.convert("L")
    top, bottom = 0, gray.height
    while top < bottom - 1 and is_gutter(gray, top):
        top += 1
    while bottom - 1 > top and is_gutter(gray, bottom - 1):
        bottom -= 1
    turned = gray.transpose(Image.Transpose.ROTATE_90)
    # Columns of the panel are rows of the turned image, in reverse order.
    right, left = 0, turned.height
    while right < left - 1 and is_gutter(turned, right):
        right += 1
    while left - 1 > right and is_gutter(turned, left - 1):
        left -= 1
    return panel.crop((gray.width - left, top, gray.width - right, bottom))


def fit(panel):
    """Cropped to the stage's shape, keeping the bottom, and scaled to SIZE."""
    width, height = panel.size
    shape = SIZE[0] / SIZE[1]
    if width / height < shape:
        keep = round(width / shape)
        panel = panel.crop((0, height - keep, width, height))
    else:
        keep = round(height * shape)
        panel = panel.crop(((width - keep) // 2, 0, (width - keep) // 2 + keep, height))
    return panel.resize(SIZE, Image.Resampling.LANCZOS)


def cut(sheet_id, scenes):
    found = [p for ext in ("png", "jpg", "jpeg", "webp") if (p := FOLDER / "sheets" / f"{sheet_id}.{ext}").exists()]
    if not found:
        print(f"sheet {sheet_id}: not saved yet")
        return
    image = Image.open(found[0]).convert("RGB")
    print(f"sheet {sheet_id}: {found[0].name}, {image.width} x {image.height}")
    for scene, (top, bottom) in zip(scenes, panel_bounds(image, len(scenes))):
        panel = trim(image.crop((0, top, image.width, bottom)))
        if panel.width < SMALLEST:
            print(f"  {scene['id']}: only {panel.width} wide, so it will look soft. Ask Gemini for a bigger picture.")
        out = FOLDER / f"{scene['id']}.webp"
        fit(panel).save(out, "WEBP", quality=82, method=6)
        print(f"  {scene['id']}: {panel.width} x {panel.height} -> {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


def main():
    sheets = json.loads((FOLDER / "scenes.json").read_text(encoding="utf-8"))["sheets"]
    wanted = set(sys.argv[1:])
    for sheet in sheets:
        if not wanted or sheet["id"] in wanted:
            cut(sheet["id"], sheet["scenes"])


if __name__ == "__main__":
    main()
