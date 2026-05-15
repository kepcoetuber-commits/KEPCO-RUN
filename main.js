const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Remove menu bar
Menu.setApplicationMenu(null);

function createWindow() {
  const win = new BrowserWindow({
    width: 820,
    height: 440,
    resizable: false,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');

  // Disable DevTools in production
  if (app.isPackaged) {
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools();
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
