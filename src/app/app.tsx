// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {type JSONObject, useChannel, useState} from '@devvit/public-api'
import type {
  AppMessage,
  NoIDAppMessage,
  PeerMessage,
  WebViewMessage
} from '../shared/message.js'
import {anonT2, anonUsername} from '../shared/user.js'

export function App(ctx: Devvit.Context): JSX.Element {
  const debug = 'rvz' in ctx.debug
  const [playerName] = useState(async () => {
    const player = await ctx.reddit.getCurrentUser()
    return player?.username ?? anonUsername
  })

  const [msg, postMessage] = useState<Readonly<AppMessage>>({
    debug,
    id: 0,
    player: {t2: ctx.userId ?? anonT2, name: playerName},
    type: 'LocalRuntimeLoaded'
  })

  function postAppMessage(msg: Readonly<NoIDAppMessage>): void {
    postMessage(prev => ({...msg, id: prev.id + 1}))
  }

  const chan = useChannel<PeerMessage>({
    name: 'channel',
    onMessage: msg => postAppMessage({msg, type: 'Peer'}),
    onSubscribed() {
      postAppMessage({type: 'PlayerOneConnected'})
    },
    onUnsubscribed() {
      postAppMessage({type: 'PlayerOneDisconnected'})
    }
  })

  function onMessage(msg: WebViewMessage): void {
    // if (debug) console.log(`App.onMessage=${JSON.stringify(msg)}`)

    switch (msg.type) {
      case 'WebViewLoaded':
        chan.subscribe()
        break

      default:
        msg.peer satisfies true
        chan.send(msg)
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
