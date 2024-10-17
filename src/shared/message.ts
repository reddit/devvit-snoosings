export type AppMessage = {type: 'Update'; lastUpdate: number} | {type: 'Pong'}

export type WebViewMessage = PingMessage
export type PingMessage = {type: 'Ping'}

declare global {
  interface Window {
    postMessage<T extends WebViewMessage>(msg: T, targetOrigin: string): void
  }

  interface WindowEventMap {
    message: MessageEvent<
      {type: 'stateUpdate'; data: AppMessage} | {type: undefined}
    >
  }
}
