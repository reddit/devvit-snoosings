import type {WebViewMessage} from '../shared/message.js'

export function postMessage(msg: WebViewMessage): void {
  parent.postMessage(msg, document.referrer)
}
