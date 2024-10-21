import {type T2, noT2} from '../../shared/tid.js'
import {anonSnoovatarImg} from './snoovatar.js'

export function cachedImg(player: {
  snoovatarURL: string
  t2: T2
}): HTMLImageElement {
  return player.t2 === noT2 ? anonSnoovatarImg : newImage(player.snoovatarURL)
}

export function newImage(url: string): HTMLImageElement {
  const img = new Image()
  img.src = url
  return img
}
