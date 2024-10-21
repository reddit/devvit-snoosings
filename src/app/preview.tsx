import {Devvit} from '@devvit/public-api'

export function Preview(): JSX.Element {
  // to-do: I'd like this feel a little more snoosings-specific.
  return (
    <vstack width={'100%'} height={'100%'} alignment='center middle'>
      <image
        url='loading.gif'
        description='Loading…'
        height='140px'
        width='140px'
        imageHeight='240px'
        imageWidth='240px'
      />
      <spacer size='small' />
      <text size='large' weight='bold'>
        We're putting the band back together…
      </text>
    </vstack>
  )
}
