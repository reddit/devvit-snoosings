import {wrap} from '../../shared/math.js'
import {melodyLen, melodyMillis} from '../../shared/serial.js'
import type {Assets} from '../assets.js'
import {
  melodyBufferPeek,
  melodyBufferRead,
  melodyGet,
  melodyRecordBeat
} from '../types/melody-buffer.js'
import type {UTCMillis} from '../types/time.js'
import {halfSpace, quarterSpace, space} from '../utils/layout.js'
import {panelH} from './panel.js'
import type {P1} from './player.js'

export function renderMetronome(
  ctx: CanvasRenderingContext2D,
  p1: P1,
  now: UTCMillis,
  assets: Readonly<Assets>
): void {
  const beat = melodyRecordBeat(now)

  const horizontalY = 638 / 2
  const w = ((481 / 2) * ctx.canvas.width) / 756
  {
    ctx.save()
    const x = ((511 / 2) * ctx.canvas.width) / 756

    ctx.beginPath()
    ctx.rect(x, 0, w, ctx.canvas.height)
    ctx.clip()

    const img = assets.images.metronomeHorizontal
    ctx.drawImage(
      img,
      x - ((now % melodyMillis) / melodyMillis) * w,
      horizontalY,
      w * 2,
      11 / 2
    )
    ctx.restore()
  }

  const x = (ctx.canvas.width - w) / 2
  const h = space * 2
  const y = ctx.canvas.height - panelH - (h + halfSpace)

  ctx.strokeStyle = 'black'
  const dividerW = w / melodyLen
  for (let i = 0; i < melodyLen; i++) {
    const even = (i & 1) === 0
    const offset = wrap(
      w / 2 + -((now % melodyMillis) / melodyMillis) * w + i * dividerW,
      0,
      w
    )

    const line = assets.images[even ? 'metronomeDownbeat' : 'metronomeUpbeat']
    ctx.drawImage(
      line,
      offset + x - line.naturalWidth / 4,
      horizontalY - line.naturalHeight / 4,
      line.naturalWidth / 2,
      line.naturalHeight / 2
    )

    if (i === 0) {
      const clef = assets.images.metronomeClef
      ctx.drawImage(
        clef,
        offset + x - clef.naturalWidth / 4,
        horizontalY + quarterSpace,
        clef.naturalWidth / 2,
        clef.naturalHeight / 2
      )
    }
    if (
      (i <= beat && i > (beat - melodyLen / 2) % melodyLen) ||
      (beat < melodyLen / 2 && i > beat + melodyLen / 2)
    ) {
      const peek = i <= beat && i > (beat - melodyLen / 2) % melodyLen
      const melody = peek
        ? melodyBufferPeek(p1.melody)
        : melodyBufferRead(p1.melody)
      const tone = melodyGet(melody, i)
      if (tone != null) {
        const text = '·' //fix me. should be a mapping of 'sing!' to colored shape.
        const dims = ctx.measureText(text)
        ctx.fillText(
          text,
          offset + x - dims.width / 2,
          y - (space + quarterSpace)
        )
      }
    }
  }
}
