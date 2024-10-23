// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit} from '@devvit/public-api'
import {type JSONObject, useChannel, useState} from '@devvit/public-api'
import type {
  AppMessage,
  NoIDAppMessage,
  PeerMessage,
  WebViewMessage
} from '../shared/message.js'
import {T2, anonSnoovatarURL, anonUsername, noT2, noT3} from '../shared/tid.js'
import type {UUID} from '../shared/uuid.js'

export function App(ctx: Devvit.Context): JSX.Element {
  const debug = 'snoosings' in ctx.debug
  const [uuid, setUUID] = useState<UUID | null>(null)
  const [[username, t2, snoovatarURL]] = useState<[string, T2, string]>(
    async () => {
      const user = await ctx.reddit.getCurrentUser()
      const url = await user?.getSnoovatarUrl()
      // hack: ctx.userId seems to be nullish on native Android.
      return [
        user?.username ?? anonUsername,
        user?.id ?? T2(ctx.userId ?? noT2),
        url ?? anonSnoovatarURL
      ]
    }
  )

  const [msg, postMessage] = useState<Readonly<AppMessage>>({
    debug,
    id: 0,
    p1: {name: username, snoovatarURL, t2},
    type: 'LocalRuntimeLoaded'
  })

  function postAppMessage(msg: Readonly<NoIDAppMessage>): void {
    postMessage(prev => ({...msg, id: prev.id + 1}))
  }
  const chan = useChannel<PeerMessage>({
    // to-do: verify ctx.postId is not nullish on android.
    // key to current post to prevent interfering with other concerts.
    name: ctx.postId ?? noT3,
    onMessage: msg => {
      // hack: filter out messages sent by this instance. don't trigger a state
      // change.
      if (msg.player.uuid !== uuid) postAppMessage({msg, type: 'Peer'})
    },
    onSubscribed: () => postAppMessage({type: 'Connected'}),
    onUnsubscribed: () => postAppMessage({type: 'Disconnected'})
  })

  function onMessage(msg: WebViewMessage): void {
    // if (debug) console.log(`${username} App.onMessage=${JSON.stringify(msg)}`)

    switch (msg.type) {
      // to-do: this may only work because I've been careful to structure all
      // plugin calls on the initial render. if plugin calls happen at other
      // times, I don't know whether the layering can drop them or not. I think
      // I should probably use a queuing system with handshaking on both sides
      // to ensure messages to and from the web view arrive. this would be
      // useful in future work.
      case 'WebViewLoaded':
        setUUID(msg.uuid)
        chan.subscribe()
        break

      default:
        msg.peer satisfies true
        // to-do: these are actually happening on the remote. reconsider message
        // loss and WebViewLoaded to-do.
        console.log(`${username} app.send`)
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
