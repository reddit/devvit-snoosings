import {type XY, angleBetween, magnitude, xySub} from '../shared/2d.js'
import type {
  AppMessage,
  PeerMessage,
  WebViewMessage
} from '../shared/message.js'
import type {Player} from '../shared/player.js'
import type {UUID} from '../shared/uuid.js'
import {Cam} from './cam.js'
import {Input} from './input/input.js'
import {Looper} from './looper.js'
import {P1, Peer, renderPlayer, updateP1, updatePeer} from './player.js'
import {cachedImg} from './utils/image.js'
import {throttle} from './utils/throttle.js'

const lvlWH: XY = {x: 512, y: 512}

const heartbeatPeriodMillis: number = 9_000
const heartbeatThrottleMillis: number = 300
const disconnectMillis: number = 30_000

export class Game {
  #cam: Cam
  #ctrl: Input<'A'>
  #debug: boolean = false
  #looper: Looper
  #msgID: number = -1 // initialized to 0 in app.
  #p1: P1 = P1(lvlWH)
  /** connected peers and possibly p1. */
  #players: {[uuid: UUID]: Peer} = {}

  constructor() {
    console.log('snoosings')

    const canvas = Canvas()

    initDoc(canvas)

    this.#cam = new Cam()
    this.#ctrl = new Input(this.#cam, canvas)
    this.#ctrl.mapClick('A', 1)

    this.#looper = new Looper(canvas, this.#cam, this.#ctrl)
  }

  start(): void {
    addEventListener('message', this.#onMessage)
    this.#looper.register('add')
    this.#looper.loop = this.#onLoop
  }

  #onLoop = (): void => {
    this.#update()

    const now = this.#looper.time ?? performance.now()
    if (now - this.#p1.peered.at > heartbeatPeriodMillis)
      this.#postPeerUpdate(now)

    this.#looper.loop = this.#onLoop
  }

  #onMessage = (
    ev: MessageEvent<
      {type: 'stateUpdate'; data: AppMessage} | {type: undefined}
    >
  ): void => {
    if (ev.data.type !== 'stateUpdate') return // hack: filter unknown messages.

    let msg: AppMessage | PeerMessage = ev.data.data

    // hack: filter repeat messages.
    if (msg.id <= this.#msgID) return
    this.#msgID = msg.id

    // unwrap peer messages into standard messages once ID check is done.
    if (msg.type === 'Peer') msg = msg.msg

    // if (this.#debug) console.log(`Game.onMessage=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'Connected':
        this.#players[this.#p1.uuid] = this.#p1
        break

      case 'Disconnected':
        delete this.#players[this.#p1.uuid]
        break

      case 'LocalRuntimeLoaded':
        this.#debug = msg.debug
        if (this.#debug) console.log(this)
        this.#p1.t2 = msg.p1.t2
        this.#p1.name = msg.p1.name
        this.#p1.snoovatarURL = msg.p1.snoovatarURL
        this.#p1.snoovatarImg = cachedImg(msg.p1)
        postMessage({type: 'WebViewLoaded', uuid: this.#p1.uuid})
        break

      case 'PeerUpdate':
        if (this.#debug) console.log('on peer update')
        this.#players[msg.player.uuid] = Peer(
          this.#players[msg.player.uuid],
          msg
        )
        break

      default:
        msg satisfies never
    }
  }

  #update(): void {
    const {canvas, ctx, tick} = this.#looper
    if (!ctx) return

    const now = this.#looper.time ?? performance.now()

    canvas.width = innerWidth // what about world not resizing
    canvas.height = innerHeight
    ctx.fillStyle = 'pink'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const connected = !!this.#players[this.#p1.uuid]
    if (!connected) {
      ctx.fillStyle = 'black'
      ctx.fillText('Disconnected', 10, 10)
    }

    updateP1(this.#p1, this.#ctrl, tick)
    const angle = angleBetween(this.#p1.dir, this.#p1.peered.dir)
    const mag = magnitude(xySub(this.#p1.xy, this.#p1.peered.xy))
    if (angle > 0.05 || mag > 50) this.#postPeerUpdate(now)

    for (const player of Object.values(this.#players))
      if (player.uuid !== this.#p1.uuid) {
        if (now - player.peered.at > disconnectMillis) {
          this.#playerDisconnected(player)
          continue
        }

        updatePeer(player, tick)
        renderPlayer(ctx, player)
      }

    // render p1 last so they're always on top.
    renderPlayer(ctx, this.#p1)
  }

  #playerDisconnected(player: Player): void {
    delete this.#players[player.uuid]
  }

  #postPeerUpdate = throttle((now: number): void => {
    if (this.#debug) console.log('post peer update')
    this.#p1.peered = {at: now, xy: {...this.#p1.xy}, dir: {...this.#p1.dir}}
    postMessage({
      peer: true,
      player: {
        dir: this.#p1.dir,
        flip: this.#p1.flip,
        name: this.#p1.name,
        snoovatarURL: this.#p1.snoovatarURL,
        t2: this.#p1.t2,
        uuid: this.#p1.uuid,
        xy: this.#p1.xy
      },
      type: 'PeerUpdate'
    })
  }, heartbeatThrottleMillis)
}

function Canvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 0 // guarantee resize().

  // to-do: make a nice cursor.
  // canvas.style.cursor = 'none'
  canvas.style.display = 'block' // no line height spacing.

  // update on each pointermove *touch* Event like *mouse* Events.
  canvas.style.touchAction = 'none'
  return canvas
}

function initDoc(canvas: HTMLCanvasElement): void {
  const meta = document.createElement('meta')
  meta.name = 'viewport'
  // don't wait for double-tap scaling on mobile.
  meta.content = 'maximum-scale=1, minimum-scale=1, user-scalable=no'
  document.head.appendChild(meta)

  document.body.style.margin = '0'
  document.body.style.width = '100vw'
  document.body.style.height = '100vh'
  document.body.style.overflow = 'hidden'

  document.body.append(canvas)
}

function postMessage(msg: WebViewMessage): void {
  parent.postMessage(msg, document.referrer)
}
