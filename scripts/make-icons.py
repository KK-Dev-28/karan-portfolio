"""Renders the KK brand mark to the PNG/ICO icon set in frontend/src.

Mirrors frontend/src/assets/brand-icon.svg (Midnight Gold palette). Run from
the repo root after changing the mark:  python scripts/make-icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "frontend" / "src"
S = 1024  # draw large, then downsample for clean anti-aliasing

BG_A, BG_B = (12, 12, 22), (22, 20, 38)
GOLD_A, GOLD_B = (245, 158, 11), (253, 230, 138)
INK = (245, 245, 247)


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def gradient(size, a, b):
    g = Image.new("RGB", (size, size))
    px = g.load()
    for y in range(size):
        for x in range(size):
            px[x, y] = lerp(a, b, (x + y) / (2 * size - 2))
    return g


def mark(bleed: bool) -> Image.Image:
    """bleed=True fills the whole square (maskable); otherwise a rounded tile."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    pad = 0 if bleed else 64
    tile = gradient(S, BG_A, BG_B)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle((pad, pad, S - pad, S - pad), radius=0 if bleed else 200, fill=255)
    img.paste(tile, (0, 0), mask)
    d = ImageDraw.Draw(img)
    if not bleed:
        d.rounded_rectangle((pad, pad, S - pad, S - pad), radius=200, outline=(58, 52, 70, 255), width=8)
    # Soft accent glow, top-right.
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r in range(380, 0, -8):
        gd.ellipse((S - 300 - r, 260 - r, S - 300 + r, 260 + r), fill=(245, 158, 11, int(26 * (1 - r / 380))))
    img = Image.alpha_composite(img, Image.composite(glow, Image.new("RGBA", (S, S)), mask))

    # The KK letters; maskable art is scaled into the 80% safe zone.
    k = 0.72 if bleed else 1.0
    c = S / 2
    def P(x, y):  # design space is the SVG's 128-unit grid
        return (c + (x * 8 - c) * k, c + (y * 8 - c) * k)
    w = int(58 * k)
    gold = gradient(S, GOLD_A, GOLD_B).convert("RGBA")
    gm = Image.new("L", (S, S), 0)
    gdm = ImageDraw.Draw(gm)
    ink = ImageDraw.Draw(img)
    for x0 in (36, 74):
        ink.line([P(x0, 36), P(x0, 92)], fill=INK, width=w)
        for end in (P(x0, 92), P(x0, 36)):
            ink.ellipse((end[0] - w / 2, end[1] - w / 2, end[0] + w / 2, end[1] + w / 2), fill=INK)
        j = P(x0, 64)  # round joint, so the two arms meet without a notch
        gdm.ellipse((j[0] - w / 2, j[1] - w / 2, j[0] + w / 2, j[1] + w / 2), fill=255)
        for yy in (36, 92):
            a, b = j, P(x0 + 26, yy)
            gdm.line([a, b], fill=255, width=w)
            gdm.ellipse((b[0] - w / 2, b[1] - w / 2, b[0] + w / 2, b[1] + w / 2), fill=255)
    img.paste(gold, (0, 0), gm)
    return img


def save(img, name, size):
    img.resize((size, size), Image.LANCZOS).save(OUT / name)


tile, full = mark(False), mark(True)
(OUT / "assets" / "icons").mkdir(parents=True, exist_ok=True)
save(tile, "assets/icons/icon-192.png", 192)
save(tile, "assets/icons/icon-512.png", 512)
save(full, "assets/icons/maskable-512.png", 512)
save(full.convert("RGB"), "assets/icons/apple-touch-icon.png", 180)
tile.resize((256, 256), Image.LANCZOS).save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print("icons written to", OUT)
