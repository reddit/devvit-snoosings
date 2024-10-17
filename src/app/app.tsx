// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {type JSONObject, useChannel, useState} from '@devvit/public-api'
import type {
  AppMessage,
  PeerMessage,
  WebViewMessage
} from '../shared/message.js'

declare global {
  interface WindowEventMap {
    message: MessageEvent<
      {type: 'stateUpdate'; data: AppMessage} | {type: undefined}
    >
  }
}

export function App(_ctx: Devvit.Context): JSX.Element {
  const [msg, postMessage] = useState<Readonly<AppMessage>>({
    lastUpdate: Date.now(),
    type: 'Update'
  })

  const chan = useChannel<PeerMessage>({
    name: 'channel',
    onMessage: postMessage,
    onSubscribed() {
      postMessage({type: 'Connected'})
    }
  })

  function onMessage(msg: WebViewMessage): void {
    console.log(`App.onMessage=${JSON.stringify(msg, undefined, 2)}`)

    if (isPeerMessage(msg)) {
      chan.send(msg)
      return
    }

    switch (msg.type) {
      case 'Loaded':
        chan.subscribe()
        break
      case 'Ping':
        postMessage({type: 'Update', lastUpdate: Date.now()})
        break
      default:
        msg satisfies never
    }
  }

  return (
    <webview
      grow
      onMessage={onMessage as (msg: JSONObject) => void}
      state={msg}
      url='index.html'
    />
  )
}

function isPeerMessage(msg: WebViewMessage): msg is PeerMessage {
  return !!msg.peer
}
