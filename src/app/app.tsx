// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, type JSONObject, useState} from '@devvit/public-api'

type Message = {
  type: 'ping'
}

export function App(_ctx: Devvit.Context): JSX.Element {
  const [webView, setWebView] = useState({
    lastUpdate: 0
  })

  const onMessage = (msg: Message): void => {
    if (msg.type === 'ping') {
      const newState = {...webView, lastUpdate: Date.now()}
      setWebView(newState)
    }
  }

  return (
    <webview
      url='index.html'
      state={webView}
      onMessage={onMessage as (msg: JSONObject) => void}
      grow
    />
  )
}
