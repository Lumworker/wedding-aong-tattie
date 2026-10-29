#!/usr/bin/env python3
"""Key vendor/concepts/guests-sheet-raw.png into public/sprites/guests.png.

The sheet is a 2×6 grid (males on top, females below) on pure black.
Only background becomes transparent: a 4-connected flood from the image
edges through pixels whose max channel is <= 2. Black and navy suits stay,
because those pixels are not connected to the border at that threshold.
Characters are not redrawn or recolored. Each cell gets a 2px transparent
gutter so neighboring frames do not bleed.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "vendor/concepts/guests-sheet-raw.png"
OUT = ROOT / "public/sprites/guests.png"

# Near-pure black only. Suits sit well above this and are not edge-connected.
BG_MAX = 2
GUTTER = 2
COLS = 6
ROWS = 2


def flood_background(rgb: np.ndarray) -> np.ndarray:
    height, width = rgb.shape[:2]
    dark = rgb.max(axis=2) <= BG_MAX
    seen = np.zeros((height, width), np.uint8)
    edge = np.zeros((height, width), bool)
    edge[0, :] = True
    edge[-1, :] = True
    edge[:, 0] = True
    edge[:, -1] = True
    seeds = np.argwhere(edge & dark)
    for y, x in seeds:
        seen[y, x] = 1
    queue: deque[tuple[int, int]] = deque((int(y), int(x)) for y, x in seeds)
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < height and 0 <= nx < width and not seen[ny, nx] and dark[ny, nx]:
                seen[ny, nx] = 1
                queue.append((ny, nx))
    return seen.astype(bool)


def runs(mask: np.ndarray, min_gap: int = 8) -> list[tuple[int, int]]:
    idx = np.flatnonzero(mask)
    if len(idx) == 0:
        return []
    bounds: list[tuple[int, int]] = []
    start = int(idx[0])
    prev = int(idx[0])
    for value in idx[1:]:
        current = int(value)
        if current - prev > min_gap:
            bounds.append((start, prev + 1))
            start = current
        prev = current
    bounds.append((start, prev + 1))
    return bounds


def main() -> None:
    image = Image.open(SRC).convert("RGB")
    rgb = np.asarray(image)
    background = flood_background(rgb)
    alpha = np.where(background, 0, 255).astype(np.uint8)

    col_runs = runs(alpha.any(axis=0))
    row_runs = runs(alpha.any(axis=1))
    if (len(col_runs), len(row_runs)) != (COLS, ROWS):
        raise SystemExit(f"expected {COLS}×{ROWS} sprites, found cols {col_runs} rows {row_runs}")

    tiles: list[Image.Image] = []
    for top, bottom in row_runs:
        for left, right in col_runs:
            tile_rgb = rgb[top:bottom, left:right]
            tile_a = alpha[top:bottom, left:right]
            ys, xs = np.nonzero(tile_a)
            crop = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
            crop[..., :3] = tile_rgb[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
            crop[..., 3] = tile_a[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
            tiles.append(Image.fromarray(crop, "RGBA"))

    # Black suits are indices 1 and 4. They must keep a solid dark body.
    for index in (1, 4):
        arr = np.asarray(tiles[index])
        opaque = arr[..., 3] > 0
        dark = opaque & (arr[..., :3].max(axis=2) <= 40)
        if int(dark.sum()) < 1500:
            raise SystemExit(f"black suit {index} lost dark pixels ({int(dark.sum())})")

    frame_w = max(tile.size[0] for tile in tiles) + 2 * GUTTER
    frame_h = max(tile.size[1] for tile in tiles) + 2 * GUTTER
    sheet = Image.new("RGBA", (frame_w * COLS, frame_h * ROWS), (0, 0, 0, 0))
    for index, tile in enumerate(tiles):
        col = index % COLS
        row = index // COLS
        x = col * frame_w + (frame_w - tile.size[0]) // 2
        y = row * frame_h + (frame_h - GUTTER - tile.size[1])
        sheet.paste(tile, (x, y), tile)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, optimize=True)
    print(
        {
            "frameW": frame_w,
            "frameH": frame_h,
            "width": sheet.size[0],
            "height": sheet.size[1],
            "bg": int(background.sum()),
            "tiles": [tile.size for tile in tiles],
        }
    )


if __name__ == "__main__":
    main()
