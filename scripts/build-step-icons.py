"""Stepper icon samples, 24x24 pixel art in the wedding CI palette.

Style follows public/sprites: chunky pixels, an outside outline in a dark
shade of the neighbouring fill, a few highlight pixels.
"""
from PIL import Image, ImageDraw

S = 24
C = {
    "choc": (92, 58, 38), "chocL": (138, 90, 60),
    "sage": (163, 177, 138), "sageD": (110, 127, 87), "sageL": (201, 212, 178),
    "cream": (241, 231, 211), "creamD": (216, 200, 172), "paper": (255, 249, 238),
    "pink": (240, 160, 164), "pinkD": (196, 102, 112), "pinkL": (250, 205, 205),
    "gold": (233, 196, 106), "goldD": (176, 128, 42), "goldL": (247, 225, 160),
    "glass": (199, 224, 230), "glassL": (240, 250, 252),
    "skin": (242, 201, 160), "skinD": (204, 150, 104),
    "gray": (120, 112, 104),
}
# outline colour chosen from the fill it wraps
OUT = {
    "choc": (52, 30, 18), "chocL": (52, 30, 18),
    "sage": (70, 86, 52), "sageD": (70, 86, 52), "sageL": (70, 86, 52),
    "cream": (122, 92, 64), "creamD": (122, 92, 64), "paper": (122, 92, 64),
    "pink": (132, 52, 64), "pinkD": (132, 52, 64), "pinkL": (132, 52, 64),
    "gold": (120, 80, 20), "goldD": (120, 80, 20), "goldL": (120, 80, 20),
    "glass": (70, 96, 110), "glassL": (70, 96, 110),
    "skin": (140, 86, 52), "skinD": (140, 86, 52), "gray": (52, 30, 18),
}
NAMES = list(C)


class Icon:
    def __init__(self):
        self.g = [[None] * S for _ in range(S)]

    def px(self, x, y, c):
        if 0 <= x < S and 0 <= y < S:
            self.g[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px(x, y, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for y in range(S):
            for x in range(S):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                    self.px(x, y, c)

    def poly(self, pts, c):
        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).polygon(pts, fill=1)
        for y in range(S):
            for x in range(S):
                if m.getpixel((x, y)):
                    self.px(x, y, c)

    def line(self, pts, c, w=1):
        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).line(pts, fill=1, width=w)
        for y in range(S):
            for x in range(S):
                if m.getpixel((x, y)):
                    self.px(x, y, c)

    def pattern(self, x0, y0, rows, c):
        for dy, row in enumerate(rows):
            for dx, ch in enumerate(row):
                if ch != ".":
                    self.px(x0 + dx, y0 + dy, c)

    def render(self):
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        out = [[None] * S for _ in range(S)]
        for y in range(S):
            for x in range(S):
                if self.g[y][x] is None:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < S and 0 <= ny < S and self.g[ny][nx]:
                            out[y][x] = OUT[self.g[ny][nx]]
                            break
        for y in range(S):
            for x in range(S):
                if self.g[y][x]:
                    img.putpixel((x, y), C[self.g[y][x]] + (255,))
                elif out[y][x]:
                    img.putpixel((x, y), out[y][x] + (255,))
        return img


HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."]


def envelope():
    i = Icon()
    i.rect(2, 6, 21, 19, "cream")
    i.rect(2, 17, 21, 19, "creamD")              # bottom shade
    i.line([(2, 6), (11, 13)], "creamD")
    i.line([(21, 6), (12, 13)], "creamD")
    i.line([(2, 19), (8, 14)], "creamD")
    i.line([(21, 19), (15, 14)], "creamD")
    i.pattern(9, 10, HEART, "pink")
    i.px(10, 11, "pinkL"); i.px(11, 11, "pinkL")
    i.rect(3, 7, 5, 7, "paper")                   # highlight
    return i


def person():
    """Chibi bust with a big head, like the guests in the venue scene."""
    i = Icon()
    i.ellipse(9.0, 21.5, 6.5, 3.8, "sage")       # small shoulders
    i.rect(3, 21, 15, 22, "sage")
    i.poly([(14, 19), (16, 11), (18, 11), (17, 19)], "sage")  # raised sleeve
    i.rect(16, 6, 19, 10, "skin")                 # palm
    for x in (16, 18):
        i.rect(x, 4, x, 6, "skin")                # fingers with gaps
    i.px(20, 7, "skin")                           # thumb
    i.ellipse(9.0, 11.0, 5.8, 5.6, "skin")        # big face
    i.ellipse(9.0, 6.6, 6.2, 3.2, "choc")         # hair cap
    i.rect(3, 7, 3, 12, "choc"); i.rect(14, 7, 14, 10, "choc")
    i.rect(5, 8, 10, 8, "choc"); i.px(5, 9, "choc")  # fringe
    i.rect(6, 11, 6, 12, "choc"); i.rect(11, 11, 11, 12, "choc")  # eyes
    i.px(8, 14, "skinD"); i.px(9, 14, "skinD")    # smile
    i.px(5, 13, "pinkL"); i.px(12, 13, "pinkL")   # cheeks
    i.px(6, 5, "chocL"); i.px(7, 5, "chocL"); i.px(8, 5, "chocL")
    return i


