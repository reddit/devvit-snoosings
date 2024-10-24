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

  ctx.lineWidth = 2
  ctx.strokeStyle = 'brown'
  ctx.fillStyle = panel.hit ? 'yellowgreen' : 'grey'
  ctx.beginPath()
  ctx.roundRect(
    x + ctx.lineWidth,
    y + ctx.lineWidth,
    ctx.canvas.width - ctx.lineWidth * 2,
    panelH - ctx.lineWidth * 2,
    4
  )
  ctx.fill()
  ctx.stroke()

  // to-do: cache some of these measurements and such
  ctx.fillStyle = 'black'
  ctx.font = '700 48px sans-serif'
  const text = 'sing'
  const dims = ctx.measureText(text)
  const textX = Math.trunc((ctx.canvas.width - dims.width) / 2)
  const top = y + ctx.lineWidth + dims.actualBoundingBoxAscent
  const height = dims.actualBoundingBoxAscent + dims.actualBoundingBoxDescent
  const textY = Math.trunc(top + panelH / 2 - height / 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = 'pink'
  ctx.strokeText(text, textX, textY)
  ctx.fillText(text, textX, textY)
}

function xy(ctx: CanvasRenderingContext2D): XY {
  return {x: 0, y: Math.trunc(ctx.canvas.height - panelH)}
}
