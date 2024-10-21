import {clamp, closeTo, lerp} from './math.js'

export type Box = XY & {w: number; h: number}
export type XY = {x: number; y: number}

export function dotProduct(v0: Readonly<XY>, v1: Readonly<XY>): number {
  return v0.x * v1.x + v0.y * v1.y
}

export function magnitude(v: Readonly<XY>): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

/** returns angle between vectors in radians [0, π]. */
export function angleBetween(v0: Readonly<XY>, v1: Readonly<XY>): number {
  const mag0 = magnitude(v0)
  const mag1 = magnitude(v1)
  if (!mag0 && !mag1) return 0
  return Math.acos(clamp(dotProduct(v0, v1) / (mag0 * mag1 || 1), -1, 1))
}

export function xyCloseTo(
  lhs: Readonly<XY>,
  rhs: Readonly<XY>,
  tolerance: number
): boolean {
  return closeTo(lhs.x, rhs.x, tolerance) && closeTo(lhs.y, rhs.y, tolerance)
}

export function xyLerp(
  start: Readonly<XY>,
  end: Readonly<XY>,
  ratio: number
): XY {
  return {x: lerp(start.x, end.x, ratio), y: lerp(start.y, end.y, ratio)}
}

export function xySub(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: lhs.x - rhs.x, y: lhs.y - rhs.y}
}
