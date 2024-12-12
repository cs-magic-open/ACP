interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

declare global {
  interface Window {
    acquireVsCodeApi: typeof acquireVsCodeApi;
  }
}
