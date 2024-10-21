import {type XY, boxHits} from '../shared/2d.js'
import type {Button, Input} from './input/input.js'

export type Panel = {sing: boolean}

const buttonWH: Readonly<XY> = {x: 192, y: 64}

export function Panel(): Panel {
  return {sing: false}
}

export function updatePanel(
  panel: Panel,
  ctx: CanvasRenderingContext2D,
  ctrl: Input<Button>
): void {
  if (
    ctrl.handled ||
    // the initial click must be inside the button.
    (!panel.sing && !ctrl.isOnStart('A'))
  ) {
    panel.sing = false
    return
  }
  const {x, y} = xy(ctx)
  panel.sing =
    ctrl.isOn('A') &&
    boxHits({x, y, w: buttonWH.x, h: buttonWH.y}, ctrl.clientPoint)
  ctrl.handled = panel.sing
}

export function renderPanel(
  ctx: CanvasRenderingContext2D,
  panel: Readonly<Panel>
): void {
  const {x, y} = xy(ctx)

  ctx.lineWidth = 2
  ctx.strokeStyle = 'brown'
  ctx.fillStyle = panel.sing ? 'yellowgreen' : 'grey'
  ctx.beginPath()
  ctx.roundRect(
    x + ctx.lineWidth,
    y + ctx.lineWidth,
    buttonWH.x - ctx.lineWidth * 2,
    buttonWH.y - ctx.lineWidth * 2,
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
  const textY = Math.trunc(top + buttonWH.y / 2 - height / 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = 'pink'
  ctx.strokeText(text, textX, textY)
  ctx.fillText(text, textX, textY)
}

function xy(ctx: CanvasRenderingContext2D): XY {
  const margin = 4
  const x = Math.trunc((ctx.canvas.width - buttonWH.x) / 2)
  const y = Math.trunc(ctx.canvas.height - buttonWH.y - margin)
  return {x, y}
}
