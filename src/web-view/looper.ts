import type {Assets} from './assets.js'
import type {Cam} from './cam.js'
import type {Input} from './input/input.js'

/** manages window lifecycle for input and rendering. */
export class Looper {
  /** the run lifetime in millis. */
  age: number = 0
  ctx:
    | {data: {grassPattern: CanvasPattern}; draw: CanvasRenderingContext2D}
    | undefined
  readonly assets: Readonly<Assets>
  readonly canvas: HTMLCanvasElement
  /** the exact duration in millis to apply on a given update step. */
  tick: number = 0
  /** the relative timestamp in millis. */
  time?: number | undefined

  readonly #cam: Cam
  readonly #ctrl: Input<string>
  #frame?: number | undefined
  #loop?: (() => void) | undefined

  constructor(
    assets: Readonly<Assets>,
    canvas: HTMLCanvasElement,
    cam: Cam,
    ctrl: Input<string>
  ) {
    this.assets = assets
    this.canvas = canvas
    this.#cam = cam
    this.#ctrl = ctrl
    this.ctx = this.#newCtx()
  }

  cancel(): void {
    if (this.#frame != null) cancelAnimationFrame(this.#frame)
    this.#frame = undefined
    this.tick = 0
    this.time = undefined
    this.#ctrl.reset()
    this.#loop = undefined
  }

  get frame(): number {
    // assume 60 FPS so games can scale to this number regardless of actual.
    return Math.trunc(this.age / (1000 / 60))
  }

  set loop(loop: (() => void) | undefined) {
    this.#loop = loop
    if (document.hidden || !this.ctx) return
    if (this.#loop) this.#frame ??= requestAnimationFrame(this.#onFrame)
  }

  register(op: 'add' | 'remove'): void {
    const fn = <const>`${op}EventListener`
    for (const type of ['contextlost', 'contextrestored']) {
      this.canvas[fn](type, this.#onEvent, true)
    }
    globalThis[fn]('visibilitychange', this.#onEvent, true)
    if (op === 'add') this.ctx = this.#newCtx()
    this.#ctrl.register(op)
  }

  #newCtx():
    | {data: {grassPattern: CanvasPattern}; draw: CanvasRenderingContext2D}
    | undefined {
    const ctx =
      this.canvas.getContext('2d', {alpha: false, willReadFrequently: false}) ??
      undefined
    if (!ctx) return
    const grassPattern = ctx.createPattern(this.assets.grass, 'repeat')
    if (!grassPattern) return
    return {draw: ctx, data: {grassPattern}}
  }

  #onEvent = (event: Event): void => {
    event.preventDefault()
    if (event.type === 'contextrestored') this.ctx = this.#newCtx()

    if (this.ctx && !document.hidden) {
      if (this.#loop) this.#frame ??= requestAnimationFrame(this.#onFrame)
    } else {
      if (this.#frame != null) cancelAnimationFrame(this.#frame)
      this.#frame = undefined
      this.tick = 0
      this.time = undefined
      this.#ctrl.reset()
    }
  }

  #onFrame = (time: number): void => {
    this.#frame = undefined
    this.tick = time - (this.time ?? time)
    this.time = time
    this.age += this.tick
    const loop = this.#loop
    this.#loop = undefined
    this.canvas.width = innerWidth
    this.canvas.height = innerHeight
    this.#cam.resize()
    this.#ctrl.poll(this.tick)
    loop?.()
  }
}
