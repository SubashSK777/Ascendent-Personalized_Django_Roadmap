'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   dashboard.js — Power Core Canvas animation + Dashboard stats rendering
   ═══════════════════════════════════════════════════════════════════════════ */

window.DashboardModule = (() => {
  // ─── Power Core Canvas ────────────────────────────────────────────────────
  const canvas = document.getElementById('power-core-canvas');
  const ctx    = canvas.getContext('2d');
  const W = 320, H = 320, CX = W / 2, CY = H / 2;
  canvas.width  = W;
  canvas.height = H;

  let angle       = 0;
  let currentPct  = 0;
  let targetPct   = 0;
  let animFrame   = null;

  // Colour of the core based on progress
  function coreColor(pct) {
    if (pct < 25) return lerpRGB([220, 20, 60], [139, 92, 246], pct / 25);        // crimson → purple
    if (pct < 60) return lerpRGB([139,92,246], [255,107,53], (pct-25) / 35);  // purple → orange
    return lerpRGB([255,107,53], [255,215,0], (pct-60) / 40);                 // orange → gold
  }

  function lerpRGB(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return [
      Math.round(a[0] + (b[0]-a[0]) * t),
      Math.round(a[1] + (b[1]-a[1]) * t),
      Math.round(a[2] + (b[2]-a[2]) * t),
    ];
  }
  function rgba([r,g,b], a=1) { return `rgba(${r},${g},${b},${a})`; }

  function drawHexagon(cx, cy, r, rotation, lineWidth, color, alpha=1) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + rotation;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    ctx.lineWidth   = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  function drawOrbit(cx, cy, r, speed, dotCount, color, pct) {
    for (let i = 0; i < dotCount; i++) {
      const a = angle * speed + (Math.PI * 2 / dotCount) * i;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      const glow = ctx.createRadialGradient(x,y,0, x,y,5);
      glow.addColorStop(0, rgba(color, 1));
      glow.addColorStop(1, rgba(color, 0));
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }
  }

  function drawCore(pct) {
    ctx.clearRect(0, 0, W, H);
    const col = coreColor(pct);
    const intensity = 0.4 + (pct / 100) * 0.6;
    const pulse     = Math.sin(angle * 2) * 0.1 + 0.9;

    // Outer glow
    const outerGlow = ctx.createRadialGradient(CX,CY,40, CX,CY,140);
    outerGlow.addColorStop(0, rgba(col, 0.15 * intensity * pulse));
    outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(0, 0, W, H);

    // Rotating outer hex rings
    drawHexagon(CX,CY, 130, angle * 0.3,       1.5, col, 0.12 * intensity);
    drawHexagon(CX,CY, 115, -angle * 0.5,      1,   col, 0.18 * intensity);

    // Orbit rings
    drawOrbit(CX,CY, 100, 1.0, 6, col, pct);
    drawOrbit(CX,CY, 80,  -1.5, 4, col, pct);

    // Middle hex grid
    drawHexagon(CX,CY, 78,  angle * 0.8,   1.5, col, 0.35 * intensity);
    drawHexagon(CX,CY, 60, -angle * 1.0,   1,   col, 0.25 * intensity);

    // Progress arc
    const arcStart = -Math.PI / 2;
    const arcEnd   = arcStart + Math.PI * 2 * (pct / 100);
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, 90, arcStart, arcEnd);
    ctx.strokeStyle = rgba(col, 0.7);
    ctx.lineWidth   = 3;
    ctx.shadowColor = rgba(col, 0.8);
    ctx.shadowBlur  = 10;
    ctx.stroke();
    ctx.restore();

    // Inner core gradient fill
    const coreGrad = ctx.createRadialGradient(CX,CY,0, CX,CY,50);
    coreGrad.addColorStop(0, rgba(col, 0.5 * pulse));
    coreGrad.addColorStop(0.6, rgba(col, 0.15 * pulse));
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(CX, CY, 50, 0, Math.PI * 2);
    ctx.fill();

    // Inner hex (solid)
    drawHexagon(CX,CY, 38, angle * 1.5,   2, col, 0.8 * intensity * pulse);
    drawHexagon(CX,CY, 24, -angle * 2.0,  1.5, col, 0.6 * intensity * pulse);

    // Center dot
    ctx.beginPath();
    ctx.arc(CX, CY, 6, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, intensity);
    ctx.shadowColor = rgba(col, 1);
    ctx.shadowBlur  = 20;
    ctx.fill();

    // Energy particles (small dots at random positions seeded by pct)
    if (pct > 5) {
      const count = Math.floor(pct / 10) + 2;
      for (let i = 0; i < count; i++) {
        const seed = (i * 137.5 + angle * 60) % (Math.PI * 2);
        const dist = 55 + (i % 3) * 20;
        const px   = CX + dist * Math.cos(seed);
        const py   = CY + dist * Math.sin(seed);
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, 0.4 + (i % 3) * 0.2);
        ctx.fill();
      }
    }
  }

  function animate() {
    angle += 0.008;
    // Smoothly approach target pct
    if (Math.abs(currentPct - targetPct) > 0.1) {
      currentPct += (targetPct - currentPct) * 0.05;
    } else {
      currentPct = targetPct;
    }
    drawCore(currentPct);
    animFrame = requestAnimationFrame(animate);
  }

  // ─── Stats Rendering ───────────────────────────────────────────────────────
  function renderStats(stats, nodes) {
    targetPct = stats.overallPercent;

    document.getElementById('core-pct').textContent =
      `${stats.overallPercent}%`;

    document.getElementById('stat-total-hours').textContent =
      `${Number(stats.totalHours).toFixed(1)}h`;

    document.getElementById('stat-done-nodes').textContent =
      `${stats.completedNodes}/${stats.totalNodes}`;

    document.getElementById('stat-week-hours').textContent =
      `${Number(stats.weekHours).toFixed(1)}h`;

    const remaining = Math.max(0, stats.totalEstimated - stats.totalHours);
    document.getElementById('stat-remaining').textContent =
      `${Math.round(remaining)}h`;

    const curPhase = stats.currentPhase;
    const meta     = window.PHASE_META[curPhase] || window.PHASE_META[0];
    document.getElementById('phase-badge').textContent = `Phase ${curPhase}`;
    document.getElementById('phase-name').textContent  = meta.name;

    // Current phase nodes
    const phaseNodes = nodes.filter(n => n.phase_number === curPhase);
    const listEl     = document.getElementById('phase-nodes-list');
    listEl.innerHTML = phaseNodes.map(n => {
      const status = window.getNodeStatus(n, nodes);
      const icon   = n.is_completed ? '✓' : (status === 'active' ? '⚡' : '🔒');
      const color  = n.is_completed ? 'var(--green)' : (status === 'active' ? 'var(--cyan)' : 'var(--text-muted)');
      return `
        <div class="phase-node-item">
          <span class="phase-node-status" style="color:${color}">${icon}</span>
          <span class="phase-node-name">${n.title}</span>
          <div class="phase-node-bar-wrap">
            <div class="phase-node-bar" style="width:${n.is_completed ? 100 : 0}%;background:${color}"></div>
          </div>
        </div>`;
    }).join('') || '<div class="empty-state" style="padding:12px">All nodes in this phase complete! 🎉</div>';
  }

  function renderActivity(recentActivity) {
    const list = document.getElementById('activity-list');
    if (!recentActivity || recentActivity.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚡</div>
          <div class="empty-text">No sessions logged yet.</div>
          <div class="empty-sub">Begin your first study session to light the core.</div>
        </div>`;
      return;
    }
    list.innerHTML = recentActivity.map(a => `
      <div class="activity-item">
        <span class="activity-type-badge ${a.log_type}">${a.log_type}</span>
        <span class="activity-node-name">${a.node_title}</span>
        <span class="activity-hours">${window.formatHours(a.hours_logged)}</span>
        <span class="activity-time">${window.timeAgo(a.timestamp)}</span>
      </div>`).join('');
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  async function refresh() {
    const stats = await window.api.progress.stats();
    window.AppState.stats = stats;
    await window.AppState.reloadNodes();
    renderStats(stats, window.AppState.nodes);
    renderActivity(stats.recentActivity);
    await window.refreshSidebarStats();
  }

  function init() {
    animate();
    refresh();
  }

  return { init, refresh };
})();
