import { Devvit } from '@devvit/public-api'

export function App(ctx: Devvit.Context): JSX.Element {
  return (
    <vstack
      alignment='middle'
      cornerRadius='medium'
      gap='medium'
      padding='medium'
    >
      <text size='xxlarge' style='heading'>
        Hello, world! 👋
      </text>
      <button
        appearance='primary'
        onPress={() => ctx.ui.showToast('Thank you!')}
      >
        Click me!
      </button>
    </vstack>
  )
}
