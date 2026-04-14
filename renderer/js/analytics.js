'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   analytics.js — Chart.js charts: daily hours, log type, phase progress, CF
   ═══════════════════════════════════════════════════════════════════════════ */

window.AnalyticsModule = (() => {
  let chartDaily  = null;
  let chartType   = null;
  let chartPhase  = null;
  let chartCF     = null;

  const CHART_DEFAULTS = {
    color: '#DC143C',
    gridColor: 'rgba(255,255,255,0.05)',
    textColor: '#94A3B8',
    font: { family: 'Inter, sans-serif', size: 11 },
  };

  function baseScales() {
    return {
      x: {
        grid:  { color: CHART_DEFAULTS.gridColor, drawBorder: false },
        ticks: { color: CHART_DEFAULTS.textColor, font: CHART_DEFAULTS.font },
      },
      y: {
        grid:  { color: CHART_DEFAULTS.gridColor, drawBorder: false },
        ticks: { color: CHART_DEFAULTS.textColor, font: CHART_DEFAULTS.font },
        beginAtZero: true,
      },
    };
  }

  function destroyAll() {
    [chartDaily, chartType, chartPhase, chartCF].forEach(c => c && c.destroy());
    chartDaily = chartType = chartPhase = chartCF = null;
  }

  // ─── Build last 14 days date labels ─────────────────────────────────────
  function last14Days() {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  async function render() {
    if (typeof Chart === 'undefined') {
      document.querySelector('#page-analytics .analytics-grid').innerHTML =
        '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">Charts require internet connection (Chart.js CDN)</div></div>';
      return;
    }

    destroyAll();

    const stats   = await window.api.progress.stats();
    const cfRates = await window.api.cf.getAll();

    // ── Daily Hours Bar Chart ──
    const days      = last14Days();
    const dayMap    = {};
    (stats.dailyHours || []).forEach(d => { dayMap[d.date] = Number(d.hours); });
    const hourData  = days.map(d => dayMap[d] || 0);
    const dayLabels = days.map(d => {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('en-IN', { month:'short', day:'numeric' });
    });

    const colorsDaily = hourData.map(h =>
      h >= 4 ? 'rgba(16,185,129,0.7)' : h >= 2 ? 'rgba(220, 20, 60, 0.7)' : 'rgba(220, 20, 60, 0.3)'
    );

    chartDaily = new Chart(document.getElementById('chart-daily-hours'), {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Hours', data: hourData,
          backgroundColor: colorsDaily,
          borderRadius: 5,
          hoverBackgroundColor: 'rgba(220, 20, 60, 0.9)',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: baseScales(),
      },
    });

    // ── Log Type Donut ──
    const typeBk   = stats.logTypeBreakdown || [];
    const typeColors = {
      Study:    'rgba(220, 20, 60, 0.8)',
      Coding:   'rgba(139,92,246,0.8)',
      Practice: 'rgba(16,185,129,0.8)',
      Mock:     'rgba(245,158,11,0.8)',
      Review:   'rgba(236,72,153,0.8)',
    };
    chartType = new Chart(document.getElementById('chart-log-type'), {
      type: 'doughnut',
      data: {
        labels: typeBk.map(t => t.log_type),
        datasets: [{
          data: typeBk.map(t => Number(t.hours)),
          backgroundColor: typeBk.map(t => typeColors[t.log_type] || 'rgba(255,255,255,0.3)'),
          borderColor: 'rgba(0,0,0,0.3)',
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: CHART_DEFAULTS.textColor, font: CHART_DEFAULTS.font, padding: 12, boxWidth: 12 },
          },
        },
      },
    });

    // ── Phase Completion Horizontal Bar ──
    const phaseData = (stats.phaseProgress || []).sort((a,b) => a.phase_number - b.phase_number);
    const phColors  = ['#94A3B8','#06B6D4','#3B82F6','#8B5CF6','#EC4899','#F59E0B','#FF6B35'];
    chartPhase = new Chart(document.getElementById('chart-phase-progress'), {
      type: 'bar',
      data: {
        labels: phaseData.map(p => `P${p.phase_number}: ${(window.PHASE_META[p.phase_number]||{}).name||''}`),
        datasets: [
          {
            label: 'Completed',
            data: phaseData.map(p => p.completed || 0),
            backgroundColor: phaseData.map(p => phColors[p.phase_number] || '#94A3B8'),
            borderRadius: { topLeft:4, bottomLeft:4, topRight:4, bottomRight:4 },
          },
          {
            label: 'Total',
            data: phaseData.map(p => (p.total || 0) - (p.completed || 0)),
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: { color: CHART_DEFAULTS.textColor, font: CHART_DEFAULTS.font, boxWidth: 10 },
          },
        },
        scales: {
          x: { stacked: true, ...baseScales().x },
          y: { stacked: true, ...baseScales().y },
        },
      },
    });

    // ── CF Rating Line ──
    if (cfRates && cfRates.length > 0) {
      const cfLabels = cfRates.map(r => {
        const d = new Date(r.timestamp);
        return d.toLocaleDateString('en-IN', { month:'short', day:'numeric' });
      });
      chartCF = new Chart(document.getElementById('chart-cf-rating'), {
        type: 'line',
        data: {
          labels: cfLabels,
          datasets: [{
            label: 'CF Rating',
            data: cfRates.map(r => r.rating),
            borderColor: 'rgba(245,158,11,0.9)',
            backgroundColor: 'rgba(245,158,11,0.08)',
            pointBackgroundColor: 'rgba(245,158,11,1)',
            pointRadius: 5,
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: baseScales(),
        },
      });
    } else {
      // placeholder hint
      document.getElementById('chart-cf-rating').parentElement.insertAdjacentHTML(
        'beforeend',
        `<div class="empty-state" style="padding:12px 0">
          <div class="empty-text">No CF ratings yet. Click "+ Add Rating" to start tracking.</div>
        </div>`
      );
    }
  }

  // ─── CF Rating modal wiring ──────────────────────────────────────────────
  document.getElementById('btn-add-cf').addEventListener('click', () => { window.Modal.open('modal-cf'); });
  document.getElementById('modal-cf-close').addEventListener('click', () => { window.Modal.close('modal-cf'); });
  document.getElementById('cf-cancel').addEventListener('click',      () => { window.Modal.close('modal-cf'); });
  document.getElementById('cf-submit').addEventListener('click', async () => {
    const rating = parseInt(document.getElementById('cf-rating-input').value, 10);
    const name   = document.getElementById('cf-contest-input').value;
    if (isNaN(rating) || rating < 0) { window.showToast('Enter a valid rating.', 'error'); return; }
    await window.api.cf.add({ rating, contestName: name });
    window.Modal.close('modal-cf');
    document.getElementById('cf-rating-input').value = '';
    document.getElementById('cf-contest-input').value = '';
    window.showToast('CF rating logged ✓', 'success');
    render();
  });

  return { render };
})();
