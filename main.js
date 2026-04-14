'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const Database = require('./database/db');

let db;
let mainWindow;

// ─── App Bootstrap ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  const dataDir = path.join(app.getPath('userData'), 'ascendant-data');
  db = new Database(dataDir);
  db.init();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    backgroundColor: '#06060F',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.webContents.setZoomFactor(1.2);
  mainWindow.webContents.on('console-message', (e, level, msg) => console.log('RENDERER:', msg));

  // Route external links to the OS browser, not a new Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ─── IPC: Window Controls ──────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow.minimize());
ipcMain.on('window:maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow.close());

// ─── IPC: Roadmap Nodes ────────────────────────────────────────────────────
ipcMain.handle('db:get-nodes',     ()        => { const n = db.getAllNodes(); console.log('GET-NODES:', n.length); return n; });
ipcMain.handle('db:get-node',      (_, id)   => db.getNode(id));
ipcMain.handle('db:reset',         ()        => db.factoryReset());
ipcMain.handle('db:complete-node', (_, p)    => db.completeNode(p.id, p.completed));
ipcMain.handle('db:update-notes',  (_, p)    => db.updateNotes(p.id, p.notes));

// ─── IPC: Progress Logging ────────────────────────────────────────────────
ipcMain.handle('db:log-progress',  (_, p)    => db.logProgress(p));
ipcMain.handle('db:get-progress',  (_, id)   => db.getProgress(id));
ipcMain.handle('db:get-stats',     ()        => db.getStats());

// ─── IPC: Mock Interviews ─────────────────────────────────────────────────
ipcMain.handle('db:add-interview', (_, p)    => db.addInterview(p));
ipcMain.handle('db:get-interviews',()        => db.getInterviews());

// ─── IPC: USACO Problems ──────────────────────────────────────────────────
ipcMain.handle('db:get-usaco-problems', ()   => db.getUSACOProblems());
ipcMain.handle('db:add-usaco-problem',  (_, p) => db.addUSACOProblem(p));
ipcMain.handle('db:update-usaco-problem',(_, p) => db.updateUSACOProblem(p));

// ─── IPC: Codeforces Rating ───────────────────────────────────────────────
ipcMain.handle('db:get-cf-ratings',()        => db.getCFRatings());
ipcMain.handle('db:add-cf-rating', (_, p)    => db.addCFRating(p));
