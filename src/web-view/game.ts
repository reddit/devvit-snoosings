import pkg from '../../package.json' with {type: 'json'}
import type {AppMessage, PeerMessage} from '../shared/message.js'
import type {Player} from '../shared/player.js'
import {anonT2, anonUsername} from '../shared/user.js'
import {postMessage} from './post-message.js'

const worldWH = {w: 1024, h: 1024}

export class Game {
  #debug: boolean = false
  /** connected players. */
  #players: {[uuid: string]: Player} = {}
  #player: Player = {
    dir: {x: 0, y: 0},
    name: anonUsername,
    t2: anonT2,
    xy: {x: Math.random() * worldWH.w, y: Math.random() * worldWH.h},
    uuid: crypto.randomUUID()
  }
  #msgID: number = -1
  #output: HTMLPreElement

  constructor() {
    console.log(`Reddit vs Zombies ${pkg.version}`)
    this.#output = document.querySelector<HTMLPreElement>('#stateOutput')!
    addEventListener('message', this.#onMessage)
  }

  #onMessage = (
    ev: MessageEvent<
      {type: 'stateUpdate'; data: AppMessage} | {type: undefined}
    >
  ): void => {
    if (ev.data.type !== 'stateUpdate') return

    let msg: AppMessage | PeerMessage = ev.data.data

    if (msg.id <= this.#msgID) return
    this.#msgID = msg.id

    // unwrap peer messages into standard messages once ID check is done.
    if (msg.type === 'Peer') msg = msg.msg

    // if (this.#debug) console.log(`Game.onMessage=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'LocalPlayerConnected':
        this.#players[this.#player.uuid] = this.#player
        postMessage({
          peer: true,
          type: 'RemotePlayerConnected',
          player: {
            dir: this.#player.dir,
            xy: this.#player.xy,
            name: this.#player.name,
            t2: this.#player.t2,
            uuid: this.#player.uuid
          }
        })
        break

      case 'LocalPlayerDisconnected':
        delete this.#players[this.#player.uuid]
        break

      case 'LocalRuntimeLoaded':
        this.#debug = msg.debug
        this.#player.t2 = msg.player.t2
        this.#player.name = msg.player.name
        postMessage({type: 'WebViewLoaded'})
        break

      case 'RemotePlayerConnected':
        this.#players[msg.player.uuid] = msg.player
        break

      default:
        msg satisfies never
    }
    this.#render()
  }

  #render(): void {
    this.#output.replaceChildren(
      JSON.stringify({players: this.#players}, undefined, 2)
    )
  }
}
