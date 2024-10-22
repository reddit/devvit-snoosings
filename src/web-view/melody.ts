import {melodyLen, melodyMillis} from '../shared/player.js'

export const emptyMelody: string = '-'.repeat(melodyLen)

export function Melody(): string {
  return emptyMelody
}

export function melodySlot(time: number): number {
  return Math.trunc((time % melodyMillis) / (melodyMillis / melodyLen))
}

export function melodyDecode(melody: string, time: number): number | undefined {
  const slot = melodySlot(time)
  return melody[slot] === '-' ? undefined : melody[slot]!.charCodeAt(0) - 65
}

export function melodyEncode(
  player: {melody: string},
  tone: number | undefined,
  time: number
): void {
  const slot = melodySlot(time)
  const note = tone == null ? '-' : String.fromCodePoint(65 + tone)
  const split = player.melody.split('')
  split.splice(slot, 1, note)
  player.melody = split.join('')
}
