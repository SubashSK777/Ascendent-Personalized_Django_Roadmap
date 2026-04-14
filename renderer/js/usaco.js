'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   usaco.js — USACO problem tracker with level filtering and stats
   ═══════════════════════════════════════════════════════════════════════════ */

window.USACOModule = (() => {
  let activeLevel = 'all';
  let allProblems = [];

  const LEVEL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const LEVEL_COLORS = {
    Bronze:   '#CD7F32',
    Silver:   '#C0C0C0',
    Gold:     '#FFD700',
    Platinum: '#DC143C',
  };

  // ─── Load & Render ────────────────────────────────────────────────────────
  async function render() {
    allProblems = await window.api.usaco.getAll();
    renderStats();
    renderTable();
    renderLevelFilters();
  }

  function renderLevelFilters() {
    document.querySelectorAll('.level-filter').forEach(btn => {
      const lv = btn.dataset.level;
      btn.classList.toggle('active', lv === activeLevel);
      btn.style.color = activeLevel === lv && lv !== 'all' ? (LEVEL_COLORS[lv] || 'var(--cyan)') : '';
      btn.style.borderColor = activeLevel === lv && lv !== 'all' ? (LEVEL_COLORS[lv] || 'var(--cyan)') : '';
    });
  }

  function renderStats() {
    const rowEl = document.getElementById('usaco-stats-row');
    const total   = allProblems.length;
    const solved  = allProblems.filter(p => p.status === 'Solved').length;
    const attempted = allProblems.filter(p => p.status === 'Attempted').length;
    const goldSolved = allProblems.filter(p => p.level === 'Gold' && p.status === 'Solved').length;

    rowEl.innerHTML = [
      { val: total,       lbl: 'Total Tracked',   color: '#DC143C' },
      { val: solved,      lbl: 'Solved',           color: '#10B981' },
      { val: attempted,   lbl: 'Attempted',        color: '#F59E0B' },
      { val: goldSolved,  lbl: 'Gold Solved 🥇',   color: '#FFD700' },
    ].map(s => `
      <div class="card usaco-stat">
        <div class="usaco-stat-val" style="color:${s.color}">${s.val}</div>
        <div class="usaco-stat-lbl">${s.lbl}</div>
      </div>`).join('');
  }

  function renderTable() {
    const tbody = document.getElementById('problems-tbody');
    const filtered = activeLevel === 'all'
      ? allProblems
      : allProblems.filter(p => p.level === activeLevel);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-td">No problems at this level. Add one!</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr data-id="${p.id}">
        <td>
          ${p.problem_url
            ? `<a href="#" class="prob-link" data-url="${p.problem_url}"
                  style="color:var(--cyan);text-decoration:none;"
               >${p.problem_name}</a>`
            : p.problem_name}
        </td>
        <td style="color:${LEVEL_COLORS[p.level] || '#fff'};font-weight:600;">${p.level}</td>
        <td style="color:var(--text-muted)">${p.category}</td>
        <td>${starRating(p.difficulty)}</td>
        <td><span class="status-badge status-${p.status}">${p.status}</span></td>
        <td style="font-family:'JetBrains Mono',monospace;color:var(--text-muted);">
          ${p.time_taken ? `${p.time_taken}m` : '—'}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            ${p.status !== 'Solved'
              ? `<button class="btn-ghost btn-sm" onclick="USACOModule._markSolved(${p.id})">✓ Solve</button>`
              : ''}
            ${p.status === 'Unsolved'
              ? `<button class="btn-ghost btn-sm" onclick="USACOModule._markAttempted(${p.id})">Attempted</button>`
              : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  function starRating(d) {
    return '★'.repeat(d || 0) + '☆'.repeat(5 - (d || 0));
  }

  // ─── Level filter clicks ─────────────────────────────────────────────────
  document.querySelectorAll('.level-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      activeLevel = btn.dataset.level;
      renderLevelFilters();
      renderTable();
    });
  });

  // ─── Delegated link click (open in system browser) ─────────────────────────
  document.getElementById('problems-tbody').addEventListener('click', e => {
    const link = e.target.closest('.prob-link');
    if (link) {
      e.preventDefault();
      // Electron's shell is exposed via preload openExternal equivalent
      // We navigate externally via window.open which Electron routes to shell
      window.open(link.dataset.url, '_blank');
    }
  });

  // ─── Quick actions ────────────────────────────────────────────────────────
  async function _markSolved(id) {
    const t = document.createElement('input');
    t.type = 'number'; t.placeholder = 'Minutes taken'; t.value = '30';
    t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:#0D0D1A;border:1px solid var(--cyan);color:#fff;padding:10px 16px;border-radius:8px;font-size:14px;width:200px;text-align:center;';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;';
    document.body.append(overlay, t);
    t.focus();
    const timeTaken = await new Promise(res => {
      const done = () => { overlay.remove(); t.remove(); res(parseInt(t.value,10)||0); };
      t.addEventListener('keydown', e => { if(e.key==='Enter') done(); if(e.key==='Escape') { overlay.remove(); t.remove(); res(null); } });
      overlay.addEventListener('click', done);
    });
    if (timeTaken === null) return;
    await window.api.usaco.update({ id, status:'Solved', notes:'', timeTaken });
    window.showToast('Problem marked as Solved! 🎉', 'success');
    render();
  }
  async function _markAttempted(id) {
    await window.api.usaco.update({ id, status: 'Attempted', notes: '', timeTaken: 0 });
    window.showToast('Marked as Attempted.', 'info');
    render();
  }

  // ─── Add Problem Modal ────────────────────────────────────────────────────
  document.getElementById('btn-add-problem').addEventListener('click', () => window.Modal.open('modal-problem'));
  document.getElementById('modal-problem-close').addEventListener('click', () => window.Modal.close('modal-problem'));
  document.getElementById('prob-cancel').addEventListener('click', () => window.Modal.close('modal-problem'));

  document.getElementById('prob-submit').addEventListener('click', async () => {
    const name       = document.getElementById('prob-name').value.trim();
    const url        = document.getElementById('prob-url').value.trim();
    const level      = document.getElementById('prob-level').value;
    const category   = document.getElementById('prob-category').value;
    const difficulty = parseInt(document.getElementById('prob-difficulty').value, 10);

    if (!name) { window.showToast('Problem name is required.', 'error'); return; }

    await window.api.usaco.add({ name, url, level, category, difficulty, nodeId: '', notes: '' });
    document.getElementById('prob-name').value = '';
    document.getElementById('prob-url').value  = '';
    window.Modal.close('modal-problem');
    window.showToast('Problem added ✓', 'success');
    render();
  });

  // Expose actions globally for inline onclick handlers
  window.USACOModule = { render, _markSolved, _markAttempted };

  return { render, _markSolved, _markAttempted };
})();
