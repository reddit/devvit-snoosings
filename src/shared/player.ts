import type {XY} from './2d.js'
import type {T2} from './tid.js'
import type {UUID} from './uuid.js'

export type Player = {
  /** player direction. 0, 0 if not moving. */
  dir: XY
  /** flip player render horizontally. */
  flip: boolean
  instrument: Instrument
  melody: Melody
  /** player username. eg, spez. */
  name: string
  /** Pentatonic tonal scale offset. */
  scale: number
  /** avatar image URL. */
  snoovatarURL: string
  /** player user ID. t2_0 for anons. */
  t2: T2
  /** player UUIDv4. always favor this for comparisons if anon is possible. */
  uuid: UUID
  /** player position. */
  xy: XY
}

export type Instrument = 'clapper' | 'jazzman'

/** up to 24 x and -. each represents a note for an eighth second window. */
export type Melody = string
