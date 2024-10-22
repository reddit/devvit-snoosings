import {describe, expect, test} from 'vitest'
import {Melody, melodyEncode, melodySlot} from './melody.js'

describe('melodyEncode()', () => {
  test('encode full melody', () => {
    const player = {melody: Melody()}
    melodyEncode(player, 0, 0)
    expect(player.melody).toBe('A-------')
    melodyEncode(player, 1, 500)
    expect(player.melody).toBe('AB------')
    melodyEncode(player, 2, 1000)
    expect(player.melody).toBe('ABC-----')
    melodyEncode(player, 3, 1500)
    expect(player.melody).toBe('ABCD----')
    melodyEncode(player, 4, 2000)
    expect(player.melody).toBe('ABCDE---')
    melodyEncode(player, 5, 2500)
    expect(player.melody).toBe('ABCDEF--')
    melodyEncode(player, 6, 3000)
    expect(player.melody).toBe('ABCDEFG-')
    melodyEncode(player, 7, 3500)
    expect(player.melody).toBe('ABCDEFGH')
  })

  test('wrap', () => {
    const player = {melody: Melody()}
    melodyEncode(player, 0, 4000)
    expect(player.melody).toBe('A-------')
    melodyEncode(player, 1, 4500)
    expect(player.melody).toBe('AB------')
  })

  test('overwrite', () => {
    const player = {melody: Melody()}
    melodyEncode(player, 0, 4000)
    expect(player.melody).toBe('A-------')
    melodyEncode(player, 1, 4100)
    expect(player.melody).toBe('B-------')
  })
})

test('melodySlot()', () => {
  expect(melodySlot(0)).toBe(0)
  expect(melodySlot(100)).toBe(0)
  expect(melodySlot(500)).toBe(1)
  expect(melodySlot(501)).toBe(1)
  expect(melodySlot(3999)).toBe(7)
  expect(melodySlot(4000)).toBe(0)
  expect(melodySlot(4100)).toBe(0)
  expect(melodySlot(4500)).toBe(1)
  expect(melodySlot(4999)).toBe(1)
})
