"""The app's icons, for installing it (manifest.webmanifest) and for the tab:
Ninja Cat, the first hero, standing on the game's sky over an orange sun.

    python tools/make_icons.py

Writes assets/icons/: icon-192.png and icon-512.png (rounded, for anywhere),
maskable-512.png (full-bleed, the cat inside the middle 80% that Android
keeps whatever shape it cuts), and apple-touch-icon.png (180, full-bleed;
iOS rounds the corners itself). Needs Pillow.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "icons"
SKY, SKY_LOW, SUN = (0xDF, 0xEA, 0xFF), (0xFF, 0xF3, 0xDF), (0xE8, 0x62, 0x0F)


def hero():
    """Ninja Cat's standing pose: the first of the three in the strip, trimmed."""
    strip = Image.open(ROOT / "assets" / "sprites" / "heroes" / "cat_ninja.webp").convert("RGBA")
    frame = strip.crop((0, 0, strip.width // 3, strip.height))
    return frame.crop(frame.getbbox())


def sky(size):
    """The page's sky, top to bottom."""
    top, low = Image.new("RGB", (size, size), SKY), Image.new("RGB", (size, size), SKY_LOW)
    fade = Image.linear_gradient("L").resize((size, size))
    return Image.composite(low, top, fade).convert("RGBA")


def icon(size, *, inner, rounded):
    """The cat on the sky over a sun, the cat `inner` of the size across at most."""
    art = sky(size)
    draw = ImageDraw.Draw(art)
    # The sun, a little high, so the cat stands in front of it.
    r = size * inner * 0.42
    cx, cy = size / 2, size * 0.47
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=SUN + (255,))
    cat = hero()
    scale = min(size * inner / cat.width, size * inner / cat.height)
    cat = cat.resize((round(cat.width * scale), round(cat.height * scale)), Image.LANCZOS)
    x, y = (size - cat.width) // 2, round(size * (1 + inner) / 2 - cat.height)
    # A soft shadow under the feet, then the cat.
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((size / 2 - cat.width * 0.36, y + cat.height - size * 0.03, size / 2 + cat.width * 0.36, y + cat.height + size * 0.02), fill=(20, 24, 38, 90))
    art = Image.alpha_composite(art, shadow.filter(ImageFilter.GaussianBlur(size / 90)))
    art.alpha_composite(cat, (x, y))
    if rounded:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=size * 0.22, fill=255)
        art.putalpha(mask)
    return art


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    icon(192, inner=0.84, rounded=True).save(OUT / "icon-192.png", optimize=True)
    icon(512, inner=0.84, rounded=True).save(OUT / "icon-512.png", optimize=True)
    icon(512, inner=0.66, rounded=False).save(OUT / "maskable-512.png", optimize=True)
    icon(180, inner=0.8, rounded=False).save(OUT / "apple-touch-icon.png", optimize=True)
    for name in sorted(OUT.iterdir()):
        print(name.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
