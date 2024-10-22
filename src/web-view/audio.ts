import type {Instrument} from '../shared/player.js'
import type {Assets} from './assets.js'

export type Audio = {
  ctx: AudioContext
  notes: {
    ba: AudioBuffer
    rg: AudioBuffer
    pop: AudioBuffer
    snap: AudioBuffer
    wa: AudioBuffer
  }
}

export const noteByInstrument: {
  [instrument in Instrument]: keyof Audio['notes']
} = {
  Bubbler: 'pop',
  Clapper: 'snap',
  Guzzler: 'rg',
  Jazzman: 'ba',
  Wailer: 'wa'
}

export async function Audio(assets: Readonly<Assets>): Promise<Audio> {
  const ctx = new AudioContext()
  const [ba, rg, pop, snap, wa] = await Promise.all([
    ctx.decodeAudioData(assets.notes.ba),
    ctx.decodeAudioData(assets.notes.rg),
    ctx.decodeAudioData(assets.notes.pop),
    ctx.decodeAudioData(assets.notes.snap),
    ctx.decodeAudioData(assets.notes.wa)
  ])
  return {ctx, notes: {ba, rg, pop, snap, wa}}
}

export function play(
  ctx: AudioContext,
  buf: AudioBuffer,
  scale: number,
  volume: number
): void {
  if (!volume) return
  if (ctx.state !== 'running') return // don't allow sounds to queue up.
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = calculatePentatonicPlaybackRate(scale)

  const gainNode = ctx.createGain()
  gainNode.gain.value = volume
  src.connect(gainNode).connect(ctx.destination)
  src.start()
}

export function calculatePentatonicPlaybackRate(scale: number): number {
  const pentatonicSemitones = [0, 2, 4, 7, 9]
  const len = pentatonicSemitones.length
  const octave = Math.floor(scale / len)
  const semitone =
    pentatonicSemitones[((scale % len) + len) % len]! + 12 * octave
  return 2 ** (semitone / 12)
}
