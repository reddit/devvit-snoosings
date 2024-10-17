import type {AppMessage, WebViewMessage} from '../shared/message.js'

class WebView {
  #state = {lastUpdate: 0}
  constructor() {
    const output = document.querySelector('#stateOutput')
    addEventListener('message', ev => {
      console.log(`webview.onMessage=${JSON.stringify(ev.data, undefined, 2)}`)
      if (ev.data.type !== 'stateUpdate') return

      const msg = ev.data.data

      if (msg.type === 'Update') {
        this.#state.lastUpdate = msg.lastUpdate
        output!.replaceChildren(JSON.stringify(this.#state, undefined, 2))
      }
    })

    const ping = document.querySelector('button')
    ping!.addEventListener('click', () => {
      parent.postMessage<WebViewMessage>({type: 'Ping'}, document.referrer)
    })
  }
}

new WebView()
