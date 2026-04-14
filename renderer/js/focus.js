'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   focus.js — Pomodoro timer with animated ring, session counter, auto-log
   ═══════════════════════════════════════════════════════════════════════════ */

window.FocusModule = (() => {
  // State
  let workMin     = 25;
  let breakMin    = 5;
  let totalSec    = workMin * 60;
  let remaining   = totalSec;
  let isRunning   = false;
  let isBreak     = false;
  let ticker      = null;
  let sessionsToday = 0;

  const CIRCUMFERENCE = 2 * Math.PI * 108; // r=108

  // DOM refs
  const timeEl       = document.getElementById('focus-time');
  const modeEl       = document.getElementById('focus-mode-label');
  const ringFill     = document.getElementById('focus-ring-fill');
  const startBtn     = document.getElementById('focus-start');
  const resetBtn     = document.getElementById('focus-reset');
  const dotsEl       = document.getElementById('session-dots');
  const workMinInput = document.getElementById('focus-work-min');
  const breakMinInput= document.getElementById('focus-break-min');

  // ─── Ring update ────────────────────────────────────────────────────────
  function updateRing() {
    const pct    = remaining / totalSec;
    const offset = CIRCUMFERENCE * (1 - pct);
    ringFill.style.strokeDashoffset = offset;
    // Shift color: cyan when lots of time left, orange when almost done
    if (!isBreak) {
      const t = 1 - pct;
      ringFill.style.stroke = t < 0.5
        ? `rgba(220, 20, 60, ${0.7 + t})`
        : `rgba(255,107,53,${0.7 + (1-t)})`;
    } else {
      ringFill.style.stroke = 'rgba(16,185,129,0.7)';
    }
  }

  function updateDisplay() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timeEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    modeEl.textContent = isBreak ? 'BREAK' : 'FOCUS';
    updateRing();
  }

  // ─── Session dots ────────────────────────────────────────────────────────
  function renderDots() {
    const TARGET = 8;
    dotsEl.innerHTML = Array.from({length: TARGET}, (_, i) =>
      `<div class="session-dot ${i < sessionsToday ? 'done' : ''}"></div>`
    ).join('');
  }

  // ─── Timer tick ──────────────────────────────────────────────────────────
  function tick() {
    if (remaining <= 0) {
      clearInterval(ticker);
      ticker     = null;
      isRunning  = false;

      if (!isBreak) {
        // Work session done
        sessionsToday++;
        renderDots();
        autoLogSession();
        window.showToast('🎯 Focus session complete! Take a break.', 'success', 4000);
        // Switch to break
        isBreak  = true;
        totalSec = breakMin * 60;
      } else {
        // Break done
        window.showToast('⚡ Break over! Ready for the next round?', 'info', 3000);
        isBreak  = false;
        totalSec = workMin * 60;
      }
      remaining = totalSec;
      updateDisplay();
      startBtn.textContent = '▶  Start';
      return;
    }
    remaining--;
    updateDisplay();
  }

  // ─── Auto-log completed focus session ───────────────────────────────────
  async function autoLogSession() {
    const nodeId = document.getElementById('focus-node-select').value;
    if (!nodeId) return;
    const hours = workMin / 60;
    await window.api.progress.log({
      nodeId,
      hours,
      logType: 'Study',
      description: `Focus session: ${workMin} min Pomodoro`,
    });
    await window.refreshSidebarStats();
    if (window.DashboardModule) window.DashboardModule.refresh();
  }

  // ─── Controls ────────────────────────────────────────────────────────────
  startBtn.addEventListener('click', () => {
    if (isRunning) {
      clearInterval(ticker); ticker = null; isRunning = false;
      startBtn.textContent = '▶  Resume';
    } else {
      ticker    = setInterval(tick, 1000);
      isRunning = true;
      startBtn.textContent = '⏸  Pause';
    }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(ticker); ticker = null; isRunning = false;
    isBreak   = false;
    workMin   = parseInt(workMinInput.value, 10)  || 25;
    breakMin  = parseInt(breakMinInput.value, 10) || 5;
    totalSec  = workMin * 60;
    remaining = totalSec;
    updateDisplay();
    startBtn.textContent = '▶  Start';
  });

  workMinInput.addEventListener('change', () => {
    if (!isRunning) {
      workMin  = parseInt(workMinInput.value, 10) || 25;
      if (!isBreak) { totalSec = workMin * 60; remaining = totalSec; updateDisplay(); }
    }
  });
  breakMinInput.addEventListener('change', () => {
    if (!isRunning) {
      breakMin = parseInt(breakMinInput.value, 10) || 5;
      if (isBreak)  { totalSec = breakMin * 60; remaining = totalSec; updateDisplay(); }
    }
  });

  // ─── Populate node select ────────────────────────────────────────────────
  function populateNodeSelect() {
    const sel = document.getElementById('focus-node-select');
    const current = sel.value;
    sel.innerHTML = '<option value="">— Select a node to focus on —</option>' +
      window.AppState.nodes
        .filter(n => !n.is_completed)
        .map(n => `<option value="${n.id}" ${n.id === current ? 'selected' : ''}>P${n.phase_number} · ${n.title}</option>`)
        .join('');
  }

  function init() {
    updateDisplay();
    renderDots();
    populateNodeSelect();
  }

  return { init, populateNodeSelect };
})();
