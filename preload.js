const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pet', {
  // true  = clicks pass through to the app underneath
  // false = this window catches the click (cursor is over the creature)
  setIgnoreMouse: (ignore) => ipcRenderer.send('pet:ignore-mouse', ignore),
  reportState: (state) => ipcRenderer.send('pet:state', state),
  quit: () => ipcRenderer.send('pet:quit'),
  onCommand: (fn) => ipcRenderer.on('pet:command', (_e, command) => fn(command)),
  onDisplays: (fn) => ipcRenderer.on('pet:displays', (_e, zones) => fn(zones))
});
