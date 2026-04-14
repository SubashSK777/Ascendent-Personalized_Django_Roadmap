'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, typed API to the renderer process via window.api
contextBridge.exposeInMainWorld('api', {
  // ─── Window Controls ───────────────────────────────────────────────────────
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close'),
  },

  // ─── Roadmap Nodes ─────────────────────────────────────────────────────────
  nodes: {
    getAll:       ()          => ipcRenderer.invoke('db:get-nodes'),
    getOne:       (id)        => ipcRenderer.invoke('db:get-node', id),
    setCompleted: (id, done)  => ipcRenderer.invoke('db:complete-node', { id, completed: done }),
    saveNotes:    (id, notes) => ipcRenderer.invoke('db:update-notes', { id, notes }),
  },

  // ─── Progress Logging ──────────────────────────────────────────────────────
  progress: {
    log:    (payload) => ipcRenderer.invoke('db:log-progress', payload),
    getAll: (nodeId)  => ipcRenderer.invoke('db:get-progress', nodeId),
    stats:  ()        => ipcRenderer.invoke('db:get-stats'),
  },

  // ─── Mock Interviews ───────────────────────────────────────────────────────
  interviews: {
    add:    (payload) => ipcRenderer.invoke('db:add-interview', payload),
    getAll: ()        => ipcRenderer.invoke('db:get-interviews'),
  },

  // ─── USACO Problems ────────────────────────────────────────────────────────
  usaco: {
    getAll: ()        => ipcRenderer.invoke('db:get-usaco-problems'),
    add:    (payload) => ipcRenderer.invoke('db:add-usaco-problem', payload),
    update: (payload) => ipcRenderer.invoke('db:update-usaco-problem', payload),
  },

  // ─── Codeforces Rating ─────────────────────────────────────────────────────
  cf: {
    getAll: ()        => ipcRenderer.invoke('db:get-cf-ratings'),
    add:    (payload) => ipcRenderer.invoke('db:add-cf-rating', payload),
  },

  // ─── App Data ──────────────────────────────────────────────────────────────
  appData: {
    reset: () => ipcRenderer.invoke('db:reset'),
  },
});
