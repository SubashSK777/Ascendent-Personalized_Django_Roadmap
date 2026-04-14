'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   roadmap.js — Custom Canvas + DOM skill tree with phase tabs,
                node state visualization, and dependency arrows.
   Key fix: render() is NOT called on init — only when page tab is activated,
   so the wrap never has display:none when we measure dimensions.
   ═══════════════════════════════════════════════════════════════════════════ */

window.RoadmapModule = (() => {
  const PHASE_COUNT = 7;
  let selectedPhase = 'all';
  let arrowCanvas   = null;
  let arrowCtx      = null;

  // Layout constants
  const NODE_W = 166;
  const NODE_H = 96;
  const GAP_X  = 54;   // horizontal gap between columns
  const GAP_Y  = 28;   // vertical gap between rows
  const PAD_X  = 28;
  const PAD_Y  = 28;
  const COL_W  = NODE_W + GAP_X;  // 220px per column

  // ─── Phase Tab Rendering ────────────────────────────────────────────────
  function renderPhaseTabs() {
    const container = document.getElementById('phase-tabs');
    const tabs = [
      { num: 'all', label: 'All Phases' },
      ...window.PHASE_META.map(m => ({ num: m.num, label: `P${m.num}: ${m.name}` })),
    ];
    container.innerHTML = tabs.map(t => `
      <button class="phase-tab ${selectedPhase === t.num ? 'active' : ''}" data-phase="${t.num}">
        ${t.label}
      </button>`).join('');

    container.querySelectorAll('.phase-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedPhase = btn.dataset.phase === 'all' ? 'all' : parseInt(btn.dataset.phase, 10);
        render();
      });
    });
  }

  // ─── Node DOM Card ──────────────────────────────────────────────────────
  function createNodeEl(node, status, x, y) {
    const el = document.createElement('div');
    el.className = [
      'stn-node',
      status === 'completed' ? 'is-completed' : '',
      status === 'active'    ? 'is-active'    : '',
      status === 'locked'    ? 'is-locked'    : '',
    ].join(' ').trim();

    el.dataset.id    = node.id;
    el.dataset.phase = node.phase_number;
    el.style.left    = `${x}px`;
    el.style.top     = `${y}px`;
    el.style.width   = `${NODE_W}px`;

    const phaseColor = window.phaseColor(node.phase_number);
    const diffClass  = `diff-${node.difficulty}`;
    const icon = status === 'completed' ? '✓' : status === 'active' ? '⚡' : '🔒';

    el.innerHTML = `
      <div class="stn-node-phase" style="color:${phaseColor}">Phase ${node.phase_number} · #${node.node_order}</div>
      <div class="stn-node-title">${node.title}</div>
      <div class="stn-node-footer">
        <span class="stn-diff ${diffClass}">${node.difficulty}</span>
        <span class="stn-hours">${node.estimated_hours}h</span>
        <span class="stn-check">${icon}</span>
      </div>`;

    el.addEventListener('click', () => {
      if (status === 'locked') {
        // Flash red warning
        const orig    = el.style.borderColor;
        const origShadow = el.style.boxShadow;
        el.style.borderColor = 'var(--red)';
        el.style.boxShadow   = '0 0 16px rgba(239,68,68,0.5)';
        window.showToast(`🔒 Prerequisites not met for "${node.title}"`, 'error');
        setTimeout(() => { el.style.borderColor = orig; el.style.boxShadow = origShadow; }, 1200);
      } else {
        window.NodeDetailModule && window.NodeDetailModule.open(node.id);
      }
    });

    return el;
  }

  // ─── Arrow Drawing ──────────────────────────────────────────────────────
  function drawArrows(positions, canvasW, canvasH) {
    arrowCanvas.width  = canvasW;
    arrowCanvas.height = canvasH;
    arrowCtx.clearRect(0, 0, canvasW, canvasH);

    const nodes = window.AppState.nodes;

    nodes.forEach(node => {
      if (!node.prerequisites || !node.prerequisites.trim()) return;
      const prereqIds = node.prerequisites.split(',').map(s => s.trim()).filter(Boolean);

      prereqIds.forEach(pid => {
        const fromPos = positions[pid];
        const toPos   = positions[node.id];
        // Only draw if both nodes are visible (filtered by phase)
        if (!fromPos || !toPos) return;

        const prereqNode = nodes.find(n => n.id === pid);
        const isDone     = prereqNode && prereqNode.is_completed;
        const nodeStatus = window.getNodeStatus(node, nodes);

        const fromX = fromPos.x + NODE_W;
        const fromY = fromPos.y + NODE_H / 2;
        const toX   = toPos.x;
        const toY   = toPos.y + NODE_H / 2;

        // Colour: green if prereq done, otherwise dim cyan
        const lineColor = isDone
          ? 'rgba(16,185,129,0.75)'
          : nodeStatus === 'active' ? 'rgba(220, 20, 60, 0.4)' : 'rgba(220, 20, 60, 0.12)';

        const cpX1 = fromX + (toX - fromX) * 0.45;
        const cpX2 = fromX + (toX - fromX) * 0.55;

        arrowCtx.beginPath();
        arrowCtx.moveTo(fromX, fromY);
        arrowCtx.bezierCurveTo(cpX1, fromY, cpX2, toY, toX, toY);
        arrowCtx.strokeStyle = lineColor;
        arrowCtx.lineWidth   = isDone ? 2 : 1.2;
        arrowCtx.setLineDash(isDone ? [] : [5, 5]);
        arrowCtx.stroke();
        arrowCtx.setLineDash([]);

        // Arrowhead
        arrowCtx.beginPath();
        arrowCtx.moveTo(toX, toY);
        arrowCtx.lineTo(toX - 9, toY - 5);
        arrowCtx.lineTo(toX - 9, toY + 5);
        arrowCtx.closePath();
        arrowCtx.fillStyle = lineColor;
        arrowCtx.fill();
      });
    });
  }

  // ─── Main Render ────────────────────────────────────────────────────────
  function render() {
    renderPhaseTabs();

    const nodes     = window.AppState.nodes;
    const container = document.getElementById('skill-tree-nodes');
    container.innerHTML = '';

    const wrap = document.getElementById('skill-tree-wrap');

    // Ensure arrow canvas exists (attached once)
    if (!arrowCanvas) {
      arrowCanvas = document.createElement('canvas');
      arrowCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:0;';
      wrap.prepend(arrowCanvas);
      arrowCtx = arrowCanvas.getContext('2d');
    }

    // Filter visible nodes
    const visible = selectedPhase === 'all'
      ? nodes
      : nodes.filter(n => n.phase_number === selectedPhase);

    if (visible.length === 0) {
      container.innerHTML = '<div class="empty-state" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><div class="empty-icon">🔒</div><div class="empty-text">No nodes for this phase.</div></div>';
      return;
    }

    // Group by phase → columns, within phase by order → rows
    const phaseMap = {};
    visible.forEach(n => {
      if (!phaseMap[n.phase_number]) phaseMap[n.phase_number] = [];
      phaseMap[n.phase_number].push(n);
    });
    const phases = Object.keys(phaseMap).map(Number).sort((a,b) => a - b);

    // Compute positions
    const positions = {};
    let maxX = 0;
    let maxY = 0;

    phases.forEach((phase, colIdx) => {
      const phNodes = [...phaseMap[phase]].sort((a,b) => a.node_order - b.node_order);
      phNodes.forEach((node, rowIdx) => {
        const x = PAD_X + colIdx * COL_W;
        const y = PAD_Y + rowIdx * (NODE_H + GAP_Y);
        positions[node.id] = { x, y };
        maxX = Math.max(maxX, x + NODE_W + PAD_X);
        maxY = Math.max(maxY, y + NODE_H + PAD_Y);
      });
    });

    const canvasW = Math.max(900, maxX);
    const canvasH = Math.max(520, maxY);

    // Size the container and wrap
    wrap.style.height       = `${canvasH}px`;
    container.style.width   = `${canvasW}px`;
    container.style.height  = `${canvasH}px`;

    // Render node cards
    visible.forEach(node => {
      const status = window.getNodeStatus(node, nodes);
      const pos    = positions[node.id];
      if (!pos) return;
      container.appendChild(createNodeEl(node, status, pos.x, pos.y));
    });

    // Draw arrows slightly deferred so DOM has painted
    setTimeout(() => drawArrows(positions, canvasW, canvasH), 60);
  }

  // ─── Public API ─────────────────────────────────────────────────────────
  // init() intentionally does NOT call render() — the page is display:none
  // on boot, so scrollWidth/clientWidth measurements would be wrong.
  // render() is triggered by navigateTo('roadmap') in app.js.
  function init() { /* no-op — render on demand */ }

  return { init, render };
})();
