// biome-ignore lint/style/useImportType: Devvit is a functional dependency of JSX.
import {Devvit, type JSONValue, useInterval} from '@devvit/public-api'
import {useChannel, useState} from '@devvit/public-api'
import {ChannelStatus} from '@devvit/public-api/types/realtime.js'
import {
  type DevvitMessage,
  type PeerMessage,
  type WebViewMessage,
  msgVersion
} from '../shared/message.js'
import type {Melody, Tone} from '../shared/serial.js'
import {T2, anonSnoovatarURL, anonUsername, noT2, noT3} from '../shared/tid.js'
import type {UUID} from '../shared/uuid.js'

export function App(ctx: Devvit.Context): JSX.Element {
  const debug = 'snoosings' in ctx.debug
  const debugHouseBand = 'houseband' in ctx.debug
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

  const fakeMessageInterval = useInterval(() => {
    if (chan.status !== ChannelStatus.Connected) return
    ctx.ui.webView.postMessage<DevvitMessage>('web-view', {
      type: 'Peer',
      msg: {
        peer: true,
        player: {
          dir: {x: 0, y: 0},
          flipX: false,
          instrument: 'Bubbler',
          melody: '-AA--A--' as Melody,
          name: 'likeoid',
          root: 0 as Tone,
          snoovatarURL:
            'https://i.redd.it/snoovatar/avatars/d87d7eb2-f063-424a-8e30-f02e3347ef0e.png',
          t2: 't2_reyi3nllt',
          uuid: 'cc7591e9-bd00-4e7a-93a6-a4b486bae374',
          xy: {x: 625, y: 408}
        },
        type: 'PeerUpdate',
        version: msgVersion
      }
    })
    ctx.ui.webView.postMessage<DevvitMessage>('web-view', {
      type: 'Peer',
      msg: {
        peer: true,
        player: {
          dir: {x: 0, y: 0},
          flipX: true,
          instrument: 'Jazzman',
          melody: 'C---AA-B' as Melody,
          name: 'pizzaoid',
          root: 3 as Tone,
          snoovatarURL:
            'https://www.redditstatic.com/shreddit/assets/thinking-snoo.png',
          t2: 't2_hbbuxlhe5',
          uuid: 'f7570a7e-85cb-4363-98c4-7170d95fdc6b',
          xy: {x: 494, y: 396}
        },
        type: 'PeerUpdate',
        version: msgVersion
      }
    })
  }, 1100)

  if (debugHouseBand) fakeMessageInterval.start()

  useState(() => {
    ctx.ui.webView.postMessage<DevvitMessage>('web-view', {
      debug,
      p1: {name: username, snoovatarURL, t2},
      type: 'LocalRuntimeLoaded'
    })
    return null
  })

  const chan = useChannel<PeerMessage>({
    // to-do: verify ctx.postId is not nullish on android.
    // key to current post to prevent interfering with other concerts.
    name: ctx.postId ?? noT3,
    onMessage: msg => {
      // hack: filter out messages sent by this instance. don't trigger a state
      // change.
      if (msg.player.uuid !== uuid)
        ctx.ui.webView.postMessage<DevvitMessage>('web-view', {
          msg,
          type: 'Peer'
        })
    },
    onSubscribed() {
      ctx.ui.webView.postMessage<DevvitMessage>('web-view', {
        type: 'Connected'
      })
    },
    onUnsubscribed() {
      ctx.ui.webView.postMessage<DevvitMessage>('web-view', {
        type: 'Disconnected'
      })
    }
  })

  function onMessage(msg: WebViewMessage): void {
    if (debug) console.log(`${username} App.onMessage=${JSON.stringify(msg)}`)

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
        if (chan.status !== ChannelStatus.Connected) break
        chan.send(msg)
    }
  }

  return (
    <webview
      grow
      id='web-view'
      onMessage={onMessage as (msg: JSONValue) => void}
      url='index.html'
    />
  )
}
