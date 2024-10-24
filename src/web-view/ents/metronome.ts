import {wrap} from '../../shared/math.js'
import {
  formattedInstrumentNote,
  melodyLen,
  melodyMillis
} from '../../shared/serial.js'
import {
  melodyBeat,
  melodyBufferPeek,
  melodyBufferRead,
  melodyGet
} from '../types/melody-buffer.js'
import type {UTCMillis} from '../types/time.js'
import {halfSpace, quarterSpace, space} from '../utils/layout.js'
import {panelH} from './panel.js'
import type {P1} from './player.js'

export function renderMetronome(
  ctx: CanvasRenderingContext2D,
  p1: P1,
  now: UTCMillis
): void {
  const h = space * 2
  const w = Math.min(256, ctx.canvas.width - 128)

  const x = (ctx.canvas.width - w) / 2
  const y = ctx.canvas.height - panelH - (h + halfSpace)
  ctx.lineWidth = 2
  ctx.strokeStyle = 'black'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  const beat = melodyBeat(now)

  ctx.strokeStyle = 'black'
  const dividerW = w / melodyLen
  for (let i = 0; i < melodyLen; i++) {
    const even = (i & 1) === 0
    ctx.lineWidth = 1
    const offset = wrap(
      w / 2 + -((now % melodyMillis) / melodyMillis) * w + i * dividerW,
      0,
      w
    )
    ctx.beginPath()
    ctx.moveTo(offset + x, y - 8 - (even ? 8 : 0))
    ctx.lineTo(offset + x, y + 8 + (even ? 8 : 0))
    ctx.stroke()

    ctx.fillStyle = 'black'
    ctx.font = `${i === beat ? '700 ' : ''}12px sans-serif`
    if (i === 0) {
      const text = '𝄞'
      const dims = ctx.measureText(text)
      ctx.fillText(
        text,
        offset + x - dims.width / 2,
        y + space + quarterSpace + dims.actualBoundingBoxAscent
      )
    }
    if (
      (i <= beat && i > (beat - melodyLen / 2) % melodyLen) ||
      (beat < melodyLen / 2 && i > beat + melodyLen / 2)
    ) {
      const melody =
        i <= beat && i > (beat - melodyLen / 2) % melodyLen
          ? melodyBufferPeek(p1.melody)
          : melodyBufferRead(p1.melody)
      const tone = melodyGet(melody, i) // base note is what I have, I get back 0-4
      if (tone != null) {
        const shift =
          pentatonicShift[
            (noteToPentatonicIndex[
              formattedInstrumentNote[
                p1.instrument
              ] as (typeof pentatonicShift)[number]
            ] +
              tone) %
              pentatonicShift.length
          ]!
        const text = shift
        const dims = ctx.measureText(text)
        ctx.fillText(
          text,
          offset + x - dims.width / 2,
          y - (space + quarterSpace)
        )
      }
    }
  }

  ctx.strokeStyle = 'red'
  const offset = w / 2
  ctx.beginPath()
  ctx.moveTo(x + offset, y - 24)
  ctx.lineTo(x + offset, y + 24)
  ctx.stroke()
}

const pentatonicShift = ['C', 'D', 'E', 'G', 'A'] as const
const noteToPentatonicIndex: {
  [key in (typeof pentatonicShift)[number]]: number
} = {C: 0, D: 1, E: 2, G: 3, A: 4}
