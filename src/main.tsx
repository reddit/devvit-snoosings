import {Devvit} from '@devvit/public-api'
import {App} from './app/app.js'
import {Preview} from './app/preview.js'

Devvit.configure({realtime: true, redditAPI: true})

Devvit.addCustomPostType({
  name: 'Reddit vs Zombies',
  height: 'tall',
  render: App
})

Devvit.addMenuItem({
  label: 'New Reddit vs Zombies Post',
  location: 'subreddit',
  onPress: async (_ev, ctx) => {
    const sub = await ctx.reddit.getCurrentSubreddit()

    const post = await ctx.reddit.submitPost({
      preview: <Preview />,
      title: 'Reddit vs Zombies',
      subredditName: sub.name
    })

    ctx.ui.showToast({appearance: 'success', text: 'Post created.'})
    ctx.ui.navigateTo(post)
  }
})

export default Devvit
