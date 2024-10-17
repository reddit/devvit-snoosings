import type {WebViewMessage} from '../shared/message.js'
import type {XY} from '../shared/xy.js'

class WebView {
  #state: {lastUpdate: number; xy: XY} = {
    lastUpdate: 0,
    xy: {x: Math.random(), y: Math.random()}
  }

  constructor() {
    const output = document.querySelector('#stateOutput')
    addEventListener('message', ev => {
      console.log(`WebView.onMessage=${JSON.stringify(ev.data, undefined, 2)}`)
      if (ev.data.type !== 'stateUpdate') return

      const msg = ev.data.data

      if (msg.type === 'Update') {
        this.#state.lastUpdate = msg.lastUpdate
        output!.replaceChildren(JSON.stringify(this.#state, undefined, 2))
      }

      if (msg.type === 'Connected') {
        postMessage({peer: true, type: 'NewPlayer', xy: this.#state.xy})
      }
    })

    const ping = document.querySelector('button')
    ping!.addEventListener('click', () => {
      postMessage({type: 'Ping'})
    })

    postMessage({type: 'Loaded'})
  }
}

function postMessage(msg: WebViewMessage): void {
  parent.postMessage(msg, document.referrer)
}

new WebView()
