#!/usr/bin/env python3
"""Build venue guest and plant atlases from the vendored CC0 pixel packs.

Sources (see public/sprites/ATTRIBUTION.md):
- TokyoGeisha, Pixel People (CC0) — bodies, hair, tops, bottoms
- Robert Ramsay, Pixelled trees (CC0)
- SpiderDave, Flowers (CC0) — 12×24 plant strip

Guests are composited, dressed in a small wedding palette, then nearest-neighbor
halved so their pixels match the chapel scene. Walk cycle is a one-pixel step.
"""

from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PEOPLE = ROOT / "vendor/cc0-pixel/pixel-people"
TREES = ROOT / "vendor/cc0-pixel/trees/pixelledtrees.png"
FLOWERS = ROOT / "vendor/cc0-pixel/flowers/plants.png"
OUT_DIR = ROOT / "public/sprites"

FRAME_PITCH_X = 68
FRAME_W = 64
FRAME_H = 112
FRAME_PITCH_Y = 116

COLS = 6
ROWS = 4
COUNT = COLS * ROWS

SKINS = [0, 1]
# Short and shoulder-length cuts only. Wide costume hair (afro cloud, hair pin)
# made every cell huge and read as antennae at this pixel size.
MALE_HAIR = [1, 2, 3, 8, 12, 4, 6, 10]
FEMALE_HAIR = [3, 4, 11, 8, 12, 1]
HAIR_ROWS = [0, 13, 26, 52, 39]  # black, brown, grey, auburn, blonde
TOP_SHAPES = [0, 1, 4, 6]
PANT_SHAPES = [2, 4, 0, 17]

MALE_TOPS = [
    (36, 52, 92),
    (32, 34, 40),
    (236, 236, 232),
    (74, 110, 86),
    (196, 154, 72),
]
MALE_PANTS = [(24, 26, 32), (28, 40, 72), (58, 60, 68)]
FEMALE_TOPS = [
    (250, 246, 240),
    (224, 150, 162),
    (186, 78, 102),
    (236, 236, 232),
    (90, 122, 104),
]
FEMALE_PANTS = [(250, 246, 240), (214, 140, 154), (32, 34, 40), (36, 52, 92)]
SHOE = (28, 26, 30)

# Artist-pixel boxes on the 4×-prestretched tree sheet, after dividing by 4.
TREE_BOXES = [
    ("oak", 12, 5, 95, 103),
    ("birch", 146, 25, 94, 88),
    ("willow", 244, 11, 69, 99),
    ("pine", 91, 80, 54, 116),
    ("maple", 251, 125, 64, 66),
]


def frames_of(path: Path) -> list[Image.Image]:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    cols = int(round((width + 4) / FRAME_PITCH_X))
    rows = 1 if height <= FRAME_H else int(round((height + 4) / FRAME_PITCH_Y))
    tiles: list[Image.Image] = []
    for row in range(rows):
        for col in range(cols):
            x = col * FRAME_PITCH_X
            y = 0 if rows == 1 else row * FRAME_PITCH_Y
            if x >= width or y >= height:
                continue
            tile = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
            crop = image.crop((x, y, min(x + FRAME_W, width), min(y + FRAME_H, height)))
            tile.paste(crop, (0, 0))
            tiles.append(tile)
    return tiles


