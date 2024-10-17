import type {Player} from './player.js'

/** a window message from the app to the web view. */
export type AppMessage = {
  /**
   * hack: every app render posts a message. the ID allows the web view to
   * ignore previously sent messages.
   */
  id: number
} & NoIDAppMessage

export type NoIDAppMessage =
  | {type: 'LocalPlayerConnected'}
  | {type: 'LocalPlayerDisconnected'}
  /**
   * hack: the web view iframe is loaded immediately but the local runtime is
   * slow. wait until the local runtime is loaded before attempting any state
   * changes that drive messages that might be dropped.
   */
  | {
      type: 'LocalRuntimeLoaded'
      debug: boolean
      player: {t2: string; name: string}
    }
  | {type: 'Peer'; msg: PeerMessage}

/** a realtime message from another instance. */
export type PeerMessage = {
  peer: true
  player: Player
} & {type: 'RemotePlayerConnected'}

/** a window message from the web view to the app. */
export type WebViewMessage = {type: 'WebViewLoaded'} | PeerMessage
