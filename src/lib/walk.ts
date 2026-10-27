export type Stop = {
  x: number
  y: number
  wait: number
}

export type WalkPose = {
  x: number
  y: number
  facing: 1 | -1
  walking: boolean
  hop: number
}

type Beat =
  | { kind: "walk"; x0: number; y0: number; x1: number; y1: number; len: number; duration: number }
  | { kind: "wait"; x: number; y: number; facing: 1 | -1; duration: number }

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay)
}

function buildBeats(stops: Stop[], speed: number): { beats: Beat[]; cycle: number } {
  if (stops.length === 0) {
    return { beats: [{ kind: "wait", x: 0, y: 0, facing: 1, duration: 1 }], cycle: 1 }
  }
  if (stops.length === 1) {
    return {
      beats: [{ kind: "wait", x: stops[0].x, y: stops[0].y, facing: 1, duration: 8 }],
      cycle: 8,
    }
  }

  const beats: Beat[] = []
  for (let i = 0; i < stops.length; i++) {
    const a = stops[i]
    const b = stops[(i + 1) % stops.length]
    const len = Math.max(dist(a.x, a.y, b.x, b.y), 1)
    beats.push({
      kind: "walk",
      x0: a.x,
      y0: a.y,
      x1: b.x,
      y1: b.y,
      len,
      duration: len / speed,
    })
    beats.push({
      kind: "wait",
      x: b.x,
      y: b.y,
      facing: b.x >= a.x ? 1 : -1,
      duration: Math.max(b.wait, 0),
    })
  }

  const cycle = beats.reduce((sum, beat) => sum + beat.duration, 0)
  return { beats, cycle: Math.max(cycle, 0.01) }
}

export function poseOnPath(stops: Stop[], speed: number, time: number, stride = 11): WalkPose {
  const { beats, cycle } = buildBeats(stops, speed)
  let t = ((time % cycle) + cycle) % cycle
  let traveled = 0

  for (const beat of beats) {
    if (t > beat.duration) {
      t -= beat.duration
      if (beat.kind === "walk") traveled += beat.len
      continue
    }

    if (beat.kind === "wait") {
      return { x: beat.x, y: beat.y, facing: beat.facing, walking: false, hop: 0 }
    }

    const p = beat.duration > 0 ? t / beat.duration : 1
    const dx = beat.x1 - beat.x0
    const x = beat.x0 + dx * p
    const y = beat.y0 + (beat.y1 - beat.y0) * p
    const facing: 1 | -1 = dx < -0.4 ? -1 : 1
    const along = traveled + beat.len * p
    const hop = Math.abs(Math.sin((along / stride) * Math.PI)) * 3.4
    return { x, y, facing, walking: true, hop }
  }

  const last = stops[stops.length - 1]
  return { x: last.x, y: last.y, facing: 1, walking: false, hop: 0 }
}
