#!/usr/bin/env python3
"""1200×630 share card for LINE and Facebook.

Thai glyphs come from Noto Sans Thai. Digits and the ampersand come from
Noto Sans, because the Thai fonts on this machine have no Latin digits.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/usr/share/fonts/truetype/noto/NotoSansThai-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSansThai-Bold.ttf"
FONT_LATIN = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
OUT = ROOT / "public/og.png"


def draw_centered(draw: ImageDraw.ImageDraw, y: int, parts: list[tuple[str, ImageFont.FreeTypeFont]], fill: tuple[int, int, int]) -> None:
    widths = [font.getlength(text) for text, font in parts]
    x = 600 - sum(widths) / 2
    for (text, font), width in zip(parts, widths):
        draw.text((x, y), text, font=font, fill=fill, anchor="lm")
        x += width


def main() -> None:
    image = Image.new("RGB", (1200, 630), (246, 241, 234))
    draw = ImageDraw.Draw(image)
    draw.rectangle((28, 28, 1172, 602), outline=(196, 154, 114), width=3)
    draw.rectangle((40, 40, 1160, 590), outline=(224, 184, 154), width=1)

    small = ImageFont.truetype(FONT, 28)
    names = ImageFont.truetype(FONT_BOLD, 72)
    date_thai = ImageFont.truetype(FONT, 36)
    date_num = ImageFont.truetype(FONT_LATIN, 36)
    place = ImageFont.truetype(FONT, 28)

    for sprite, x in (("groom.png", 78), ("bride.png", 978)):
        art = Image.open(ROOT / "public/sprites" / sprite).convert("RGBA")
        art = art.resize((int(art.size[0] * 1.35), int(art.size[1] * 1.35)), Image.Resampling.NEAREST)
        image.paste(art, (x, 168), art)

    draw.text((600, 168), "งานมงคลสมรส", font=small, fill=(176, 69, 88), anchor="mm")
    names_latin = ImageFont.truetype(FONT_LATIN, 72)
    draw_centered(
        draw,
        272,
        [("อ๋อง  ", names), ("&", names_latin), ("  แทตตี้", names)],
        (42, 38, 35),
    )
    draw.line((460, 340, 740, 340), fill=(224, 184, 154), width=2)
    draw_centered(
        draw,
        382,
        [("5 ", date_num), ("ธันวาคม ", date_thai), ("2570", date_num)],
        (42, 38, 35),
    )
    draw.text((600, 468), "โบสถ์แม่พระฟาติมา  ดินแดง", font=place, fill=(90, 78, 70), anchor="mm")

    image.save(OUT, optimize=True)
    print("wrote", OUT, image.size)


if __name__ == "__main__":
    main()
