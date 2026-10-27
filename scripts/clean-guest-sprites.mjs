import sharp from "sharp"

const MALE =
  "/Users/aong/.cursor/projects/Users-aong-wedding-aong-tattie/assets/d1c2f4515a5c30df02bd1d69ed72f8a8-3b287738-1446-4ad5-826f-d39005e41dd1.jpg"
const FEMALE =
  "/Users/aong/.cursor/projects/Users-aong-wedding-aong-tattie/assets/02a50924213bf2ad9d798b0f48c7ca95-2d2cf573-45de-47a5-ad8f-576360763498.jpg"

function killSheet(r, g, b) {
  // olive cell fill
  if (Math.hypot(r - 100, g - 112, b - 108) < 34) return true
  // khaki / yellow frame
  if (Math.hypot(r - 144, g - 144, b - 116) < 34) return true
  if (Math.abs(r - g) < 22 && r > b + 14 && r > 110 && r < 175 && b > 85 && b < 145) return true
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 30 && max > 80 && max < 155 && b < 135 && g >= r - 12) return true
  return false
}

function isFringe(r, g, b) {
  if (killSheet(r, g, b)) return true
  // jpeg yellow/lime bleed outside silhouette
  if (r > 150 && g > 150 && b < 95) return true
  if (r > 165 && g > 155 && b < 115 && Math.abs(r - g) < 40) return true
  if (r < 45 && g < 45 && b < 45) return true
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 16 && max > 30 && max < 95) return true
  return false
}

