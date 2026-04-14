'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   node-detail.js — Node detail modal: overview, hardcore, notes, progress log
   ═══════════════════════════════════════════════════════════════════════════ */

window.NodeDetailModule = (() => {
  let currentNodeId = null;

  // ─── Open Modal ──────────────────────────────────────────────────────────
  async function open(nodeId) {
    currentNodeId = nodeId;
    const node  = await window.api.nodes.getOne(nodeId);
    const nodes = window.AppState.nodes;
    const phase = node.phase_number;

    // Header
    document.getElementById('modal-phase-tag').textContent   = `Phase ${phase} · Node ${node.node_order}`;
    document.getElementById('modal-phase-tag').style.background = `rgba(${phaseRGB(phase)},0.12)`;
    document.getElementById('modal-phase-tag').style.color      = window.phaseColor(phase);
    document.getElementById('modal-node-title').textContent = node.title;

    // Difficulty badge
    const diffEl = document.getElementById('modal-diff-badge');
    diffEl.textContent  = node.difficulty;
    diffEl.className    = `diff-badge diff-${node.difficulty}`;

    document.getElementById('modal-hours-badge').textContent = `${node.estimated_hours}h estimated`;

    // Overview tab
    document.getElementById('modal-description').textContent = node.description || '—';
    document.getElementById('modal-dod').textContent         = node.definition_of_done || '—';

    // Prerequisites
    const prereqLabel = document.getElementById('prereq-label');
    const prereqEl    = document.getElementById('modal-prereqs');
    if (node.prerequisites && node.prerequisites.trim()) {
      prereqLabel.style.display = '';
      prereqEl.style.display    = '';
      const ids = node.prerequisites.split(',').map(s => s.trim()).filter(Boolean);
      prereqEl.innerHTML = ids.map(pid => {
        const pNode = nodes.find(n => n.id === pid);
        const done  = pNode && pNode.is_completed;
        return `<span class="prereq-chip" data-id="${pid}" style="${done?'border-color:var(--green);color:var(--green)':''}">${done?'✓ ':''} ${pNode ? pNode.title : pid}</span>`;
      }).join('');
      prereqEl.querySelectorAll('.prereq-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          window.Modal.close('modal-node');
          open(chip.dataset.id);
        });
      });
    } else {
      prereqLabel.style.display = 'none';
      prereqEl.style.display    = 'none';
    }

    // Hardcore tab
    document.getElementById('modal-hardcore-text').textContent = node.hardcore_element || 'No hardcore element defined.';

    // Notes tab
    document.getElementById('modal-notes-textarea').value = node.notes || '';

    // Completion checkbox
    const check = document.getElementById('modal-complete-check');
    check.checked = !!node.is_completed;
    check.dataset.nodeId = nodeId;

    // Load log
    await loadLog(nodeId);

    // Switch to overview tab
    switchTab('overview');

    window.Modal.open('modal-node');
  }

  function phaseRGB(p) {
    const m = { 0:'148,163,184', 1:'6,182,212', 2:'59,130,246', 3:'139,92,246', 4:'236,72,153', 5:'245,158,11', 6:'255,107,53' };
    return m[p] || '220, 20, 60';
  }

  // ─── Progress Log ────────────────────────────────────────────────────────
  async function loadLog(nodeId) {
    const logs  = await window.api.progress.getAll(nodeId);
    const listEl = document.getElementById('modal-log-list');
    if (!logs || logs.length === 0) {
      listEl.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-icon">📋</div><div class="empty-text">No sessions logged for this node yet.</div></div>';
      return;
    }
    listEl.innerHTML = logs.map(l => `
      <div class="log-entry">
        <span class="log-entry-type activity-type-badge ${l.log_type}">${l.log_type}</span>
        <span class="log-entry-desc">${l.log_description || '—'}</span>
        <div class="log-entry-info">
          <div>${window.formatHours(l.hours_logged)}</div>
          <div>${window.formatDate(l.timestamp)}</div>
        </div>
      </div>`).join('');
  }

  // ─── Tab Switching ───────────────────────────────────────────────────────
  function switchTab(name) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.modal-tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
  }

  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // ─── Save Notes ──────────────────────────────────────────────────────────
  document.getElementById('btn-save-notes').addEventListener('click', async () => {
    if (!currentNodeId) return;
    const notes = document.getElementById('modal-notes-textarea').value;
    await window.api.nodes.saveNotes(currentNodeId, notes);
    window.showToast('Notes saved ✓', 'success');
    await window.AppState.reloadNodes();
  });

  // ─── Completion Toggle ───────────────────────────────────────────────────
  document.getElementById('modal-complete-check').addEventListener('change', async e => {
    if (!currentNodeId) return;
    const done = e.target.checked;
    await window.api.nodes.setCompleted(currentNodeId, done);
    await window.AppState.reloadNodes();
    await window.refreshSidebarStats();

    if (done) {
      window.Modal.close('modal-node');
      window.triggerBossDefeat(async () => {
        window.showToast('🚀 Node conquered! Protocol advancing…', 'success', 3500);
        if (window.DashboardModule)  window.DashboardModule.refresh();
        if (window.RoadmapModule && window.AppState.currentPage === 'roadmap') window.RoadmapModule.render();
      });
    } else {
      window.showToast('Node marked incomplete.', 'info');
      if (window.DashboardModule) window.DashboardModule.refresh();
    }
  });

  // ─── Log Session (from node detail) ─────────────────────────────────────
  document.getElementById('btn-log-session').addEventListener('click', () => {
    window.Modal.close('modal-node');
    window.openLogModal(currentNodeId);
  });

  // ─── Focus on this Node ──────────────────────────────────────────────────
  document.getElementById('btn-open-focus-from-node').addEventListener('click', () => {
    window.Modal.close('modal-node');
    navigateTo('focus');
    setTimeout(() => {
      const sel = document.getElementById('focus-node-select');
      if (sel) sel.value = currentNodeId;
    }, 100);
  });

  // ─── Close ───────────────────────────────────────────────────────────────
  document.getElementById('modal-node-close').addEventListener('click', () => {
    window.Modal.close('modal-node');
  });

  return { open, loadLog, get currentNodeId() { return currentNodeId; } };
})();
