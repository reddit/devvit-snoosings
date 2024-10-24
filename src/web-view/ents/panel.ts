import {type XY, boxHits} from '../../shared/2d.js'
import type {Tone} from '../../shared/serial.js'
import type {Button, Input} from '../input/input.js'

export type Panel = {hit: boolean; tone: Tone | undefined}

export const panelH: number = 128

export function Panel(): Panel {
  return {hit: false, tone: undefined}
}

export function updatePanel(
  panel: Panel,
  ctx: CanvasRenderingContext2D,
  ctrl: Input<Button>
): void {
  if (ctrl.handled) return
  const {x, y} = xy(ctx)

  const hit =
    ctrl.isOn('A') &&
    boxHits({x, y, w: ctx.canvas.width, h: panelH}, ctrl.clientPoint)
  ctrl.handled = hit && ctrl.isOnStart('A')
  if (!hit) panel.hit = false
  if (
    !hit ||
    // the initial click must be inside the button.
    !ctrl.handled
  ) {
    // to-do: this is used to trigger tone on the rising edge. doesn't really
    // seem like the right place for it though.
    panel.tone = undefined
    return
  }

  panel.hit = hit
  const fifth = ctx.canvas.width / 5
  panel.tone = Math.trunc((ctrl.clientPoint.x - x) / fifth) as Tone
}

export function renderPanel(
  ctx: CanvasRenderingContext2D,
  panel: Readonly<Panel>
): void {
  const {x, y} = xy(ctx)

  const letters = ['s', 'i', 'n', 'g', '!']
  ctx.lineWidth = 2
  const w = (ctx.canvas.width - ctx.lineWidth) / letters.length
  for (let i = 0; i < letters.length; i++) {
    ctx.strokeStyle = 'brown'
    ctx.fillStyle = panel.hit ? 'yellowgreen' : 'grey'
    ctx.beginPath()
    ctx.roundRect(
      x + i * w + ctx.lineWidth,
      y + ctx.lineWidth,
      w,
      panelH - ctx.lineWidth * 2,
      4
    )
    ctx.fill()
    ctx.stroke()

    // to-do: cache some of these measurements and such
    ctx.fillStyle = 'black'
    ctx.font = '700 48px sans-serif'
    const dims = ctx.measureText(letters[i]!)
    const textX = Math.trunc(
      x + i * w + i * ctx.lineWidth + w / 2 - dims.width / 2
    )
    const top = y + ctx.lineWidth + dims.actualBoundingBoxAscent
    const height = dims.actualBoundingBoxAscent + dims.actualBoundingBoxDescent
    const textY = Math.trunc(top + panelH / 2 - height / 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'pink'
    ctx.strokeText(letters[i]!, textX, textY)
    ctx.fillText(letters[i]!, textX, textY)
  }
}

function xy(ctx: CanvasRenderingContext2D): XY {
  return {x: 0, y: Math.trunc(ctx.canvas.height - panelH)}
}
