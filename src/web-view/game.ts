import pkg from '../../package.json' with {type: 'json'}
import type {AppMessage, PeerMessage} from '../shared/message.js'
import type {Player} from '../shared/player.js'
import {anonT2, anonUsername} from '../shared/user.js'
import {postMessage} from './post-message.js'

const worldWH = {w: 1024, h: 1024}

export class Game {
  #debug: boolean = false
  /** connected players. */
  #players: {[uuid: string]: Player & {heartbeat: number}} = {}
  #playerOne: Player & {heartbeat: number} = {
    dir: {x: 0, y: 0},
    heartbeat: 0,
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
    requestAnimationFrame(now => this.#onFrame(now, performance.now()))
  }

  #onFrame = (now: number, then: number) => {
    if (now - this.#playerOne.heartbeat > 1_000) {
      this.#playerOne.heartbeat = now
      postMessage({
        type: 'RemotePlayerHeartbeat',
        peer: true,
        player: this.#playerOne // to-do: strip heartbeat.
      })
    }
    for (const player of Object.values(this.#players))
      if (
        now - player.heartbeat > 5_000 &&
        player.uuid !== this.#playerOne.uuid
      )
        this.#playerDisconnected(player)
    this.#render()
    requestAnimationFrame(then => this.#onFrame(then, now))
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
      case 'PlayerOneConnected':
        this.#players[this.#playerOne.uuid] = {
          ...this.#playerOne,
          heartbeat: performance.now()
        }
        break

      case 'PlayerOneDisconnected':
        delete this.#players[this.#playerOne.uuid]
        break

      case 'LocalRuntimeLoaded':
        this.#debug = msg.debug
        this.#playerOne.t2 = msg.player.t2
        this.#playerOne.name = msg.player.name
        postMessage({type: 'WebViewLoaded'})
        break

      case 'RemotePlayerHeartbeat':
        this.#players[msg.player.uuid] = {
          ...msg.player,
          heartbeat: performance.now()
        }
        break

      default:
        msg satisfies never
    }
  }

  #playerDisconnected(player: Player): void {
    delete this.#players[player.uuid]
  }

  #render(): void {
    this.#output.replaceChildren(
      JSON.stringify({players: this.#players}, undefined, 2)
    )
  }
}
