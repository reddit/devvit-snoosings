import type {XY} from './2d.js'

export type Player = {
  /** player direction. 0, 0 if not moving. */
  dir: XY
  /** player username. eg, spez. */
  name: string
  /** player user ID. t2_0 for anons. */
  t2: string
  /** player position. */
  xy: XY
  /** player UUIDv4. always favor this for comparisons if t2_0 is possible. */
  uuid: string
}
