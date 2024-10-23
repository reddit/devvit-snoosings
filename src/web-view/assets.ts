import type {XY} from '../shared/2d.js'
import type {Instrument} from '../shared/serial.js'
import {type T2, anonSnoovatarURL, noT2} from '../shared/tid.js'
import {loadImage} from './utils/image.js'

export type Assets = {
  readonly anonSnoovatar: HTMLImageElement
  readonly grass: HTMLImageElement
  readonly instruments: {readonly [instrument in Instrument]: ArrayBuffer}
  p1: HTMLImageElement
}

export const snoovatarMaxWH: Readonly<XY> = {x: 64, y: 64}

export async function Assets(): Promise<Assets> {
  const [anonSnoovatar, grass, Bubbler, Clapper, Jazzman, Rgggggg, Wailer] =
    await Promise.all([
      loadImage(anonSnoovatarURL),
      loadImage('assets/grass.png'),
      loadAudio('assets/pop.ogg'),
      loadAudio('assets/snap.ogg'),
      loadAudio('assets/ba.ogg'),
      loadAudio('assets/rg.ogg'),
      loadAudio('assets/wa.ogg')
    ])
  return {
    anonSnoovatar,
    grass,
    instruments: {Bubbler, Clapper, Jazzman, Rgggggg, Wailer},
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
  if (!rsp.ok) throw Error(`HTTP error ${rsp.status}: ${rsp.statusText}`)
  return await rsp.arrayBuffer()
}
