'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   app.js — Router, global helpers, shared state, initialization bootstrap
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Global App State ──────────────────────────────────────────────────────
window.AppState = {
  nodes:      [],   // All RoadmapNodes loaded from DB
  stats:      null, // Latest stats snapshot
  currentPage: 'welcome',
};

window.addEventListener('error', function(e) {
  const d = document.createElement('div');
  d.style.cssText = "position:fixed;bottom:10px;left:10px;right:10px;z-index:999999;background:hotpink;color:black;padding:20px;font-size:16px;white-space:pre-wrap;font-family:monospace;";
  d.innerHTML = `GLOBAL ERROR: ${e.message}\n${e.error ? e.error.stack : ''}`;
  document.body.appendChild(d);
});
window.addEventListener('unhandledrejection', function(e) {
  const d = document.createElement('div');
  d.style.cssText = "position:fixed;bottom:10px;left:10px;right:10px;z-index:999999;background:hotpink;color:black;padding:20px;font-size:16px;white-space:pre-wrap;font-family:monospace;";
  d.innerHTML = `PROMISE ERROR: ${e.reason}\n${e.reason && e.reason.stack ? e.reason.stack : ''}`;
  document.body.appendChild(d);
});

// ─── Phase Metadata ─────────────────────────────────────────────────────────
window.PHASE_META = [
  { num: 0, name: 'The Baseline',          color: '#94A3B8', icon: '⚙' },
  { num: 1, name: 'DS Masterclass',        color: '#F43F5E', icon: '🧱' },
  { num: 2, name: 'Django Internals',      color: '#3B82F6', icon: '🐍' },
  { num: 3, name: 'Algorithmic Rigor',     color: '#8B5CF6', icon: '🧩' },
  { num: 4, name: 'Database & HLD',        color: '#EC4899', icon: '🏗' },
  { num: 5, name: 'Arch & DevOps',         color: '#F59E0B', icon: '⚡' },
  { num: 6, name: 'Final Assault',         color: '#FF6B35', icon: '🚀' },
];

window.phaseColor = function(num) {
  const m = window.PHASE_META.find(p => p.num === Number(num));
  return m ? m.color : '#94A3B8';
};

// ─── Navigation ─────────────────────────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  const navEl  = document.querySelector(`.nav-item[data-page="${page}"]`);

  if (pageEl) pageEl.classList.add('active');
  if (navEl)  navEl.classList.add('active');

  window.AppState.currentPage = page;

  // Trigger page-specific refresh
  switch (page) {
    case 'welcome':    if (window.WelcomeModule)    window.WelcomeModule.showSlide(0); break;
    case 'dashboard':  if (window.DashboardModule)  window.DashboardModule.refresh(); break;
    case 'roadmap':    if (window.RoadmapModule)    window.RoadmapModule.render(); break;
    case 'analytics':  if (window.AnalyticsModule)  window.AnalyticsModule.render(); break;
    case 'usaco':      if (window.USACOModule)      window.USACOModule.render(); break;
    case 'interviews': if (window.InterviewsModule) window.InterviewsModule.render(); break;
    case 'focus':      if (window.FocusModule)      window.FocusModule.populateNodeSelect(); break;
  }
}
// Expose globally so other modules can call navigateTo()
window.navigateTo = navigateTo;

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

// ─── Window Controls ────────────────────────────────────────────────────────
document.getElementById('btn-minimize').addEventListener('click', () => window.api.window.minimize());
document.getElementById('btn-maximize').addEventListener('click', () => window.api.window.maximize());
document.getElementById('btn-close').addEventListener('click',    () => window.api.window.close());

document.getElementById('btn-reset-protocol').addEventListener('click', async () => {
  if (confirm('CRITICAL WARNING: This will permanently erase ALL logs, USACO problems, statistics, and completions. Are you sure?')) {
    await window.api.appData.reset();
    location.reload();
  }
});

// ─── Modal System ────────────────────────────────────────────────────────────
window.Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('active'); }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active'); }
  },
};

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// ─── Toast ───────────────────────────────────────────────────────────────────
window.showToast = function(msg, type = 'info', duration = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.classList.remove('show'); }, duration);
};

// ─── Boss Defeat Animation ───────────────────────────────────────────────────
window.triggerBossDefeat = function(onDone) {
  const overlay = document.getElementById('boss-overlay');
  overlay.classList.add('active');
  setTimeout(() => {
    overlay.classList.remove('active');
    if (onDone) onDone();
  }, 2400);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
window.formatHours = h => h >= 1 ? `${Number(h).toFixed(1)}h` : `${Math.round(h * 60)}m`;
window.formatDate  = ts => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};
window.timeAgo = ts => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

// Node status helper: completed / active / locked
window.getNodeStatus = function(node, allNodes) {
  if (node.is_completed) return 'completed';
  if (!node.prerequisites || node.prerequisites.trim() === '') return 'active';
  const prereqIds = node.prerequisites.split(',').map(s => s.trim()).filter(Boolean);
  const allMet = prereqIds.every(pid => {
    const p = allNodes.find(n => n.id === pid);
    return p && p.is_completed;
  });
  return allMet ? 'active' : 'locked';
};

