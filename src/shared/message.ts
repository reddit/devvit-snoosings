export type WebViewState = {lastUpdate: number}

export type Message = PingMessage
export type PingMessage = {type: 'Ping'}

declare global {
  interface Window {
    postMessage<T extends Message>(msg: T, targetOrigin: string): void
  }

  interface WindowEventMap {
    message: MessageEvent<
      {type: 'stateUpdate'; data: WebViewState} | {type: undefined}
    >
  }
}
