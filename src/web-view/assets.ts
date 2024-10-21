import type {XY} from '../shared/2d.js'
import {type T2, anonSnoovatarURL, noT2} from '../shared/tid.js'
import {loadImage} from './utils/image.js'

export type Assets = {
  anonSnoovatar: HTMLImageElement
  grass: HTMLImageElement
  notes: {ba: ArrayBuffer}
  p1: HTMLImageElement
}

export const snoovatarMaxWH: Readonly<XY> = {x: 64, y: 64}

export async function Assets(): Promise<Assets> {
  const [anonSnoovatar, grass, ba] = await Promise.all([
    loadImage(anonSnoovatarURL),
    loadImage('grass.png'),
    loadAudio('ba.ogg')
  ])
  return {anonSnoovatar, grass, notes: {ba}, p1: anonSnoovatar}
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
  if (!rsp.ok) throw Error(`HTTP error ${rsp.status}: ${rsp.statusText}`)
  return await rsp.arrayBuffer()
}
