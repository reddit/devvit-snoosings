import {describe, expect, test} from 'vitest'
import {calculatePentatonicPlaybackRate} from './audio.js'

describe('pentatonicPlaybackRate()', () => {
  test('should return correct playback rate for positive scaleStep', () => {
    expect(calculatePentatonicPlaybackRate(0)).toBeCloseTo(1)
    expect(calculatePentatonicPlaybackRate(1)).toBeCloseTo(1.12246)
    expect(calculatePentatonicPlaybackRate(5)).toBeCloseTo(2)
    expect(calculatePentatonicPlaybackRate(6)).toBeCloseTo(2.24492)
    expect(calculatePentatonicPlaybackRate(10)).toBeCloseTo(4)
  })

  test('should return correct playback rate for negative scaleStep', () => {
    expect(calculatePentatonicPlaybackRate(-1)).toBeCloseTo(0.8409)
    expect(calculatePentatonicPlaybackRate(-5)).toBeCloseTo(0.5)
    expect(calculatePentatonicPlaybackRate(-6)).toBeCloseTo(0.4204)
    expect(calculatePentatonicPlaybackRate(-10)).toBeCloseTo(0.25)
  })
})
