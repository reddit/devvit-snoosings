import {type XY, boxHits} from '../shared/2d.js'
import type {Button, Input} from './input/input.js'

export type Panel = {prevTone: number | undefined; tone: number | undefined}

const buttonH: number = 92

// to-do: rename to button.

export function Panel(): Panel {
  return {prevTone: undefined, tone: undefined}
}

export function updatePanel(
  panel: Panel,
  ctx: CanvasRenderingContext2D,
  ctrl: Input<Button>
): void {
  panel.prevTone = panel.tone
  const {x, y} = xy(ctx)
  if (
    ctrl.handled ||
    !ctrl.isOn('A') ||
    // the initial click must be inside the button.
    (panel.tone == null && !ctrl.isOnStart('A')) ||
    !boxHits({x, y, w: ctx.canvas.width, h: buttonH}, ctrl.clientPoint)
  ) {
    panel.tone = undefined
    return
  }

  const fifth = ctx.canvas.width / 5
  panel.tone = Math.trunc((ctrl.clientPoint.x - x) / fifth)
  ctrl.handled = true
}

export function renderPanel(
  ctx: CanvasRenderingContext2D,
  panel: Readonly<Panel>
): void {
  const {x, y} = xy(ctx)

  ctx.lineWidth = 2
  ctx.strokeStyle = 'brown'
  ctx.fillStyle = panel.tone != null ? 'yellowgreen' : 'grey'
  ctx.beginPath()
  ctx.roundRect(
    x + ctx.lineWidth,
    y + ctx.lineWidth,
    ctx.canvas.width - ctx.lineWidth * 2,
    buttonH - ctx.lineWidth * 2,
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
  const textY = Math.trunc(top + buttonH / 2 - height / 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = 'pink'
  ctx.strokeText(text, textX, textY)
  ctx.fillText(text, textX, textY)
}

function xy(ctx: CanvasRenderingContext2D): XY {
  return {x: 0, y: Math.trunc(ctx.canvas.height - buttonH)}
}
