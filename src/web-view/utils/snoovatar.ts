import type {XY} from '../../shared/2d.js'
import {anonSnoovatarURL} from '../../shared/tid.js'
import {newImage} from './image.js'

export const anonSnoovatarImg: HTMLImageElement = newImage(anonSnoovatarURL)
export const snoovatarMaxWH: Readonly<XY> = {x: 64, y: 64}
