import type {Assets} from './assets.js'

export type Audio = {
  ctx: AudioContext
  notes: {
    ba: AudioBuffer
  }
}

export async function Audio(assets: Readonly<Assets>): Promise<Audio> {
  const ctx = new AudioContext()
  return {ctx, notes: {ba: await ctx.decodeAudioData(assets.notes.ba)}}
}

export function play(ctx: AudioContext, buf: AudioBuffer, scale: number): void {
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = calculatePentatonicPlaybackRate(scale)
  src.connect(ctx.destination)
  src.start()
}

export function calculatePentatonicPlaybackRate(scale: number): number {
  const pentatonicSemitones = [0, 2, 4, 7, 9]
  const len = pentatonicSemitones.length
  const octave = Math.floor(scale / len)
  const scaleIndex = ((scale % len) + len) % len // to-do: handle negative scales better.
  const semitones = pentatonicSemitones[scaleIndex]! + 12 * octave
  return 2 ** (semitones / 12)
}
