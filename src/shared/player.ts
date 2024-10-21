import type {XY} from './2d.js'
import type {T2} from './tid.js'
import type {UUID} from './uuid.js'

export type Player = {
  /** player direction. 0, 0 if not moving. */
  dir: XY
  /** flip player render horizontally. */
  flip: boolean
  instrument: Instrument
  melody: string
  /** player username. eg, spez. */
  name: string
  /** avatar image URL. */
  snoovatarURL: string
  /** player user ID. t2_0 for anons. */
  t2: T2
  /** player position. */
  xy: XY
  /** player UUIDv4. always favor this for comparisons if t2_0 is possible. */
  uuid: UUID
}

export type Instrument = 'jazzman'
