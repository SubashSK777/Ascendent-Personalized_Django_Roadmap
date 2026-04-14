'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   interviews.js — Mock interview tracker with score cards and type filter
   ═══════════════════════════════════════════════════════════════════════════ */

window.InterviewsModule = (() => {
  let allInterviews = [];
  let activeType    = 'all';

  const TYPE_COLORS = {
    DSA:       '#DC143C',
    LLD:       '#8B5CF6',
    HLD:       '#EC4899',
    Behavioral:'#F59E0B',
  };

  // ─── Load & Render ────────────────────────────────────────────────────────
  async function render() {
    allInterviews = await window.api.interviews.getAll();
    renderSummary();
    renderTable();
  }

  function renderSummary() {
    const el       = document.getElementById('interview-summary');
    const types    = ['DSA', 'LLD', 'HLD', 'Behavioral'];
    const total    = allInterviews.length;
    const avgScore = total
      ? (allInterviews.reduce((s, i) => s + i.score, 0) / total).toFixed(1)
      : '—';
    const above8   = allInterviews.filter(i => i.score >= 8).length;

    el.innerHTML = [
      { val: total,   lbl: 'Total Sessions', color: '#DC143C' },
      { val: avgScore,lbl: 'Avg Score',       color: avgScore >= 8 ? '#10B981' : avgScore >= 6 ? '#F59E0B' : '#EF4444' },
      { val: above8,  lbl: '≥ 8/10 Sessions', color: '#10B981' },
      { val: `${Math.round((above8 / Math.max(total,1)) * 100)}%`, lbl: 'Mastery Rate', color: '#8B5CF6' },
    ].map(s => `
      <div class="card int-stat-card">
        <div class="int-stat-val" style="color:${s.color}">${s.val}</div>
        <div class="int-stat-lbl">${s.lbl}</div>
      </div>`).join('');
  }

  function renderTable() {
    const tbody    = document.getElementById('interviews-tbody');
    const filtered = activeType === 'all'
      ? allInterviews
      : allInterviews.filter(i => i.interview_type === activeType);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-td">No interviews logged yet. Start practicing!</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(i => {
      const scoreColor = i.score >= 8 ? '#10B981' : i.score >= 6 ? '#F59E0B' : '#EF4444';
      return `
        <tr>
          <td style="color:var(--text-muted);font-size:11px">${window.formatDate(i.date)}</td>
          <td style="color:${TYPE_COLORS[i.interview_type]||'#fff'};font-weight:600">${i.interview_type}</td>
          <td style="color:var(--text-muted)">${i.interviewer_type}</td>
          <td>
            <div class="score-bar-wrap">
              <div class="score-bar" style="width:${i.score * 10}%;background:${scoreColor}"></div>
              <span style="color:${scoreColor};font-family:'JetBrains Mono',monospace;font-size:12px;white-space:nowrap">${i.score}/10</span>
            </div>
          </td>
          <td style="color:var(--text-secondary);font-size:11px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.feedback || '—'}</td>
        </tr>`;
    }).join('');
  }

  // ─── Type filter ─────────────────────────────────────────────────────────
  document.querySelectorAll('.type-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type;
      document.querySelectorAll('.type-filter').forEach(b => b.classList.toggle('active', b === btn));
      renderTable();
    });
  });

  // ─── Add Interview Modal ──────────────────────────────────────────────────
  document.getElementById('btn-add-interview').addEventListener('click', () => window.Modal.open('modal-interview'));
  document.getElementById('modal-interview-close').addEventListener('click', () => window.Modal.close('modal-interview'));
  document.getElementById('int-cancel').addEventListener('click', () => window.Modal.close('modal-interview'));

  document.getElementById('int-submit').addEventListener('click', async () => {
    const type          = document.getElementById('int-type').value;
    const interviewerType = document.getElementById('int-interviewer').value;
    const score         = parseInt(document.getElementById('int-score').value, 10);
    const feedback      = document.getElementById('int-feedback').value;

    if (isNaN(score) || score < 1 || score > 10) {
      window.showToast('Score must be between 1 and 10.', 'error'); return;
    }

    await window.api.interviews.add({ type, interviewerType, score, feedback });
    document.getElementById('int-feedback').value = '';
    document.getElementById('int-score').value    = '7';
    window.Modal.close('modal-interview');
    window.showToast('Interview session logged ✓', 'success');
    render();
  });

  return { render };
})();
