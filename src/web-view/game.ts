import {type XY, angleBetween, magnitude, xySub} from '../shared/2d.js'
import type {
  AppMessage,
  PeerMessage,
  WebViewMessage
} from '../shared/message.js'
import {type Player, melodyMillis} from '../shared/player.js'
import type {UUID} from '../shared/uuid.js'
import {Assets, loadSnoovatar, snoovatarMaxWH} from './assets.js'
import {Audio, noteByInstrument, play} from './audio.js'
import {Cam} from './cam.js'
import {type Button, Input} from './input/input.js'
import {Looper} from './looper.js'
import {emptyMelody, melodyDecode, melodySlot} from './melody.js'
import {renderMetronome} from './metronome.js'
import {green} from './palette.js'
import {Panel, renderPanel, updatePanel} from './panel.js'
import {P1, Peer, renderPlayer, updateP1, updatePeer} from './player.js'
import {throttle} from './utils/throttle.js'

const lvlWH: XY = {x: 1024, y: 1024}

const heartbeatPeriodMillis: number = 9_000
const heartbeatThrottleMillis: number = 300
const disconnectMillis: number = 30_000

const version: number = 3

export class Game {
  static async new(): Promise<Game> {
    console.log(`snoosings v0.0.${version}`)
    // don't bother running if the base assets cannot load.
    const assets = await Assets()
    const audio = await Audio(assets)
    return new Game(assets, audio)
  }

  #assets: Assets
  #audio: Audio
  #cam: Cam
  #ctrl: Input<Button>
  #debug: boolean = false
  #looper: Looper
  #msgID: number = -1 // initialized to 0 in app.
  #p1: P1
  #panel: Panel = Panel()
  /** connected peers and possibly p1. */
  #players: {[uuid: UUID]: Peer} = {}
  #outdated: boolean = false

  private constructor(assets: Assets, audio: Audio) {
    this.#assets = assets
    this.#audio = audio
    this.#p1 = P1(assets, lvlWH)

    const canvas = Canvas()

    initDoc(canvas)

    this.#cam = new Cam()
    this.#ctrl = new Input(this.#cam, canvas)
    this.#ctrl.mapClick('A', 1)

    this.#looper = new Looper(this.#assets, canvas, this.#cam, this.#ctrl)
  }

  start(): void {
    addEventListener('message', this.#onMsg)
    this.#looper.register('add')
    this.#looper.loop = this.#onLoop
  }

  #onLoop = async (): Promise<void> => {
    if (this.#ctrl.isOffStart('A') && this.#audio.ctx.state !== 'running')
      await this.#audio.ctx.resume()
    this.#update()

    const now = this.#looper.time ?? performance.now()
    if (now - this.#p1.peered.at > heartbeatPeriodMillis)
      this.#postPeerUpdate(now)

    this.#looper.loop = this.#onLoop
  }

  #onMsg = async (
    ev: MessageEvent<
      {type: 'stateUpdate'; data: AppMessage} | {type: undefined}
    >
  ): Promise<void> => {
    if (ev.data.type !== 'stateUpdate') return // hack: filter unknown messages.

    let msg: AppMessage | PeerMessage = ev.data.data

    // hack: filter repeat messages.
    if (msg.id <= this.#msgID) return
    this.#msgID = msg.id

    // unwrap peer messages into standard messages once ID check is done.
    if (msg.type === 'Peer') msg = msg.msg

    // if (this.#debug) console.log(`Game.#onMsg=${JSON.stringify(msg)}`)

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
        try {
          this.#assets.p1 = await loadSnoovatar(this.#assets, msg.p1)
        } catch {}
        this.#p1.snoovatarImg = this.#assets.p1
        postMessage({type: 'WebViewLoaded', uuid: this.#p1.uuid})
        break

      case 'PeerUpdate':
        if (msg.version !== version) {
          this.#outdated ||= msg.version > version
          break
        }
        if (this.#debug) console.log('on peer update')
        this.#players[msg.player.uuid] = await Peer(
          this.#assets,
          this.#players[msg.player.uuid],
          msg,
          this.#players[msg.player.uuid]?.slot
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

    // clear
    ctx.draw.fillStyle = green
    ctx.draw.fillRect(0, 0, canvas.width, canvas.height)

    this.#cam.x = Math.trunc(this.#p1.xy.x) - canvas.width / 2
    // player position is rendered at the feet. offset by half avatar height.
    this.#cam.y = Math.trunc(
      this.#p1.xy.y - snoovatarMaxWH.y / 2 - canvas.height / 2
    )
    ctx.draw.save()
    ctx.draw.translate(-this.#cam.x, -this.#cam.y)

    // draw level.
    ctx.draw.strokeStyle = 'yellow'
    ctx.draw.lineWidth = 4
    ctx.draw.strokeRect(0, 0, lvlWH.x, lvlWH.y)
    ctx.draw.fillStyle = ctx.data.grassPattern
    ctx.draw.fillRect(0, 0, lvlWH.x, lvlWH.y)

    // UI is updated first to catch any clicks.
    updatePanel(this.#panel, ctx.draw, this.#ctrl)

    updateP1(this.#p1, this.#ctrl, lvlWH, tick, this.#panel, now)

    if (this.#panel.tone != null && this.#panel.tone !== this.#panel.prevTone)
      play(
        this.#audio.ctx,
        this.#audio.notes[noteByInstrument[this.#p1.instrument]],
        this.#p1.scale + this.#panel.tone
      )

    const angle = angleBetween(this.#p1.dir, this.#p1.peered.dir)
    const mag = magnitude(xySub(this.#p1.xy, this.#p1.peered.xy))
    if (
      angle > 0.05 ||
      mag > 50 ||
      (now % melodyMillis > melodyMillis - heartbeatThrottleMillis &&
        this.#p1.prevMelody !== emptyMelody)
    )
      this.#postPeerUpdate(now)

    const slot = melodySlot(now)
    for (const player of Object.values(this.#players))
      if (player.uuid !== this.#p1.uuid) {
        if (now - player.peered.at > disconnectMillis) {
          this.#playerDisconnected(player)
          continue
        }

        updatePeer(player, lvlWH, tick)
        renderPlayer(ctx.draw, player)
        const note = melodyDecode(player.melody, now)
        if (note != null && player.slot !== slot) {
          player.slot = slot
          play(
            this.#audio.ctx,
            this.#audio.notes[noteByInstrument[player.instrument]],
            player.scale + note
          )
        }
      }

    // render p1 last so they're always on top.
    renderPlayer(ctx.draw, this.#p1)

    ctx.draw.restore()

    // draw UI last.
    const connected = !!this.#players[this.#p1.uuid]
    if (this.#outdated) {
      ctx.draw.fillStyle = 'black'
      ctx.draw.font = '12px sans-serif'
      ctx.draw.fillText('please reload', 10, 10)
    } else if (!connected) {
      ctx.draw.fillStyle = 'black'
      ctx.draw.font = '12px sans-serif'
      ctx.draw.fillText('disconnected', 10, 10)
    }

    renderMetronome(ctx.draw, now)
    renderPanel(ctx.draw, this.#panel)
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
        instrument: this.#p1.instrument,
        melody: this.#p1.prevMelody, // may be cleared.
        name: this.#p1.name,
        scale: this.#p1.scale,
        snoovatarURL: this.#p1.snoovatarURL,
        t2: this.#p1.t2,
        uuid: this.#p1.uuid,
        xy: this.#p1.xy
      },
      type: 'PeerUpdate',
      version
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
