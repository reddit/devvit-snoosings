class App {
  state = {}
  constructor() {
    console.log('fug')
    const output = document.querySelector('#stateOutput')
    globalThis.addEventListener('message', ev => {
      const {type, data} = ev.data

      if (type === 'stateUpdate') {
        output!.replaceChildren(JSON.stringify(data, undefined, 2))
      }
    })

    const pingButton = document.querySelector('button')
    pingButton!.addEventListener('click', () => {
      globalThis.parent?.postMessage({type: 'ping'}, '*')
    })
  }
}

new App()
