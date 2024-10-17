import type {XY} from './xy.js'

/** a window message from the app to the web view. */
export type AppMessage =
  | {type: 'Update'; lastUpdate: number}
  | {type: 'Pong'}
  | {type: 'Connected'}
  | PeerMessage

/** a realtime message from another instance. */
export type PeerMessage = {peer: true; type: 'NewPlayer'; xy: XY}

/** a window message from the web view to the app. */
export type WebViewMessage =
  | ({peer?: boolean} & ({type: 'Ping'} | {type: 'Loaded'}))
  | PeerMessage
