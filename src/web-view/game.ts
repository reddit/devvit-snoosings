import {type XY, angleBetween, magnitude, xySub} from '../shared/2d.js'
import type {
  AppMessage,
  PeerMessage,
  WebViewMessage
} from '../shared/message.js'
import {beatMillis} from '../shared/serial.js'
import type {UUID} from '../shared/uuid.js'
import {Assets, loadSnoovatar, snoovatarMaxWH} from './assets.js'
import {Audio, play} from './audio/audio.js'
import {Cam} from './cam.js'
import {renderMetronome} from './ents/metronome.js'
import {Panel, panelH, renderPanel, updatePanel} from './ents/panel.js'
import {
  P1,
  Peer,
  type Player,
  renderPlayer,
  updateP1,
  updatePeer
} from './ents/player.js'
import {type Button, Input} from './input/input.js'
import {Looper} from './looper.js'
import {
  isMelodyStart,
  melodyBeat,
  melodyBufferRead,
  melodyGet
} from './types/melody-buffer.js'
import {type UTCMillis, utcMillisNow} from './types/time.js'
import {halfSpace, quarterSpace, space} from './utils/layout.js'
import {green} from './utils/palette.js'
import {throttle} from './utils/throttle.js'

const lvlWH: XY = {x: 1024, y: 1024}
const lvlMag: number = magnitude(lvlWH)

const heartbeatPeriodMillis: number = 9_000
const peerThrottleMillis: number = 300
const disconnectMillis: number = 30_000

