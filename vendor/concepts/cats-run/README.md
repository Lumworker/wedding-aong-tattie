# cats-run concept (loading splash)

Drop the approved art from art work here, then run `python3 scripts/build-cats-run.py`.

- `frame-1.png` … `frame-8.png` (one image per frame), or `sheet.png` (8 frames side by side, equal widths)
- Solid flat **magenta #FF00FF** background — neither cat has that colour, so it keys out cleanly
- Same camera, size and ground line in every frame; cats running to the right
- The script keys the background, crops all frames with one box (keeps the bob), puts them on the
  2px grid with a shared 64-colour palette and a 1px outline, and writes `public/sprites/cats-run.png`
  (8 × 384×256, 4px gutter, 3108×264). Preview: `/tmp/cats-run-preview.gif`.
- Then bump `?v=` on `.cats-run` in `src/app/globals.css`.
