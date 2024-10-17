import type {AppMessage, PeerMessage} from '../shared/message.js'
import type {Player} from '../shared/player.js'
import {anonT2, anonUsername} from '../shared/user.js'
import {postMessage} from './post-message.js'

const worldWH = {w: innerWidth, h: innerHeight}

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
  #canvas: HTMLCanvasElement

  constructor() {
    console.log('Reddit vs Zombies')

    const meta = document.createElement('meta')
    meta.name = 'viewport'
    // don't wait for double-tap scaling on mobile.
    meta.content = 'maximum-scale=1, minimum-scale=1, user-scalable=no'
    document.head.appendChild(meta)

    document.body.style.margin = '0'
    document.body.style.width = '100vw'
    document.body.style.height = '100vh'
    document.body.style.overflow = 'hidden'

    const canvas = document.createElement('canvas')
    canvas.width = 0 // guarantee resize().
    canvas.style.cursor = 'none'
    canvas.style.display = 'block' // no line height spacing.
    // canvas.style.imageRendering = 'pixelated'
    // update on each pointermove *touch* Event like *mouse* Events.
    canvas.style.touchAction = 'none'
    document.body.append(canvas)

    this.#canvas = canvas

    addEventListener('message', this.#onMessage)
    requestAnimationFrame(now => this.#onFrame(now, performance.now()))
  }

  #onFrame = (now: number, then: number): void => {
    if (now - this.#playerOne.heartbeat > 1_000) {
      this.#playerOne.heartbeat = now
      postMessage({
        type: 'RemotePlayerHeartbeat',
        peer: true,
        player: this.#playerOne // to-do: strip heartbeat.
      })
    }
    this.#render(now)
    requestAnimationFrame(then => this.#onFrame(then, now))
  }

  #onMessage = (
    ev: MessageEvent<
      {type: 'stateUpdate'; data: AppMessage} | {type: undefined}
    >
  ): void => {
    if (ev.data.type !== 'stateUpdate') return // hack: filter unknown messages.

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

  #render(now: number): void {
    const ctx = this.#canvas.getContext('2d')
    if (!ctx) return

    this.#canvas.width = innerWidth
    this.#canvas.height = innerHeight
    ctx.fillStyle = 'pink'
    ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height)
    for (const player of Object.values(this.#players)) {
      if (
        now - player.heartbeat > 5_000 &&
        player.uuid !== this.#playerOne.uuid
      ) {
        this.#playerDisconnected(player)
        continue
      }
      renderPlayer(ctx, player, this.#playerOne.uuid)
    }
  }
}

function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Readonly<Player>,
  playerOneUUID: string
): void {
  const radius = 8
  ctx.beginPath()
  ctx.arc(player.xy.x, player.xy.y, radius, 0, 2 * Math.PI)
  ctx.fillStyle = playerOneUUID === player.uuid ? 'green' : 'blue'
  ctx.fill()

  const text = player.name
  const textX = player.xy.x - ctx.measureText(text).width / 2
  const textY = player.xy.y + radius * 2
  ctx.fillText(text, textX, textY)
}
