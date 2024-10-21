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

export function play(
  ctx: AudioContext,
  buf: AudioBuffer,
  semitones: number
): void {
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = 2 ** (semitones / 12)
  src.connect(ctx.destination)
  src.start()
}
