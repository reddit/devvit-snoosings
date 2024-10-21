import {type XY, magnitude, xyCloseTo, xyLerp, xySub} from '../shared/2d.js'
import type {PeerMessage} from '../shared/message.js'
import type {Player} from '../shared/player.js'
import {anonSnoovatarURL, anonUsername, noT2} from '../shared/tid.js'
import {type Assets, loadSnoovatar, snoovatarMaxWH} from './assets.js'
import type {Button, Input} from './input/input.js'
import {green} from './palette.js'

export type LocalPlayer = Player & {
  peered: {at: number}
  snoovatarImg: HTMLImageElement
}

export type P1 = LocalPlayer & {
  peered: {at: number; dir: XY; xy: XY}
}

export type Peer = LocalPlayer & {
  lerpTo?: XY & {peered: {at: number}}
}

const pxPerSec: number = 30

export function P1(assets: Readonly<Assets>, lvlWH: Readonly<XY>): P1 {
  return {
    dir: {x: 0, y: 0},
    flip: false,
    peered: {at: 0, dir: {x: 0, y: 0}, xy: {x: 0, y: 0}},
    name: anonUsername,
    snoovatarURL: anonSnoovatarURL,
    snoovatarImg: assets.anonSnoovatar,
    t2: noT2,
    uuid: crypto.randomUUID(),
    xy: {
      x:
        snoovatarMaxWH.x / 2 + Math.random() * (lvlWH.x - snoovatarMaxWH.x / 2),
      y: snoovatarMaxWH.y / 2 + Math.random() * (lvlWH.y - snoovatarMaxWH.y / 2)
    }
  }
}

export async function Peer(
  assets: Readonly<Assets>,
  peer: Peer | undefined,
  msg: PeerMessage
): Promise<Peer> {
  let snoovatarImg = peer?.snoovatarImg // try cache.
  if (!snoovatarImg)
    try {
      snoovatarImg = await loadSnoovatar(assets, msg.player)
    } catch {
      snoovatarImg = assets.anonSnoovatar
    }
  return {
    dir: msg.player.dir,
    peered: {at: performance.now()},
    flip: msg.player.flip,
    lerpTo: {
      x: msg.player.xy.x,
      y: msg.player.xy.y,
      peered: {at: peer?.peered.at ?? 0}
    },
    name: msg.player.name,
    snoovatarURL: msg.player.snoovatarURL,
    snoovatarImg,
    t2: msg.player.t2,
    uuid: msg.player.uuid,
    xy: peer?.xy ?? msg.player.xy // use stale xy and lerp to it.
  }
}

export function updateP1(p1: P1, ctrl: Input<Button>, tick: number): void {
  const point = !ctrl.handled && ctrl.point && ctrl.isOn('A')
  p1.dir = point ? xySub(ctrl.point, p1.xy) : {x: 0, y: 0}
  if (point) ctrl.handled = true
  const mag = magnitude(p1.dir) || 0
  if (mag < 4) {
    p1.dir.x = 0
    p1.dir.y = 0
  } else {
    p1.dir.x /= mag
    p1.dir.y /= mag
  }
  updatePlayer(p1, tick)
}

export function updatePeer(peer: Peer, tick: number): void {
  if (peer.lerpTo) {
    // this needs to take time into account. the move player function actually does the trajectory stuff.
    peer.xy = xyLerp(peer.xy, peer.lerpTo, 0.1)

    if (xyCloseTo(peer.xy, peer.lerpTo, 1)) {
      peer.xy = peer.lerpTo
      // biome-ignore lint/performance/noDelete:
      delete peer.lerpTo
    }
  } else updatePlayer(peer, tick)
}

export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Readonly<LocalPlayer>
): void {
  if (player.snoovatarImg.naturalWidth && player.snoovatarImg.naturalHeight) {
    const scale = snoovatarMaxWH.y / player.snoovatarImg.naturalHeight
    const scaledWH = {
      w: player.snoovatarImg.naturalWidth * scale,
      h: player.snoovatarImg.naturalHeight * scale
    }
    const flip = player.flip ? -1 : 1
    ctx.save()
    ctx.scale(flip, 1)
    ctx.drawImage(
      player.snoovatarImg,
      (player.xy.x - scaledWH.w / 2) * flip,
      player.xy.y - scaledWH.h,
      scaledWH.w * flip,
      scaledWH.h
    )
    ctx.restore()
  } else {
    const radius = 8
    ctx.beginPath()
    ctx.arc(player.xy.x, player.xy.y - radius * 2, radius, 0, 2 * Math.PI)
    ctx.fillStyle = 'green'
    ctx.fill()
  }

  // i think this should be like in the bottom bar where you beat your bk chest

  ctx.fillStyle = 'black'
  const text = player.name
  const dims = ctx.measureText(text)
  const textX = Math.trunc(player.xy.x) - dims.width / 2
  const textY =
    Math.trunc(player.xy.y) +
    dims.fontBoundingBoxAscent +
    dims.fontBoundingBoxDescent
  ctx.strokeStyle = green // just make sure there's contrast if drawing over someone
  ctx.lineWidth = 4
  ctx.strokeText(text, textX, textY)
  ctx.fillText(text, textX, textY)
}

function updatePlayer(player: LocalPlayer, tick: number): void {
  const secs = tick / 1_000
  const {dir} = player
  if (dir.x) {
    player.xy.x += secs * pxPerSec * dir.x
    player.flip = dir.x < 0
  }
  if (dir.y) player.xy.y += secs * pxPerSec * dir.y
}