const version: number = 4

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
  #players: {[uuid: UUID]: Peer | P1} = {}
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

    const now = utcMillisNow()
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
        {
          if (msg.version !== version) {
            this.#outdated ||= msg.version > version
            break
          }
          if (this.#debug) console.log('on peer update')
          const prev = this.#players[msg.player.uuid]
          if (prev && prev.type !== 'Peer')
            throw Error('received message from self')
          this.#players[msg.player.uuid] = await Peer(
            this.#assets,
            prev,
            msg,
            utcMillisNow()
          )
        }
        break

      default:
        msg satisfies never
    }
  }

  #update(): void {
    const {canvas, draw, tick} = this.#looper
    if (!draw) return

    const now = utcMillisNow()

    // clear
    draw.ctx.fillStyle = green
    draw.ctx.fillRect(0, 0, canvas.width, canvas.height)

    this.#cam.x = Math.trunc(this.#p1.xy.x) - canvas.width / 2
    // player position is rendered at the feet. offset by half avatar height.
    this.#cam.y = Math.trunc(
      this.#p1.xy.y - snoovatarMaxWH.y / 2 - (canvas.height - panelH) / 2
    )
    draw.ctx.save()
    draw.ctx.translate(-this.#cam.x, -this.#cam.y)

    // draw level.
    draw.ctx.strokeStyle = 'yellow'
    draw.ctx.lineWidth = 4
    draw.ctx.strokeRect(0, 0, lvlWH.x, lvlWH.y)
    draw.ctx.fillStyle = draw.data.grassPattern
    draw.ctx.fillRect(0, 0, lvlWH.x, lvlWH.y)

    // UI is updated first to catch any clicks.
    updatePanel(this.#panel, draw.ctx, this.#ctrl)

    updateP1(this.#p1, this.#ctrl, lvlWH, tick, this.#panel, now)

    if (this.#panel.tone != null)
      play(
        this.#audio.ctx,
        this.#audio.instruments[this.#p1.instrument],
        this.#p1.tone + this.#panel.tone,
        1
      )

    const angle = angleBetween(this.#p1.dir, this.#p1.peered.dir)
    const mag = magnitude(xySub(this.#p1.xy, this.#p1.peered.xy))
    if (
      angle > 0.05 ||
      mag > 50 ||
      (isMelodyStart(now) &&
        melodyBufferRead(this.#p1.melody) !== this.#p1.peered.melody)
    )
      this.#postPeerUpdate(now)

    const beat = melodyBeat(now)
    for (const player of Object.values(this.#players))
      if (player.type === 'Peer') {
        if (now - player.peered.at > disconnectMillis) {
          this.#playerDisconnected(player)
          continue
        }

        updatePeer(player, lvlWH, tick)
        renderPlayer(draw.ctx, player)
        const tone = melodyGet(player.melody, beat)
        if (tone != null && now - player.played >= beatMillis) {
          // I want this to only play once. I want to only play on the start of new measure.
          player.played = now
          play(
            this.#audio.ctx,
            this.#audio.instruments[player.instrument],
            player.tone + tone,
            1 -
              Math.min(lvlMag, 3 * magnitude(xySub(this.#p1.xy, player.xy))) /
                lvlMag
          )
        }
      }

    // render p1 last so they're always on top.
    renderPlayer(draw.ctx, this.#p1)

    draw.ctx.restore()

    // draw UI last.
    const connected = !!this.#players[this.#p1.uuid]
    if (this.#outdated) {
      draw.ctx.fillStyle = 'black'
      draw.ctx.font = '12px sans-serif'
      draw.ctx.fillText('please reload', 10, 10)
    }

    {
      draw.ctx.fillStyle = 'black'
      draw.ctx.font = '12px sans-serif'
      const textConnected = connected ? 'live' : 'offline'
      const dimsConnected = draw.ctx.measureText(textConnected)

      draw.ctx.fillText(
        textConnected,
        canvas.width - dimsConnected.width - halfSpace,
        halfSpace + dimsConnected.actualBoundingBoxAscent
      )

      draw.ctx.fillStyle = 'black'
      draw.ctx.font = '700 12px sans-serif'
      const text = `${Object.keys(this.#players).length}`
      const dims = draw.ctx.measureText(text)

      draw.ctx.fillText(
        text,
        canvas.width - dims.width - halfSpace,
        halfSpace +
          +(
            dimsConnected.actualBoundingBoxAscent +
            dimsConnected.actualBoundingBoxDescent
          ) +
          dims.actualBoundingBoxAscent +
          quarterSpace
      )
    }

    {
      draw.ctx.fillStyle = 'black'
      draw.ctx.font = '12px monospace'
      const y = `${Math.round(this.#p1.xy.y)}`.padStart(
        `${lvlWH.y}`.length,
        ' '
      )
      const textY = `${y}`
      const dimsY = draw.ctx.measureText(textY)
      draw.ctx.fillText(
        textY,
        canvas.width - dimsY.width - halfSpace,
        canvas.height - panelH + -halfSpace
      )
      const x = `${Math.round(this.#p1.xy.x)}`.padStart(
        `${lvlWH.x}`.length,
        ' '
      )
      const textX = `${x}`
      const dimsX = draw.ctx.measureText(textX)
      draw.ctx.fillText(
        textX,
        canvas.width - dimsX.width - halfSpace,
        canvas.height -
          panelH +
          -halfSpace -
          dimsY.actualBoundingBoxAscent -
          quarterSpace
      )
    }

    renderMetronome(draw.ctx, this.#p1, now)
    renderPanel(draw.ctx, this.#panel)
  }

  #playerDisconnected(player: Player): void {
    delete this.#players[player.uuid]
  }

  #postPeerUpdate = throttle((now: UTCMillis): void => {
    if (this.#debug) console.log('post peer update')
    const melody = melodyBufferRead(this.#p1.melody)
    this.#p1.peered = {
      at: now,
      dir: {...this.#p1.dir},
      melody,
      xy: {...this.#p1.xy}
    }
    postMessage({
      peer: true,
      player: {
        dir: this.#p1.dir,
        flipX: this.#p1.flipX,
        instrument: this.#p1.instrument,
        melody,
        name: this.#p1.name,
        tone: this.#p1.tone,
        snoovatarURL: this.#p1.snoovatarURL,
        t2: this.#p1.t2,
        uuid: this.#p1.uuid,
        xy: this.#p1.xy
      },
      type: 'PeerUpdate',
      version
    })
  }, peerThrottleMillis)
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
