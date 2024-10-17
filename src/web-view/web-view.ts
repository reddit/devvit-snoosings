import type {Message, WebViewState} from '../shared/message.js'

class WebView {
  #state: Readonly<WebViewState> = {lastUpdate: 0}
  constructor() {
    const output = document.querySelector('#stateOutput')
    addEventListener('message', ev => {
      const msg = ev.data
      console.log(`webview.onMessage=${JSON.stringify(msg, undefined, 2)}`)

      if (msg.type === 'stateUpdate') {
        this.#state = msg.data
        output!.replaceChildren(JSON.stringify(this.#state, undefined, 2))
      }
    })

    const ping = document.querySelector('button')
    ping!.addEventListener('click', () => {
      parent.postMessage<Message>({type: 'Ping'}, document.referrer)
    })
  }
}

new WebView()
