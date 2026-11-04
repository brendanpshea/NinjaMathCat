"""Cut each generated sheet of nine icons on magenta into nine pictures.

    python tools/cut_icons.py                every saved sheet
    python tools/cut_icons.py chapters-k     just the sheets named

A sheet is a 3 x 3 grid of icons on flat magenta (see docs/prompts.md, built
from tools/icon_sheets.json). The magenta becomes see-through, with a soft
edge and the pink fringe taken out of it. The rows are found where a band
across the sheet is empty, then the columns within each row, so icons a little
off the grid still come out whole; where no gap can be found, the sheet is cut
into equal thirds. Each icon is trimmed, centred on a square and saved as
<folder>/<id>.webp at the group's size.

Then it writes the lists of what is drawn, src/treasure_art.js and
src/picture_art.js, and out/icons.html, every cut icon on a light and a dark
background to check. Needs Pillow.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SHEETS = ROOT / "tools" / "icon_sheets.json"
# For each folder of pictures: the list the game reads of which are drawn, and what they are.
ART_LISTS = {
    "assets/treasures": (ROOT / "src" / "treasure_art.js", "treasures"),
    "assets/pictures": (ROOT / "src" / "picture_art.js", "question pictures"),
}
REVIEW = ROOT / "out" / "icons.html"
SMALLEST_CELL = 300  # a cell smaller than this makes a soft icon
MARGIN = 0.06  # empty space kept around an icon, as a share of its square


def magenta_alpha(image):
    """How opaque each pixel is: 0 where it is the magenta background, 255 where it is clearly not.

    Magenta is red and blue both high and green low, so how far min(red, blue)
    stands above green says how magenta a pixel is. Pixels in between, along
    an icon's anti-aliased edge, get a partial alpha.
    """
    r, g, b = image.split()
    low_rb = ImageChops.darker(r, b)
    magentaness = ImageChops.subtract(low_rb, g)  # 0 for greys and most colours, ~255 for pure magenta
    # Fully background above HIGH, fully icon below LOW, a ramp between.
    low, high = 70, 150
    alpha = magentaness.point(lambda m: 255 if m <= low else 0 if m >= high else round(255 * (high - m) / (high - low)))
    # Dark outlines tinted by the background are still outline: keep what is dark enough.
    dark = image.convert("L").point(lambda v: 255 if v < 60 else 0)
    return ImageChops.lighter(alpha, dark)


def despill(image, alpha):
    """Take the pink fringe out of edge pixels: pull red and blue down toward green where they both stand above it."""
    r, g, b = image.split()
    low_rb = ImageChops.darker(r, b)
    spill = ImageChops.subtract(low_rb, g)
    # Only along the edge (partly see-through), and a little way in.
    edge = alpha.filter(ImageFilter.MinFilter(5)).point(lambda a: 255 - a)
    spill = ImageChops.multiply(spill, edge)
    return Image.merge("RGB", (ImageChops.subtract(r, spill), g, ImageChops.subtract(b, spill)))


def gaps(profile, count):
    """Where to cut a profile of filled pixels into `count` parts: the emptiest point near each expected cut."""
    length = len(profile)
    cuts = []
    for i in range(1, count):
        expected = length * i / count
        window = range(round(expected - length / (count * 3)), round(expected + length / (count * 3)))
        best = min(window, key=lambda x: (profile[x], abs(x - expected)))
        if profile[best] > max(profile) * 0.15:
            return None
        cuts.append(best)
    return [0] + cuts + [length]


def profile(alpha, axis):
    """How full of opaque pixels each column (axis 0) or row (axis 1) is, from 0 to 255.

    Squashing the mask to one row (or column) averages each column (or row) in Pillow itself.
    """
    mask = alpha.point(lambda a: 255 if a > 128 else 0)
    line = mask.resize((mask.width, 1) if axis == 0 else (1, mask.height), Image.Resampling.BOX)
    return list(getattr(line, "get_flattened_data", line.getdata)())  # the new name, from Pillow 12


def cells(alpha):
    """The nine cells, as (left, top, right, bottom), in reading order."""
    width, height = alpha.size
    rows = gaps(profile(alpha, 1), 3)
    if rows is None:
        print("  no clear gap between rows: cutting into equal thirds")
        rows = [round(height * i / 3) for i in range(4)]
    found = []
    for top, bottom in zip(rows, rows[1:]):
        band = alpha.crop((0, top, width, bottom))
        cols = gaps(profile(band, 0), 3)
        if cols is None:
            print(f"  no clear gap between icons in the row at {top}: cutting into equal thirds")
            cols = [round(width * i / 3) for i in range(4)]
        found += [(left, top, right, bottom) for left, right in zip(cols, cols[1:])]
    return found


def square(icon, size):
    """The icon trimmed to what it shows, centred on a see-through square, scaled to size."""
    box = icon.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if not box:
        return None
    icon = icon.crop(box)
    side = round(max(icon.size) / (1 - 2 * MARGIN))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(icon, ((side - icon.width) // 2, (side - icon.height) // 2))
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def cut(group, sheet):
    folder = ROOT / group["folder"]
    found = [p for ext in ("png", "jpg", "jpeg", "webp") if (p := folder / "sheets" / f"{sheet['id']}.{ext}").exists()]
    if not found:
        return False
    image = Image.open(found[0]).convert("RGB")
    print(f"{sheet['id']}: {found[0].name}, {image.width} x {image.height}")
    alpha = magenta_alpha(image)
    clean = despill(image, alpha)
    clean.putalpha(alpha)
    for item, box in zip(sheet["items"], cells(alpha)):
        cell = clean.crop(box)
        if min(cell.size) < SMALLEST_CELL:
            print(f"  {item['id']}: its cell is only {cell.width} x {cell.height}, so it may look soft")
        icon = square(cell, group["size"])
        if icon is None:
            print(f"  {item['id']}: nothing there")
            continue
        edge = cell.getchannel("A").point(lambda a: 255 if a > 128 else 0)
        w, h = edge.size
        touches = any(edge.crop(b).getbbox() for b in ((0, 0, w, 2), (0, h - 2, w, h), (0, 0, 2, h), (w - 2, 0, w, h)))
        out = folder / f"{item['id']}.webp"
        icon.save(out, "WEBP", quality=88, method=6)
        note = "  (touches its cell's edge: check it isn't cut off)" if touches else ""
        print(f"  {item['id']} -> {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB){note}")
    return True


def write_art_lists(groups):
    """src/treasure_art.js and src/picture_art.js: every picture drawn so far, in each folder."""
    for folder, (path, what) in ART_LISTS.items():
        drawn = sorted(
            item["id"]
            for group in groups if group["folder"] == folder
            for sheet in group["sheets"] for item in sheet["items"]
            if (ROOT / folder / f"{item['id']}.webp").exists()
        )
        body = "".join(f'  "{i}",\n' for i in drawn)
        path.write_text(
            f"// Written by tools/cut_icons.py: the {what} drawn so far, in {folder}/.\n"
            "// The rest show their emoji until they're drawn.\n\n"
            "/** @type {ReadonlySet<string>} */\n"
            f"export const DRAWN = new Set([\n{body}]);\n",
            encoding="utf-8", newline="\n",
        )
        print(f"{path.relative_to(ROOT)}: {len(drawn)} {what} drawn")


def write_review(groups):
    """out/icons.html: every cut icon, light and dark, to look over."""
    parts = []
    for group in groups:
        for sheet in group["sheets"]:
            icons = [(item, ROOT / group["folder"] / f"{item['id']}.webp") for item in sheet["items"]]
            if not any(path.exists() for _, path in icons):
                continue
            tiles = "".join(
                f'<figure><img src="../{group["folder"]}/{item["id"]}.webp" alt=""><figcaption>{item["id"]}</figcaption></figure>'
                if path.exists() else f'<figure class="missing"><figcaption>{item["id"]}</figcaption></figure>'
                for item, path in icons
            )
            parts.append(f'<h2>{sheet["id"]}</h2><div class="row light">{tiles}</div><div class="row dark">{tiles}</div>')
    REVIEW.parent.mkdir(exist_ok=True)
    REVIEW.write_text(
        "<!doctype html><meta charset=utf-8><title>Icons</title><style>"
        "body{font:14px system-ui;margin:16px;background:#eee}"
        ".row{display:flex;flex-wrap:wrap;gap:8px;padding:8px;margin-bottom:4px;border-radius:8px}"
        ".light{background:#fffaf0}.dark{background:#1e2235;color:#ddd}"
        "figure{margin:0;width:120px;text-align:center}img{width:112px;height:112px}"
        "figcaption{font-size:11px;overflow-wrap:anywhere}.missing{opacity:.4}"
        f"</style><h1>Cut icons</h1>{''.join(parts) or '<p>No sheets cut yet.</p>'}",
        encoding="utf-8",
    )
    print(f"{REVIEW.relative_to(ROOT)}: open it to check the icons")


def main():
    groups = json.loads(SHEETS.read_text(encoding="utf-8"))["groups"]
    wanted = set(sys.argv[1:])
    done = 0
    for group in groups:
        for sheet in group["sheets"]:
            if not wanted or sheet["id"] in wanted:
                done += cut(group, sheet)
    if done == 0:
        print("No sheets saved yet: see docs/prompts.md for where to save them.")
    write_art_lists(groups)
    write_review(groups)


if __name__ == "__main__":
    main()
