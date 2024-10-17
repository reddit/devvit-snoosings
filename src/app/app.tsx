// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {type JSONObject, useState} from '@devvit/public-api'
import type {AppMessage, WebViewMessage} from '../shared/message.js'

export function App(_ctx: Devvit.Context): JSX.Element {
  const [webView, setWebView] = useState<Readonly<AppMessage>>({
    type: 'Update',
    lastUpdate: Date.now()
  })

  function onMessage(msg: WebViewMessage): void {
    console.log(`app.onMessage=${JSON.stringify(msg, undefined, 2)}`)
    if (msg.type === 'Ping')
      setWebView({type: 'Update', lastUpdate: Date.now()})
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