// Phase color lookup
window.phaseColor = function(phase) {
  const colors = ['#94A3B8','#06B6D4','#3B82F6','#8B5CF6','#EC4899','#F59E0B','#FF6B35'];
  return colors[phase] || '#94A3B8';
};

// Sidebar live stats update
window.refreshSidebarStats = async function() {
  const stats = await window.api.progress.stats();
  window.AppState.stats = stats;

  // Overall progress ring
  const pct = stats.overallPercent;
  const ringFill = document.getElementById('ring-fill');
  const circumference = 2 * Math.PI * 34; // r=34
  ringFill.style.strokeDashoffset = circumference * (1 - pct / 100);
  // Color shift: cyan (0%) → purple (50%) → orange (100%)
  if (pct < 50) {
    const t = pct / 50;
    ringFill.style.stroke = lerpColor('#DC143C', '#8B5CF6', t);
  } else {
    const t = (pct - 50) / 50;
    ringFill.style.stroke = lerpColor('#8B5CF6', '#FF6B35', t);
  }
  document.getElementById('ring-pct').textContent = `${pct}%`;

  // Pills
  document.getElementById('sb-hours').textContent = `${Number(stats.totalHours).toFixed(1)}h`;
  document.getElementById('sb-week').textContent  = `${Number(stats.weekHours).toFixed(1)}h`;
  document.getElementById('sb-phase').textContent  = `P${stats.currentPhase}`;
};

// Linear color interpolation
function lerpColor(a, b, t) {
  const hex = s => parseInt(s.replace('#',''), 16);
  const ar = (hex(a) >> 16) & 0xff, ag = (hex(a) >> 8) & 0xff, ab = hex(a) & 0xff;
  const br = (hex(b) >> 16) & 0xff, bg = (hex(b) >> 8) & 0xff, bb = hex(b) & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bv})`;
}

// ─── Log Quick Button (Dashboard) ────────────────────────────────────────────
document.getElementById('btn-log-quick').addEventListener('click', openLogModal);

// ─── Global Log Modal Wire-up ─────────────────────────────────────────────────
function openLogModal(preselectedNodeId) {
  populateLogNodeSelect(preselectedNodeId);
  window.Modal.open('modal-log');
}
window.openLogModal = openLogModal;

function populateLogNodeSelect(preselectedId) {
  const sel = document.getElementById('log-node-select');
  sel.innerHTML = window.AppState.nodes
    .map(n => `<option value="${n.id}" ${n.id === preselectedId ? 'selected':''}>P${n.phase_number} · ${n.title}</option>`)
    .join('');
}

document.getElementById('modal-log-close').addEventListener('click', () => window.Modal.close('modal-log'));
document.getElementById('log-cancel').addEventListener('click',      () => window.Modal.close('modal-log'));

document.getElementById('log-submit').addEventListener('click', async () => {
  const nodeId = document.getElementById('log-node-select').value;
  const hours  = parseFloat(document.getElementById('log-hours-input').value);
  const type   = document.getElementById('log-type-select').value;
  const desc   = document.getElementById('log-desc-input').value;

  if (!nodeId || isNaN(hours) || hours <= 0) {
    window.showToast('Please fill in all required fields.', 'error'); return;
  }
  await window.api.progress.log({ nodeId, hours, logType: type, description: desc });
  document.getElementById('log-desc-input').value = '';
  window.Modal.close('modal-log');
  window.showToast(`✓ ${hours}h logged successfully!`, 'success');
  await window.refreshSidebarStats();
  await window.AppState.reloadNodes();
  if (window.DashboardModule)  window.DashboardModule.refresh();
  if (window.AnalyticsModule)  window.AnalyticsModule.render();
  // Refresh node detail log if open
  if (window.NodeDetailModule && window.NodeDetailModule.currentNodeId) {
    window.NodeDetailModule.loadLog(window.NodeDetailModule.currentNodeId);
  }
});

// ─── App Init ─────────────────────────────────────────────────────────────────
async function initApp() {
  try {
    window.AppState.nodes = await window.api.nodes.getAll();
    window.AppState.reloadNodes = async () => {
      window.AppState.nodes = await window.api.nodes.getAll();
    };

    await window.refreshSidebarStats();

    if (window.WelcomeModule)    window.WelcomeModule.init();
    if (window.DashboardModule)  window.DashboardModule.init();
    if (window.RoadmapModule)    window.RoadmapModule.init();
    if (window.FocusModule)      window.FocusModule.init();

  } catch (err) {
    const d = document.createElement('div');
    d.style.cssText = "position:fixed;bottom:10px;left:10px;right:10px;z-index:999999;background:#b91c1c;color:white;padding:20px;font-size:16px;white-space:pre-wrap;font-family:monospace;";
    d.innerHTML = `FATAL INIT ERROR: ${err.message}\n${err.stack}`;
    document.body.appendChild(d);
  }
}

// Wait for all scripts to load then init
window.addEventListener('load', initApp);
