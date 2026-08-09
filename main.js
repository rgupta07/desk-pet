const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');

let win = null;
let tray = null;
let napping = false;

const isMac = process.platform === 'darwin';

// One window stretched over every monitor, so the pet can be dragged between them.
function unionBounds() {
  const areas = screen.getAllDisplays().map(d => d.workArea);
  const x = Math.min(...areas.map(a => a.x));
  const y = Math.min(...areas.map(a => a.y));
  const width  = Math.max(...areas.map(a => a.x + a.width))  - x;
  const height = Math.max(...areas.map(a => a.y + a.height)) - y;
  return { x, y, width, height };
}

// Each monitor's work area, in window-local coordinates — the renderer uses
// these to know where the "floor" is on whichever screen the pet is over.
function sendDisplayZones() {
  if (!win || win.isDestroyed()) return;
  const b = win.getBounds();
  const zones = screen.getAllDisplays().map(d => ({
    x: d.workArea.x - b.x,
    y: d.workArea.y - b.y,
    width: d.workArea.width,
    height: d.workArea.height
  }));
  win.webContents.send('pet:displays', zones);
}

function createWindow() {
  const bounds = unionBounds();

  win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,          // never steals focus from your editor
    acceptFirstMouse: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Float above normal windows, follow you across Spaces / virtual desktops.
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, {
    visibleOnAllWorkspaces: true,
    skipTransformProcessType: true
  });

  // Clicks fall through to whatever is underneath; the renderer flips this
  // off for the few pixels the pet actually occupies.
  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.on('did-finish-load', sendDisplayZones);

  win.on('closed', () => { win = null; });
}

function refitDisplays() {
  if (!win) return;
  win.setBounds(unionBounds());
  sendDisplayZones();
}

function buildTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'));
  if (isMac) icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip('Boo!');
  refreshTrayMenu();
}

function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Give a treat', click: () => send('treat') },
    {
      label: napping ? 'Wake it up' : 'Send for a nap',
      click: () => { napping = !napping; send(napping ? 'nap' : 'wake'); refreshTrayMenu(); }
    },
    { type: 'separator' },
    { label: 'Bring to this screen', click: () => { refitDisplays(); send('recenter'); } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]));
}

function send(command) {
  if (win && !win.isDestroyed()) win.webContents.send('pet:command', command);
}

// The renderer tells us when the cursor is over the pet, so clicks only
// land on the creature and pass straight through everywhere else.
ipcMain.on('pet:ignore-mouse', (_e, ignore) => {
  if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(!!ignore, { forward: true });
});

ipcMain.on('pet:state', (_e, state) => {
  if (state === 'sleep' && !napping) { napping = true; refreshTrayMenu(); }
  if (state !== 'sleep' && napping) { napping = false; refreshTrayMenu(); }
});

ipcMain.on('pet:quit', () => app.quit());

app.whenReady().then(() => {
  if (isMac && app.dock) app.dock.hide();   // menu-bar app, no Dock icon
  createWindow();
  buildTray();

  screen.on('display-metrics-changed', refitDisplays);
  screen.on('display-added', refitDisplays);
  screen.on('display-removed', refitDisplays);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Menu-bar app: closing the overlay shouldn't be possible, and quitting
// only happens from the tray.
app.on('window-all-closed', (e) => { if (!isMac) app.quit(); });
