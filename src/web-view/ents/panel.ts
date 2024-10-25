import {type XY, boxHits} from '../../shared/2d.js'
import type {Tone} from '../../shared/serial.js'
import type {Assets} from '../assets.js'
import type {Button, Input} from '../input/input.js'
import type {UTCMillis} from '../types/time.js'
import {renderMetronome} from './metronome.js'
import type {P1} from './player.js'

export type Panel = {hit: number | undefined; tone: Tone | undefined}

export const panelH: number = 168
const buttonH = 168

export function Panel(): Panel {
  return {hit: undefined, tone: undefined}
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
  if (!hit) panel.hit = undefined
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

  const fifth = ctx.canvas.width / 5
  const tone = Math.trunc((ctrl.clientPoint.x - x) / fifth)
  panel.hit = tone
  panel.tone = tone as Tone
}

export function renderPanel(
  ctx: CanvasRenderingContext2D,
  panel: Readonly<Panel>,
  assets: Readonly<Assets>,
  p1: Readonly<P1>,
  now: UTCMillis
): void {
  ctx.drawImage(assets.images.tv, 0, 0, ctx.canvas.width, ctx.canvas.height)

  const {x} = xy(ctx)

  const letters = [
    assets.images.buttonS,
    assets.images.buttonI,
    assets.images.buttonN,
    assets.images.buttonG,
    assets.images.buttonBang
  ]
  const w = ctx.canvas.width / letters.length
  if (panel.hit != null) console.log(panel.hit)
  for (let i = 0; i < letters.length; i++) {
    if (panel.hit === i) continue
    ctx.drawImage(
      letters[i]!,
      x + i * w,
      ctx.canvas.height - buttonH,
      w,
      buttonH
    )
  }

  renderMetronome(ctx, p1, now)
}

function xy(ctx: CanvasRenderingContext2D): XY {
  return {x: 0, y: Math.trunc(ctx.canvas.height - panelH)}
}
