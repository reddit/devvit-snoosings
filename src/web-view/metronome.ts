import {wrap} from '../shared/math.js'
import {melodyLen, melodyMillis} from '../shared/player.js'

export function renderMetronome(
  ctx: CanvasRenderingContext2D,
  now: number
): void {
  const w = Math.min(256, ctx.canvas.width - 128)
  const x = (ctx.canvas.width - w) / 2
  const y = 48
  ctx.lineWidth = 2
  ctx.strokeStyle = 'black'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  ctx.strokeStyle = 'black'
  const dividerW = w / melodyLen
  for (let i = 0; i < melodyLen; i++) {
    const odd = (i & 1) === 1
    ctx.lineWidth = 1
    const offset = wrap(
      w / 2 + -((now % melodyMillis) / melodyMillis) * w + i * dividerW,
      0,
      w
    )

    ctx.beginPath()
    ctx.moveTo(offset + x, y - 8 - (odd ? 8 : 0))
    ctx.lineTo(offset + x, y + 8 + (odd ? 8 : 0))
    ctx.stroke()

    ctx.fillStyle = 'black'
    const text = `${i + 1}`
    const dims = ctx.measureText(text)
    ctx.fillText(text, offset + x - dims.width / 2, y - 18)
  }

  ctx.strokeStyle = 'red'
  const offset = w / 2
  ctx.beginPath()
  ctx.moveTo(x + offset, y - 24)
  ctx.lineTo(x + offset, y + 24)
  ctx.stroke()
}
