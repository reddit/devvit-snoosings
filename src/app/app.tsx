// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {type JSONObject, useState} from '@devvit/public-api'
import type {Message, WebViewState} from '../shared/message.js'

export function App(_ctx: Devvit.Context): JSX.Element {
  const [webView, setWebView] = useState<Readonly<WebViewState>>({
    lastUpdate: 0
  })

  function onMessage(msg: Message): void {
    console.log(`app.onMessage=${JSON.stringify(msg, undefined, 2)}`)
    if (msg.type === 'Ping')
      setWebView(prev => ({...prev, lastUpdate: Date.now()}))
  }

  return (
    <webview
      grow
      onMessage={onMessage as (msg: JSONObject) => void}
      state={webView}
      url='index.html'
    />
  )
}
