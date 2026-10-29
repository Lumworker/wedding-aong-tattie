#!/usr/bin/env python3
"""Build the welcome jump strips from the idle couple portraits.

Sheet: 1576×264. Six cells of 256×264, 8px gutter between cells, no outer pad.
Order: stand, crouch, rise, peak, descend, land.

Pixels come from groom.png / bride.png (nearest-neighbor). Faces are not redrawn.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPRITE = ROOT / "public" / "sprites"

CELL_W = 256
CELL_H = 264
GUTTER = 8
FRAMES = 6
SHEET_W = FRAMES * CELL_W + (FRAMES - 1) * GUTTER  # 1576
SHEET_H = CELL_H

# Shared scale so stand and jump frames match. Peak lift stays inside the cell.
BASE = 200
BOTTOM = 8
# Source rows kept 1:1 on crouch/land so the face does not squash. Below this, only the body compresses.
HEAD_CUT = {"groom.png": 116, "bride.png": 156}


def scale_nn(src: Image.Image, width: int, height: int) -> Image.Image:
    src_w, src_h = src.size
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    src_px = src.load()
    out_px = out.load()
    for y in range(height):
        sy = min(src_h - 1, (y * src_h) // height)
        for x in range(width):
            sx = min(src_w - 1, (x * src_w) // width)
            out_px[x, y] = src_px[sx, sy]
    return out


def blit(sheet: Image.Image, sprite: Image.Image, cell: int, lift: int) -> None:
    """Bottom-align `sprite` in the cell, then move it up by `lift` pixels."""
    x0 = cell * (CELL_W + GUTTER) + (CELL_W - sprite.width) // 2
    y0 = CELL_H - BOTTOM - lift - sprite.height
    if y0 < 0:
        raise SystemExit(f"frame {cell} clips the top (y={y0})")
    sheet.alpha_composite(sprite, (x0, y0))


def squash_body(stand: Image.Image, src_name: str, height: int) -> Image.Image:
    """Keep the head rows identical and nearest-neighbor compress only the body."""
    cut = HEAD_CUT[src_name] * BASE // 256
    if height >= stand.height or cut >= height:
        raise SystemExit(f"bad squash {src_name} cut={cut} height={height}")
    head = stand.crop((0, 0, stand.width, cut))
    body = stand.crop((0, cut, stand.width, stand.height))
    body = scale_nn(body, stand.width, height - cut)
    out = Image.new("RGBA", (stand.width, height), (0, 0, 0, 0))
    out.alpha_composite(head, (0, 0))
    out.alpha_composite(body, (0, cut))
    return out


def build(src_name: str, dest_name: str) -> None:
    src = Image.open(SPRITE / src_name).convert("RGBA")
    if src.size != (256, 256):
        raise SystemExit(f"{src_name} is {src.size}, expected 256×256")

    stand = scale_nn(src, BASE, BASE)
    crouch = squash_body(stand, src_name, 168)
    land = squash_body(stand, src_name, 186)

    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
    # stand, crouch, rise, peak, descend, land
    blit(sheet, stand, 0, 0)
    blit(sheet, crouch, 1, 0)
    blit(sheet, stand, 2, 24)
    blit(sheet, stand, 3, 50)
    blit(sheet, stand, 4, 22)
    blit(sheet, land, 5, 0)

    dest = SPRITE / dest_name
    sheet.save(dest, "PNG")
    print(f"wrote {dest.relative_to(ROOT)} {sheet.size}")


def main() -> None:
    if SHEET_W != 1576 or SHEET_H != 264:
        raise SystemExit(f"unexpected sheet {SHEET_W}×{SHEET_H}")
    build("groom.png", "groom-jump.png")
    build("bride.png", "bride-jump.png")


if __name__ == "__main__":
    main()