async function processSheet(src, outFile, cols = 6, rows = 4, cellSize = 48) {
  const { data: px, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const H = info.height
  const ch = info.channels
  const cellW = W / cols
  const cellH = H / rows
  const alpha = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i += 1) {
    const o = i * ch
    alpha[i] = killSheet(px[o], px[o + 1], px[o + 2]) ? 0 : 255
  }

  const sprites = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x0 = Math.round(col * cellW)
      const y0 = Math.round(row * cellH)
      const x1 = Math.round((col + 1) * cellW)
      const y1 = Math.round((row + 1) * cellH)
      const cw = x1 - x0
      const chh = y1 - y0
      const local = new Int32Array(cw * chh)
      local.fill(-1)
      const comps = []

      for (let ly = 0; ly < chh; ly += 1) {
        for (let lx = 0; lx < cw; lx += 1) {
          const gi = (y0 + ly) * W + (x0 + lx)
          if (!alpha[gi] || local[ly * cw + lx] >= 0) continue
          const id = comps.length
          const stack = [ly * cw + lx]
          local[ly * cw + lx] = id
          let count = 0
          let minX = lx
          let minY = ly
          let maxX = lx
          let maxY = ly
          const pixels = []
          while (stack.length) {
            const p = stack.pop()
            const px_ = p % cw
            const py = (p / cw) | 0
            count += 1
            pixels.push(p)
            if (px_ < minX) minX = px_
            if (py < minY) minY = py
            if (px_ > maxX) maxX = px_
            if (py > maxY) maxY = py
            for (const [nx, ny] of [
              [px_ + 1, py],
              [px_ - 1, py],
              [px_, py + 1],
              [px_, py - 1],
            ]) {
              if (nx < 0 || ny < 0 || nx >= cw || ny >= chh) continue
              const ni = ny * cw + nx
              if (local[ni] >= 0) continue
              if (!alpha[(y0 + ny) * W + (x0 + nx)]) continue
              local[ni] = id
              stack.push(ni)
            }
          }
          comps.push({ count, minX, minY, maxX, maxY, pixels })
        }
      }

      if (!comps.length) {
        sprites.push(null)
        continue
      }

      comps.sort((a, b) => b.count - a.count)
      // Prefer denser blob if largest looks like a hollow frame
      let chosen = comps[0]
      for (const c of comps.slice(0, 3)) {
        const area = (c.maxX - c.minX + 1) * (c.maxY - c.minY + 1)
        const fill = c.count / Math.max(area, 1)
        const bestArea = (chosen.maxX - chosen.minX + 1) * (chosen.maxY - chosen.minY + 1)
        const bestFill = chosen.count / Math.max(bestArea, 1)
        if (fill > bestFill + 0.08 && c.count > chosen.count * 0.45) chosen = c
      }

      const keep = new Set(chosen.pixels)
      const ww = chosen.maxX - chosen.minX + 1
      const hh = chosen.maxY - chosen.minY + 1
      const buf = Buffer.alloc(ww * hh * 4)
      for (let y = 0; y < hh; y += 1) {
        for (let x = 0; x < ww; x += 1) {
          const li = (chosen.minY + y) * cw + (chosen.minX + x)
          if (!keep.has(li)) continue
          const gi = ((y0 + chosen.minY + y) * W + (x0 + chosen.minX + x)) * ch
          const di = (y * ww + x) * 4
          buf[di] = px[gi]
          buf[di + 1] = px[gi + 1]
          buf[di + 2] = px[gi + 2]
          buf[di + 3] = 255
        }
      }

      // Peel only fringe pixels on the silhouette edge
      for (let pass = 0; pass < 5; pass += 1) {
        const del = []
        for (let y = 0; y < hh; y += 1) {
          for (let x = 0; x < ww; x += 1) {
            const di = (y * ww + x) * 4
            if (buf[di + 3] < 8) continue
            let trans = 0
            for (const [nx, ny] of [
              [x + 1, y],
              [x - 1, y],
              [x, y + 1],
              [x, y - 1],
            ]) {
              if (nx < 0 || ny < 0 || nx >= ww || ny >= hh || buf[(ny * ww + nx) * 4 + 3] < 8) trans += 1
            }
            if (!trans) continue
            const r = buf[di]
            const g = buf[di + 1]
            const b = buf[di + 2]
            if (!isFringe(r, g, b)) continue
            // keep vivid clothes / skin on the edge
            const vivid = Math.max(r, g, b) - Math.min(r, g, b) > 70 && !(r > 150 && g > 150 && b < 100)
            const skin = r > 195 && g > 135 && g < 205 && b > 105 && b < 185 && r > g
            if (vivid || skin) continue
            del.push(di)
          }
        }
        for (const di of del) buf[di + 3] = 0
      }

      let tminX = ww
      let tminY = hh
      let tmaxX = -1
      let tmaxY = -1
      for (let y = 0; y < hh; y += 1) {
        for (let x = 0; x < ww; x += 1) {
          if (buf[(y * ww + x) * 4 + 3] < 8) continue
          if (x < tminX) tminX = x
          if (y < tminY) tminY = y
          if (x > tmaxX) tmaxX = x
          if (y > tmaxY) tmaxY = y
        }
      }
      if (tmaxX < 0) {
        sprites.push(null)
        continue
      }

      const tw = tmaxX - tminX + 1
      const th = tmaxY - tminY + 1
      const trimmed = Buffer.alloc(tw * th * 4)
      for (let y = 0; y < th; y += 1) {
        for (let x = 0; x < tw; x += 1) {
          const si = ((tminY + y) * ww + (tminX + x)) * 4
          const di = (y * tw + x) * 4
          trimmed[di] = buf[si]
          trimmed[di + 1] = buf[si + 1]
          trimmed[di + 2] = buf[si + 2]
          trimmed[di + 3] = buf[si + 3]
        }
      }

      const png = await sharp(trimmed, { raw: { width: tw, height: th, channels: 4 } })
        .resize(cellSize, cellSize, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          kernel: sharp.kernel.nearest,
        })
        .png()
        .toBuffer()
      sprites.push(png)
    }
  }

  const composites = []
  for (let i = 0; i < sprites.length; i += 1) {
    if (!sprites[i]) continue
    composites.push({
      input: sprites[i],
      left: (i % cols) * cellSize,
      top: Math.floor(i / cols) * cellSize,
    })
  }

  await sharp({
    create: {
      width: cols * cellSize,
      height: rows * cellSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outFile)

  console.log("wrote", outFile, composites.length)
}

await processSheet(MALE, "public/sprites/guests-male.png")
await processSheet(FEMALE, "public/sprites/guests-female.png")