def car(body="sage", dark="sageD", light="sageL", sign=False):
    i = Icon()
    i.poly([(6, 7), (16, 7), (19, 12), (3, 12)], body)       # cabin
    i.poly([(7, 8), (11, 8), (11, 11), (5, 11)], "glass")    # windows
    i.poly([(12, 8), (15, 8), (17, 11), (12, 11)], "glass")
    i.px(7, 9, "glassL"); i.px(13, 9, "glassL")
    i.rect(1, 12, 22, 17, body)                               # body
    i.rect(1, 16, 22, 17, dark)
    i.rect(2, 13, 4, 13, light)
    i.rect(20, 13, 22, 14, "goldL")                           # headlight
    i.rect(1, 14, 1, 14, "pink")                              # tail light
    for cx in (6, 17):
        i.ellipse(cx, 18, 2.6, 2.6, "choc")
        i.px(cx, 18, "creamD")
    if sign:
        i.rect(9, 4, 13, 6, "paper")
        i.rect(10, 5, 12, 5, "choc")
    return i


def taxi():
    return car("gold", "goldD", "goldL", sign=True)


def train():
    """Elevated sky train over a river boat: one icon for รถไฟฟ้า / เรือ."""
    i = Icon()
    i.rect(2, 3, 21, 9, "cream")                   # train body, side view
    i.rect(2, 3, 21, 3, "sage")
    i.rect(2, 8, 21, 9, "sage")                    # livery stripe
    for x in (4, 9, 14):
        i.rect(x, 5, x + 3, 6, "glass")            # windows
    i.px(4, 5, "glassL"); i.px(9, 5, "glassL")
    i.rect(20, 5, 21, 6, "goldL")                  # headlight
    i.rect(1, 11, 22, 12, "chocL")                 # viaduct beam
    i.rect(4, 13, 5, 20, "creamD")                 # pillars
    i.rect(18, 13, 19, 20, "creamD")
    i.poly([(8, 18), (16, 18), (14, 20), (10, 20)], "pink")   # boat hull
    i.rect(11, 16, 13, 17, "paper")                # cabin
    i.rect(1, 21, 22, 22, "glass")                 # river
    for x in (3, 9, 15, 20):
        i.px(x, 21, "glassL")
    return i


def dropoff():
    """Pink car with a hand waving out of the window: someone drops you off."""
    i = car("pink", "pinkD", "pinkL")
    i.rect(9, 5, 10, 8, "skin")                    # arm out of the window
    i.rect(8, 3, 12, 5, "skin")                    # palm
    for x in (8, 10, 12):
        i.px(x, 2, "skin")                         # fingers, gaps between
    for x, y in ((15, 2), (16, 3), (16, 4)):       # motion arc
        i.px(x, y, "sage")
    return i


def wave():
    i = Icon()
    i.rect(6, 10, 16, 18, "skin")                  # palm
    for x, top in ((6, 5), (9, 3), (12, 3), (15, 5)):
        i.rect(x, top, x + 1, 10, "skin")          # fingers, 1px gaps
    i.poly([(6, 13), (2, 9), (3, 8), (6, 11)], "skin")  # thumb
    i.rect(7, 19, 15, 22, "sage")                  # sleeve
    i.rect(7, 19, 15, 19, "sageL")
    i.rect(8, 15, 14, 15, "skinD")                 # palm crease
    i.px(10, 4, "paper"); i.px(13, 4, "paper")     # highlights
    for x, y in ((19, 3), (20, 4), (20, 5)):       # motion arc
        i.px(x, y, "pink")
    return i


def note():
    i = Icon()
    i.rect(3, 3, 16, 21, "paper")
    i.rect(3, 3, 16, 5, "sage")                    # binding
    for y in (8, 11, 14, 17):
        i.rect(5, y, 13, y, "creamD")
    i.pattern(5, 7, ["X.", "XX"], "pink")          # tick on first line
    i.line([(20, 6), (12, 15)], "pink", w=3)       # pencil
    i.line([(21, 6), (20, 5)], "pinkL")
    i.poly([(11, 15), (13, 17), (10, 18)], "cream")
    i.px(10, 18, "choc")
    i.line([(19, 5), (21, 7)], "creamD")           # ferrule
    return i


ICONS = {
    "step-rsvp": envelope, "step-about": person, "step-travel-car": car,
    "travel-taxi": taxi, "travel-transit": train, "travel-dropoff": dropoff,
    "step-review": note,
}

if __name__ == "__main__":
    import os, sys
    out = sys.argv[1] if len(sys.argv) > 1 else "public/sprites/steps"
    os.makedirs(out, exist_ok=True)
    for name, fn in ICONS.items():
        img = fn().render()
        img.save(f"{out}/{name}.png")
        img.resize((S * 2, S * 2), Image.NEAREST).save(f"{out}/{name}@2x.png")
        img.resize((S * 8, S * 8), Image.NEAREST).save(f"{out}/{name}@8x.png")
    print("ok", len(ICONS))
