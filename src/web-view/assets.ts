import type {XY} from '../shared/2d.js'
import {type T2, anonSnoovatarURL, noT2} from '../shared/tid.js'
import {loadImage} from './utils/image.js'

export type Assets = {
  anonSnoovatar: HTMLImageElement
  grass: HTMLImageElement
  notes: {
    ba: ArrayBuffer
    rg: ArrayBuffer
    pop: ArrayBuffer
    snap: ArrayBuffer
    wa: ArrayBuffer
  }
  p1: HTMLImageElement
}

export const snoovatarMaxWH: Readonly<XY> = {x: 64, y: 64}

export async function Assets(): Promise<Assets> {
  const [anonSnoovatar, grass, ba, pop, rg, snap, wa] = await Promise.all([
    loadImage(anonSnoovatarURL),
    loadImage('grass.png'),
    loadAudio('ba.ogg'),
    loadAudio('pop.ogg'),
    loadAudio('rg.ogg'),
    loadAudio('snap.ogg'),
    loadAudio('wa.ogg')
  ])
  return {
    anonSnoovatar,
    grass,
    notes: {ba, pop, snap, rg, wa},
    p1: anonSnoovatar
  }
}

export async function loadSnoovatar(
  assets: Readonly<Assets>,
  player: {snoovatarURL: string; t2: T2}
): Promise<HTMLImageElement> {
  return player.t2 === noT2
    ? assets.anonSnoovatar
    : loadImage(player.snoovatarURL)
}

async function loadAudio(url: string): Promise<ArrayBuffer> {
  const rsp = await fetch(url)
  if (!rsp.ok) throw Error(`HTTP error ${rsp.status} ${url}: ${rsp.statusText}`)
  return await rsp.arrayBuffer()
}