def tint(image: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    pixels = image.load()
    width, height = image.size
    lums: list[float] = []
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 20:
                lums.append((red + green + blue) / 3)
    if not lums:
        return image
    low, high = min(lums), max(lums)
    span = max(high - low, 1)
    out = image.copy()
    dest = out.load()
    cr, cg, cb = color
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 20:
                continue
            tone = (red + green + blue) / 3
            shade = 0.52 + ((tone - low) / span) * 0.62
            dest[x, y] = (
                max(0, min(255, int(cr * shade))),
                max(0, min(255, int(cg * shade))),
                max(0, min(255, int(cb * shade))),
                alpha,
            )
    return out


def dress(skin: Image.Image, pants_color: tuple[int, int, int]) -> Image.Image:
    """Paint chibi legs and shoes so shorts read as trousers."""
    out = skin.copy()
    source = skin.load()
    dest = out.load()
    height = out.size[1]
    for y in range(height):
        for x in range(out.size[0]):
            red, green, blue, alpha = source[x, y]
            if alpha < 20:
                continue
            if y >= height - 5:
                dest[x, y] = shade_of((red, green, blue, alpha), SHOE)
            elif y >= height - 18:
                dest[x, y] = shade_of((red, green, blue, alpha), pants_color)
    return out


def shade_of(pixel: tuple[int, int, int, int], color: tuple[int, int, int]) -> tuple[int, int, int, int]:
    red, green, blue, alpha = pixel
    tone = (red + green + blue) / (3 * 255)
    shade = 0.62 + tone * 0.5
    cr, cg, cb = color
    return (
        max(0, min(255, int(cr * shade))),
        max(0, min(255, int(cg * shade))),
        max(0, min(255, int(cb * shade))),
        alpha,
    )


def compose_guest(
    skin: Image.Image,
    top: Image.Image,
    pants: Image.Image,
    hair: Image.Image,
    top_color: tuple[int, int, int],
    pants_color: tuple[int, int, int],
) -> Image.Image:
    image = dress(skin, pants_color)
    image.alpha_composite(tint(pants, pants_color))
    image.alpha_composite(tint(top, top_color))
    image.alpha_composite(hair)
    return image


def even_box(box: tuple[int, int, int, int], limit: tuple[int, int]) -> tuple[int, int, int, int]:
    min_x, min_y, max_x, max_y = box
    max_w, max_h = limit
    min_x = max(0, min_x - 1)
    min_y = max(0, min_y - 1)
    max_x = min(max_w, max_x + 1)
    max_y = min(max_h, max_y + 1)
    if min_x % 2:
        min_x -= 1
    if min_y % 2:
        min_y -= 1
    if (max_x - min_x) % 2:
        max_x = min(max_w, max_x + 1)
    if (max_y - min_y) % 2:
        max_y = min(max_h, max_y + 1)
    if (max_x - min_x) % 2:
        min_x = max(0, min_x - 1)
    if (max_y - min_y) % 2:
        min_y = max(0, min_y - 1)
    return min_x, min_y, max_x, max_y


def step_frame(image: Image.Image) -> Image.Image:
    """Widen the stance by one pixel without opening a hole between the legs."""
    out = image.copy()
    source = image.load()
    dest = out.load()
    width, height = image.size
    start = max(0, height - 6)
    for y in range(start, height):
        row = [source[x, y] for x in range(width)]
        for x, pixel in enumerate(row):
            if pixel[3] < 20:
                continue
            shifted = max(0, x - 1) if x < width // 2 else min(width - 1, x + 1)
            dest[shifted, y] = pixel
    return out


def pack_guests(composed: list[Image.Image], box: tuple[int, int, int, int]) -> tuple[Image.Image, int, int]:
    crop = even_box(box, (FRAME_W, FRAME_H))
    halved: list[Image.Image] = []
    for guest in composed:
        tile = guest.crop(crop)
        halved.append(tile.resize((tile.size[0] // 2, tile.size[1] // 2), Image.Resampling.NEAREST))
    frame_w, frame_h = halved[0].size
    sheet = Image.new("RGBA", (COLS * frame_w * 2, ROWS * frame_h), (0, 0, 0, 0))
    for index, stand in enumerate(halved):
        step = step_frame(stand)
        col = index % COLS
        row = index // COLS
        sheet.paste(stand, (col * frame_w * 2, row * frame_h), stand)
        sheet.paste(step, (col * frame_w * 2 + frame_w, row * frame_h), step)
    return sheet, frame_w, frame_h


def shared_guest_crop() -> tuple[int, int, int, int]:
    """Union of male and female silhouettes so both atlases share a cell size."""
    boxes = []
    for kind, styles, top_colors, pant_colors in (
        ("male", MALE_HAIR, MALE_TOPS, MALE_PANTS),
        ("female", FEMALE_HAIR, FEMALE_TOPS, FEMALE_PANTS),
    ):
        del kind
        skin_frames = frames_of(PEOPLE / "Sprite Sheet - Skin.png")
        tops = frames_of(PEOPLE / "Sprite Sheet - Tops.png")
        pants = frames_of(PEOPLE / "Sprite Sheet - Bottoms.png")
        hair = frames_of(PEOPLE / "Sprite Sheet - Hair.png")
        for index in range(COUNT):
            guest = compose_guest(
                skin_frames[SKINS[index % len(SKINS)]],
                tops[TOP_SHAPES[(index * 3) % len(TOP_SHAPES)]],
                pants[PANT_SHAPES[(index * 5) % len(PANT_SHAPES)]],
                hair[styles[(index * 2) % len(styles)] + HAIR_ROWS[(index // 2) % len(HAIR_ROWS)]],
                top_colors[index % len(top_colors)],
                pant_colors[(index * 3) % len(pant_colors)],
            )
            box = guest.getbbox()
            if box:
                boxes.append(box)
    min_x = min(box[0] for box in boxes)
    min_y = min(box[1] for box in boxes)
    max_x = max(box[2] for box in boxes)
    max_y = max(box[3] for box in boxes)
    return even_box((min_x, min_y, max_x, max_y), (FRAME_W, FRAME_H))


def build_guest_sheet(kind: str, crop: tuple[int, int, int, int]) -> tuple[Image.Image, int, int]:
    skin_frames = frames_of(PEOPLE / "Sprite Sheet - Skin.png")
    tops = frames_of(PEOPLE / "Sprite Sheet - Tops.png")
    pants = frames_of(PEOPLE / "Sprite Sheet - Bottoms.png")
    hair = frames_of(PEOPLE / "Sprite Sheet - Hair.png")
    styles = MALE_HAIR if kind == "male" else FEMALE_HAIR
    top_colors = MALE_TOPS if kind == "male" else FEMALE_TOPS
    pant_colors = MALE_PANTS if kind == "male" else FEMALE_PANTS
    composed = []
    for index in range(COUNT):
        composed.append(
            compose_guest(
                skin_frames[SKINS[index % len(SKINS)]],
                tops[TOP_SHAPES[(index * 3) % len(TOP_SHAPES)]],
                pants[PANT_SHAPES[(index * 5) % len(PANT_SHAPES)]],
                hair[styles[(index * 2) % len(styles)] + HAIR_ROWS[(index // 2) % len(HAIR_ROWS)]],
                top_colors[index % len(top_colors)],
                pant_colors[(index * 3) % len(pant_colors)],
            )
        )
    return pack_guests(composed, crop)


def kill_specks(image: Image.Image, min_count: int = 8) -> Image.Image:
    pixels = image.load()
    width, height = image.size
    seen = [[False] * width for _ in range(height)]
    out = image.copy()
    dest = out.load()
    for y in range(height):
        for x in range(width):
            if seen[y][x] or pixels[x, y][3] < 20:
                seen[y][x] = True
                continue
            queue = deque([(x, y)])
            seen[y][x] = True
            blob = [(x, y)]
            while queue:
                cx, cy = queue.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or seen[ny][nx]:
                        continue
                    if pixels[nx, ny][3] < 20:
                        seen[ny][nx] = True
                        continue
                    seen[ny][nx] = True
                    queue.append((nx, ny))
                    blob.append((nx, ny))
            if len(blob) < min_count:
                for bx, by in blob:
                    dest[bx, by] = (0, 0, 0, 0)
    return out


def build_trees() -> list[tuple[str, Image.Image]]:
    source = Image.open(TREES).convert("RGBA")
    art = source.resize((source.size[0] // 4, source.size[1] // 4), Image.Resampling.NEAREST)
    trees: list[tuple[str, Image.Image]] = []
    for name, x, y, width, height in TREE_BOXES:
        tile = art.crop((x, y, x + width, y + height))
        tile = tile.resize((max(1, tile.size[0] // 2), max(1, tile.size[1] // 2)), Image.Resampling.NEAREST)
        tile = kill_specks(tile)
        box = tile.getbbox()
        if not box:
            continue
        trees.append((name, tile.crop(box)))
    return trees


# Hand-picked blooms (rose bush, vines, tulips, daisies) and low grass tufts.
# Mushroom cells at the end of the strip are left out on purpose.
FLOWER_INDICES = [61, 62, 60, 54, 55, 52, 48, 46, 40, 38, 36, 33, 20, 19, 15, 37]
TUFT_INDICES = [0, 1, 7, 8]


def keyed_flower_cells() -> list[Image.Image]:
    sheet = Image.open(FLOWERS).convert("RGBA")
    background = (34, 32, 52)
    pixels = sheet.load()
    for y in range(sheet.size[1]):
        for x in range(sheet.size[0]):
            red, green, blue, _alpha = pixels[x, y]
            if (red, green, blue) == background:
                pixels[x, y] = (0, 0, 0, 0)
    cols = sheet.size[0] // 12
    return [sheet.crop((col * 12, 0, col * 12 + 12, 24)) for col in range(cols)]


def build_flowers() -> tuple[list[Image.Image], list[Image.Image]]:
    cells = keyed_flower_cells()
    return [cells[index] for index in FLOWER_INDICES], [cells[index] for index in TUFT_INDICES]


def pack_plants(
    trees: list[tuple[str, Image.Image]],
    flowers: list[Image.Image],
    tufts: list[Image.Image],
) -> tuple[Image.Image, dict]:
    cell_w, cell_h = 12, 24
    sprites = flowers + tufts
    cols = 8
    rows = (len(sprites) + cols - 1) // cols
    band_h = rows * cell_h
    tree_w = sum(tile.size[0] for _name, tile in trees) + len(trees)
    width = max(cols * cell_w, tree_w)
    height = band_h + 2 + max(tile.size[1] for _name, tile in trees)
    sheet = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    frames = []
    for index, tile in enumerate(sprites):
        col = index % cols
        row = index // cols
        x = col * cell_w
        y = row * cell_h
        sheet.paste(tile, (x, y), tile)
        frames.append({"x": x, "y": y, "w": cell_w, "h": cell_h})
    tree_frames = []
    cursor = 0
    tree_y = band_h + 2
    for name, tile in trees:
        sheet.paste(tile, (cursor, tree_y), tile)
        tree_frames.append({"name": name, "x": cursor, "y": tree_y, "w": tile.size[0], "h": tile.size[1]})
        cursor += tile.size[0] + 1
    meta = {
        "width": width,
        "height": height,
        "flowers": frames[: len(flowers)],
        "tufts": frames[len(flowers) :],
        "trees": tree_frames,
    }
    return sheet, meta


def write_plant_atlas(meta: dict) -> None:
    def frames(items: list[dict], named: bool) -> str:
        lines = []
        for item in items:
            name = f'  {{ name: "{item["name"]}", ' if named else "  { "
            lines.append(f"{name}x: {item['x']}, y: {item['y']}, w: {item['w']}, h: {item['h']} }},")
        return "\n".join(lines)

    text = f"""/** Generated by scripts/build-pixel-atlases.py — do not edit by hand. */
export const PLANT_SHEET = {{
  href: "/sprites/plants.png?v=6",
  width: {meta["width"]},
  height: {meta["height"]},
}} as const

export type PlantFrame = {{
  x: number
  y: number
  w: number
  h: number
}}

export type TreeFrame = PlantFrame & {{ name: string }}

export const FLOWERS: readonly PlantFrame[] = [
{frames(meta["flowers"], False)}
]

export const TUFTS: readonly PlantFrame[] = [
{frames(meta["tufts"], False)}
]

export const TREES: readonly TreeFrame[] = [
{frames(meta["trees"], True)}
]
"""
    (ROOT / "src/lib/plant-atlas.ts").write_text(text)


def preview(male: Image.Image, female: Image.Image, plants: Image.Image) -> None:
    scale = 3
    sheet = Image.new(
        "RGBA",
        (max(male.size[0], plants.size[0]) * scale, (male.size[1] + female.size[1] + plants.size[1] + 8) * scale),
        (18, 16, 28, 255),
    )
    cursor = 0
    for image in (male, female, plants):
        blown = image.resize((image.size[0] * scale, image.size[1] * scale), Image.Resampling.NEAREST)
        sheet.paste(blown, (0, cursor), blown)
        cursor += blown.size[1] + 4 * scale
    path = Path("/tmp/pixel-atlas-preview.png")
    sheet.save(path)
    print("preview", path, sheet.size)


def main() -> None:
    crop = shared_guest_crop()
    print("guest crop", crop)
    male, frame_w, frame_h = build_guest_sheet("male", crop)
    female, frame_w_f, frame_h_f = build_guest_sheet("female", crop)
    if (frame_w, frame_h) != (frame_w_f, frame_h_f):
        raise SystemExit(f"frame mismatch {frame_w, frame_h} vs {frame_w_f, frame_h_f}")
    trees = build_trees()
    flowers, tufts = build_flowers()
    plants, meta = pack_plants(trees, flowers, tufts)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    male.save(OUT_DIR / "guests-male.png")
    female.save(OUT_DIR / "guests-female.png")
    plants.save(OUT_DIR / "plants.png")
    write_plant_atlas(meta)
    metrics = {
        "frameW": frame_w,
        "frameH": frame_h,
        "frames": 2,
        "cols": COLS,
        "rows": ROWS,
        "count": COUNT,
        "width": male.size[0],
        "height": male.size[1],
        "trees": [item["name"] for item in meta["trees"]],
        "flowerCount": len(meta["flowers"]),
        "plantSheet": [meta["width"], meta["height"]],
    }
    print(json.dumps(metrics, indent=2))
    preview(male, female, plants)


if __name__ == "__main__":
    main()
