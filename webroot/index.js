// src/webview/webview.ts
var App = class {
  constructor() {
    this.state = {};
    console.log("fug");
    const output = document.querySelector("#stateOutput");
    globalThis.addEventListener("message", (ev) => {
      const { type, data } = ev.data;
      if (type === "stateUpdate") {
        output.replaceChildren(JSON.stringify(data, void 0, 2));
      }
    });
    const pingButton = document.querySelector("button");
    pingButton.addEventListener("click", () => {
      globalThis.parent?.postMessage({ type: "ping" }, "*");
    });
  }
};
new App();
