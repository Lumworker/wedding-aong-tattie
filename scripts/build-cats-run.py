"""Pack the approved cat-run concept (AI-assisted, from art work) into public/sprites/cats-run.png.

Input, either:
  vendor/concepts/cats-run/frame-1.png … frame-8.png   (one image per frame), or
  vendor/concepts/cats-run/sheet.png                    (8 frames side by side, equal widths)
on a solid flat background — magenta #FF00FF works best (read from the corners).

Output: public/sprites/cats-run.png — 8 frames × 384×256, 4px gutter and pad (3108×264),
on a 2px pixel grid, shared palette, 1px dark outline. Matches .cats-run in globals.css.

  python3 scripts/build-cats-run.py [--colors 64] [--grid 2] [--tolerance 40] [--no-outline]
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "vendor/concepts/cats-run"
OUT = ROOT / "public/sprites/cats-run.png"
FRAMES, CELL_W, CELL_H, GUT = 8, 384, 256, 4
OUTLINE = (70, 52, 44, 255)


def load_frames():
    singles = [SRC / f"frame-{i}.png" for i in range(1, FRAMES + 1)]
    if all(p.exists() for p in singles):
        return [Image.open(p).convert("RGB") for p in singles]
    sheet = SRC / "sheet.png"
    if not sheet.exists():
        raise SystemExit(f"Put frame-1..8.png or sheet.png in {SRC}")
    im = Image.open(sheet).convert("RGB")
    w = im.width // FRAMES
    return [im.crop((i * w, 0, (i + 1) * w, im.height)) for i in range(FRAMES)]


def key_background(rgb, tolerance):
    """Key out the flat background everywhere (also gaps between legs), with a soft edge.

    Ask for a solid magenta (#FF00FF) background: neither cat has that colour, so green eyes
    and the pink seal survive. The background colour is read from the corners.
    """
    a = np.asarray(rgb).astype(float)
    corners = np.array([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]])
    bg = np.median(corners, 0)
    dist = np.abs(a - bg).sum(2)
    alpha = np.clip((dist - tolerance) / tolerance, 0, 1)
    # pull the background tint out of half-transparent edge pixels
    keep = alpha[..., None]
    fg = np.where(keep > 0, (a - bg * (1 - keep)) / np.maximum(keep, 1e-3), 0)
    fg = np.clip(fg, 0, 255)
    if bg[1] < min(bg[0], bg[2]) - 60:          # magenta-ish key: remove leftover spill
        excess = np.minimum(fg[..., 0], fg[..., 2]) - fg[..., 1] - 20
        excess = np.clip(excess, 0, None)
        fg[..., 0] -= excess; fg[..., 2] -= excess
    out = np.dstack([fg, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def outline(img):
    px = img.load(); w, h = img.size
    res = img.copy(); r = res.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 and any(
                0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] > 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            ):
                r[x, y] = OUTLINE
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--colors", type=int, default=64)
    ap.add_argument("--grid", type=int, default=2, help="screen px per art pixel in the 384×256 cell")
    ap.add_argument("--tolerance", type=int, default=40, help="background match (sum of RGB diff)")
    ap.add_argument("--no-outline", action="store_true")
    args = ap.parse_args()

    frames = load_frames()
    cut = []
    for rgb in frames:
        cut.append(key_background(rgb, args.tolerance))
    # One crop box for all frames keeps the motion (bob, stride) intact.
    boxes = [c.getbbox() for c in cut]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    nw, nh = CELL_W // args.grid, CELL_H // args.grid
    scale = min((nw - 4) / (x1 - x0), (nh - 4) / (y1 - y0))
    tw, th = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))

    small = []
    for c in cut:
        s = c.crop((x0, y0, x1, y1)).resize((tw, th), Image.BOX)
        cell = Image.new("RGBA", (nw, nh), (0, 0, 0, 0))
        cell.alpha_composite(s, ((nw - tw) // 2, nh - th - 2))     # feet on a shared baseline
        small.append(cell)

    # Shared palette across all frames so colours don't flicker.
    strip = Image.new("RGBA", (nw * FRAMES, nh), (0, 0, 0, 0))
    for i, c in enumerate(small):
        strip.alpha_composite(c, (i * nw, 0))
    alpha = strip.getchannel("A").point(lambda v: 255 if v > 120 else 0)
    flat = Image.new("RGB", strip.size, (255, 255, 255)); flat.paste(strip, mask=alpha)
    q = flat.quantize(colors=args.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGBA")
    q.putalpha(alpha)

    sheet = Image.new("RGBA", (GUT + FRAMES * (CELL_W + GUT), CELL_H + 2 * GUT), (0, 0, 0, 0))
    for i in range(FRAMES):
        cell = q.crop((i * nw, 0, (i + 1) * nw, nh))
        if not args.no_outline:
            cell = outline(cell)
        sheet.alpha_composite(cell.resize((CELL_W, CELL_H), Image.NEAREST), (GUT + i * (CELL_W + GUT), GUT))
    sheet.save(OUT)

    bg = (248, 237, 225, 255)
    gif = []
    for i in range(FRAMES):
        f = Image.new("RGBA", (CELL_W, CELL_H), bg)
        f.alpha_composite(sheet.crop((GUT + i * (CELL_W + GUT), GUT, GUT + i * (CELL_W + GUT) + CELL_W, GUT + CELL_H)))
        gif.append(f.convert("P", palette=Image.ADAPTIVE))
    gif[0].save("/tmp/cats-run-preview.gif", save_all=True, append_images=gif[1:], duration=90, loop=0)
    print("sheet", sheet.size, "grid", args.grid, "colors", args.colors, "→", OUT.relative_to(ROOT), "· preview /tmp/cats-run-preview.gif")


if __name__ == "__main__":
    main()
