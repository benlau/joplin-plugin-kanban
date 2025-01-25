declare namespace webviewApi {
  function postMessage(msg: any): Promise<any>;
  function onMessage(callback: (message: any) => void): void;
}
