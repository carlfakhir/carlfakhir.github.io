// ═══════════════════════════════════════════════════════════
// Carl Fakhir · v3 · interactive 3D portfolio
// ═══════════════════════════════════════════════════════════

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ─────────────────────────────────────────────────────────
// 3D background — perspective dot grid w/ subtle wave + mouse parallax
// (custom Canvas2D, no Three.js — keeps it under a few KB)
// ─────────────────────────────────────────────────────────
(function bg3D() {
  const canvas = document.getElementById('bg-3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let W = 0, H = 0, dpr = 1;
  let camX = 0, camY = 0;
  let targetCamX = 0, targetCamY = 0;
  let scrollY = 0, targetScrollY = 0;
  let t = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Dot grid: column count × row count in world space
  const GRID_X = 22;  // half-width of grid in x cells
  const GRID_Z = 30;  // depth in cells
  const CELL = 60;    // world-space cell size
  const FOV = 540;    // focal length
  const TILT = 0.55;  // pitch of the floor (radians)
  const FLOOR_Y = 220; // world-space Y of the floor (below camera)

  function project(wx, wy, wz) {
    // pitch around X axis
    const cy = Math.cos(TILT), sy = Math.sin(TILT);
    const ry = wy * cy - wz * sy;
    const rz = wy * sy + wz * cy;
    if (rz <= 1) return null;
    const sx = (wx * FOV) / rz + W / 2 + camX * 30;
    const sy2 = (ry * FOV) / rz + H / 2 + camY * 30;
    return { x: sx, y: sy2, depth: rz };
  }

  function frame() {
    if (reduceMotion) {
      ctx.clearRect(0, 0, W, H);
      drawStill();
      return;
    }
    requestAnimationFrame(frame);
    t += 0.008;

    camX += (targetCamX - camX) * 0.04;
    camY += (targetCamY - camY) * 0.04;
    scrollY += (targetScrollY - scrollY) * 0.06;

    ctx.clearRect(0, 0, W, H);
    drawGrid();
  }

  function drawGrid() {
    const advance = (t * 80 + scrollY * 0.6) % CELL;

    // Draw from far to near so near dots draw on top
    for (let zi = GRID_Z; zi >= 0; zi--) {
      const wz = zi * CELL - advance + 80;
      for (let xi = -GRID_X; xi <= GRID_X; xi++) {
        const wx = xi * CELL;

        // gentle wave
        const wave = Math.sin((wz * 0.02) + (wx * 0.018) + t * 1.4) * 6;
        const wy = FLOOR_Y + wave;

        const p = project(wx, wy, wz);
        if (!p) continue;
        if (p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) continue;

        const fade = 1 - Math.min(1, wz / (GRID_Z * CELL));
        // soft fall-off
        const alpha = Math.pow(fade, 1.6);
        if (alpha < 0.03) continue;

        // Size attenuates by depth
        const r = Math.max(0.4, (1.4 * FOV) / p.depth);

        // Highlight dots near the cursor in screen space
        const dx = p.x - (W / 2 + camX * 220);
        const dy = p.y - (H / 2 + camY * 120);
        const distSq = dx * dx + dy * dy;
        const highlight = Math.max(0, 1 - distSq / (320 * 320));

        // Color: lime accent on highlighted dots, soft white otherwise
        if (highlight > 0.05) {
          const a = alpha * 0.7 + highlight * 0.6;
          ctx.fillStyle = `rgba(194, 255, 61, ${Math.min(0.9, a)})`;
        } else {
          ctx.fillStyle = `rgba(200, 210, 230, ${alpha * 0.22})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawStill() {
    // simple still grid for reduced-motion users
    for (let zi = GRID_Z; zi >= 0; zi--) {
      const wz = zi * CELL + 80;
      for (let xi = -GRID_X; xi <= GRID_X; xi++) {
        const p = project(xi * CELL, FLOOR_Y, wz);
        if (!p) continue;
        const fade = 1 - Math.min(1, wz / (GRID_Z * CELL));
        ctx.fillStyle = `rgba(200, 210, 230, ${Math.pow(fade, 1.6) * 0.22})`;
        const r = Math.max(0.4, (1.4 * FOV) / p.depth);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  window.addEventListener('mousemove', (e) => {
    targetCamX = (e.clientX / W) - 0.5;
    targetCamY = (e.clientY / H) - 0.5;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  }, { passive: true });

  if (reduceMotion) frame();
  else requestAnimationFrame(frame);
})();

// ─────────────────────────────────────────────────────────
// Custom cursor
// ─────────────────────────────────────────────────────────
(function cursor() {
  if (!isFinePointer) return;
  const el = document.getElementById('cursor');
  if (!el) return;
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let tx = x, ty = y;

  function loop() {
    requestAnimationFrame(loop);
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  // hover state
  document.querySelectorAll('a, button, [data-tilt], .btn, #tetris, .chip, .stack-filter').forEach(node => {
    node.addEventListener('mouseenter', () => el.classList.add('is-hover'));
    node.addEventListener('mouseleave', () => el.classList.remove('is-hover'));
  });

  requestAnimationFrame(loop);
})();

// ─────────────────────────────────────────────────────────
// Tilt — `[data-tilt]` wraps `[data-tilt-inner]`
// Smooth perspective rotateX/Y based on mouse position
// ─────────────────────────────────────────────────────────
(function tilt() {
  if (reduceMotion || !isFinePointer) return;

  document.querySelectorAll('[data-tilt]').forEach(wrap => {
    const inner = wrap.querySelector('[data-tilt-inner]') || wrap.firstElementChild;
    if (!inner) return;
    const max = parseFloat(wrap.dataset.tiltMax || '8');

    let raf = null;
    let mx = 0, my = 0;

    function update() {
      raf = null;
      inner.style.transform = `rotateX(${-my * max}deg) rotateY(${mx * max}deg) translateZ(0)`;
      // shine position (for entries / contact cards)
      const rx = (mx + 0.5) * 100;
      const ry = (my + 0.5) * 100;
      inner.style.setProperty('--mx', `${rx}%`);
      inner.style.setProperty('--my', `${ry}%`);
    }

    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width - 0.5;
      my = (e.clientY - rect.top) / rect.height - 0.5;
      if (!raf) raf = requestAnimationFrame(update);
    });

    wrap.addEventListener('mouseleave', () => {
      mx = 0; my = 0;
      inner.style.transition = 'transform 0.5s cubic-bezier(.2,.7,.3,1)';
      inner.style.transform = 'rotateX(0) rotateY(0) translateZ(0)';
      setTimeout(() => { inner.style.transition = ''; }, 500);
    });
  });
})();

// ─────────────────────────────────────────────────────────
// Side-rail active section + fade-in on scroll
// ─────────────────────────────────────────────────────────
(function scrollObservers() {
  const sections = document.querySelectorAll('section[id]');
  const railLinks = document.querySelectorAll('.rail a');

  const railObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        railLinks.forEach(a => a.classList.remove('is-active'));
        const active = document.querySelector(`.rail a[data-rail="${entry.target.id}"]`);
        if (active) active.classList.add('is-active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => railObs.observe(s));

  const fadeEls = document.querySelectorAll('.entry, .stack-card, .cnode, .stat-card, .chap-head');
  const fadeObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        fadeObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  fadeEls.forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${Math.min(i * 50, 250)}ms`;
    fadeObs.observe(el);
  });
})();

// ─────────────────────────────────────────────────────────
// Stack matrix — filter pills + animated chip filtering
// ─────────────────────────────────────────────────────────
(function stackMatrix() {
  const matrix = document.getElementById('stack-matrix');
  if (!matrix) return;
  const chips = Array.from(matrix.querySelectorAll('.chip'));
  const filters = document.querySelectorAll('.stack-filter');
  const totalEl = document.getElementById('stack-total');
  const countEl = document.getElementById('stack-count');

  // counts per category
  const counts = { all: chips.length };
  chips.forEach(chip => {
    (chip.dataset.cats || '').split(/\s+/).filter(Boolean).forEach(cat => {
      counts[cat] = (counts[cat] || 0) + 1;
    });
  });
  document.querySelectorAll('.stack-filter .ct').forEach(el => {
    const cat = el.dataset.count;
    el.textContent = counts[cat] ?? 0;
  });
  if (totalEl) totalEl.textContent = chips.length;
  if (countEl) countEl.textContent = chips.length;

  function applyFilter(cat) {
    let visible = 0;
    chips.forEach((chip, i) => {
      const cats = (chip.dataset.cats || '').split(/\s+/);
      const match = cat === 'all' || cats.includes(cat);
      chip.classList.toggle('is-dim', !match);
      chip.style.transitionDelay = match ? `${Math.min(i * 8, 120)}ms` : '0ms';
      if (match) visible++;
    });
    if (countEl) countEl.textContent = visible;
  }

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilter(btn.dataset.filter);
    });
  });
})();

// ─────────────────────────────────────────────────────────
// Atlanta clock
// ─────────────────────────────────────────────────────────
(function atlClock() {
  const el = document.getElementById('atl-time');
  if (!el) return;

  function tick() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).formatToParts(new Date());
      const get = (t) => parts.find(p => p.type === t)?.value || '00';
      el.textContent = `${get('hour')}:${get('minute')}:${get('second')} PT`;
    } catch {
      el.textContent = '';
    }
  }
  tick();
  setInterval(tick, 1000);
})();

// ─────────────────────────────────────────────────────────
// Tetris — Fig. 01
// ─────────────────────────────────────────────────────────
(function tetris() {
  const canvas = document.getElementById('tetris');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('tetris-score-val');
  if (!scoreEl) return;

  const COLS = 10, ROWS = 20, S = 20;

  const COLORS = [
    '#00d4d4', // I  cyan
    '#f0c800', // O  yellow
    '#a040d0', // T  purple
    '#28b048', // S  green
    '#d83020', // Z  red
    '#3848c8', // J  blue
    '#f08820', // L  orange
  ];

  const SHAPES = [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
    [[1,1],[1,1]],                              // O
    [[0,1,0],[1,1,1],[0,0,0]],                  // T
    [[0,1,1],[1,1,0],[0,0,0]],                  // S
    [[1,1,0],[0,1,1],[0,0,0]],                  // Z
    [[1,0,0],[1,1,1],[0,0,0]],                  // J
    [[0,0,1],[1,1,1],[0,0,0]],                  // L
  ];

  const BG = '#0a0b10';
  const GRID = 'rgba(255, 255, 255, 0.035)';
  const TEXT = '#ecedee';
  const MUTE = '#6a6d76';
  const LIME = '#c2ff3d';

  let board, piece, score, isGameOver, paused, dropInterval, lastDrop, animId;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function randomPiece() {
    const i = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[i].map(r => [...r]);
    const x = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
    return { shape, color: COLORS[i], x, y: 0 };
  }

  function rotate(shape) {
    const rows = shape.length, cols = shape[0].length;
    return Array.from({ length: cols }, (_, c) =>
      Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
    );
  }

  function isValid(shape, x, y) {
    return shape.every((row, dy) =>
      row.every((cell, dx) => {
        if (!cell) return true;
        const nx = x + dx, ny = y + dy;
        return nx >= 0 && nx < COLS && ny < ROWS && (ny < 0 || !board[ny][nx]);
      })
    );
  }

  function clearLines() {
    let count = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(c => c !== null)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        count++;
        r++;
      }
    }
    return count;
  }

  function place() {
    piece.shape.forEach((row, dy) =>
      row.forEach((cell, dx) => {
        if (cell && piece.y + dy >= 0) {
          board[piece.y + dy][piece.x + dx] = piece.color;
        }
      })
    );
    const cleared = clearLines();
    const points = [0, 100, 300, 500, 800][cleared] || 0;
    score += points;
    scoreEl.textContent = String(score).padStart(4, '0');
    dropInterval = Math.max(100, 500 - Math.floor(score / 500) * 20);
    piece = randomPiece();
    if (!isValid(piece.shape, piece.x, piece.y)) {
      isGameOver = true;
    }
  }

  function drawCell(x, y, color) {
    // base block
    ctx.fillStyle = color;
    ctx.fillRect(x * S + 1, y * S + 1, S - 2, S - 2);
    // top-left highlight (3D bevel)
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(x * S + 1, y * S + 1, S - 2, 2);
    ctx.fillRect(x * S + 1, y * S + 1, 2, S - 2);
    // bottom-right shadow
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(x * S + 1, y * S + S - 3, S - 2, 2);
    ctx.fillRect(x * S + S - 3, y * S + 1, 2, S - 2);
    // inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x * S + 4, y * S + 4, S - 8, S - 8);
  }

  function draw() {
    ctx.save();
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid lines
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * S, 0); ctx.lineTo(c * S, ROWS * S); ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * S); ctx.lineTo(COLS * S, r * S); ctx.stroke();
    }

    // placed
    board.forEach((row, r) =>
      row.forEach((color, c) => { if (color) drawCell(c, r, color); })
    );

    // ghost
    if (!isGameOver) {
      let ghostY = piece.y;
      while (isValid(piece.shape, piece.x, ghostY + 1)) ghostY++;
      if (ghostY !== piece.y) {
        ctx.globalAlpha = 0.22;
        piece.shape.forEach((row, dy) =>
          row.forEach((cell, dx) => {
            if (cell) drawCell(piece.x + dx, ghostY + dy, piece.color);
          })
        );
        ctx.globalAlpha = 1;
      }
    }

    // active piece
    if (!isGameOver) {
      piece.shape.forEach((row, dy) =>
        row.forEach((cell, dx) => {
          if (cell) drawCell(piece.x + dx, piece.y + dy, piece.color);
        })
      );
    }

    // game-over
    if (isGameOver) {
      ctx.fillStyle = 'rgba(10, 11, 16, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.fillStyle = LIME;
      ctx.font = '600 11px "Geist Mono", monospace';
      ctx.fillText('— FIN —', canvas.width / 2, canvas.height / 2 - 28);

      ctx.fillStyle = TEXT;
      ctx.font = '700 14px "Geist Mono", monospace';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 6);

      ctx.fillStyle = MUTE;
      ctx.font = '11px "Geist Mono", monospace';
      ctx.fillText('score: ' + String(score).padStart(4, '0'), canvas.width / 2, canvas.height / 2 + 14);
      ctx.fillText('click to restart', canvas.width / 2, canvas.height / 2 + 34);
    }

    ctx.restore();
  }

  function loop(ts) {
    animId = requestAnimationFrame(loop);
    if (paused || isGameOver) { draw(); return; }
    if (ts - lastDrop > dropInterval) {
      if (isValid(piece.shape, piece.x, piece.y + 1)) {
        piece.y++;
      } else {
        place();
      }
      lastDrop = ts;
    }
    draw();
  }

  function reset() {
    board = createBoard();
    piece = randomPiece();
    score = 0;
    isGameOver = false;
    dropInterval = 500;
    lastDrop = performance.now();
    scoreEl.textContent = '0000';
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  let canvasVisible = false;
  new IntersectionObserver(([entry]) => {
    canvasVisible = entry.isIntersecting;
  }, { threshold: 0.1 }).observe(canvas);

  document.addEventListener('keydown', e => {
    if (isGameOver || paused || !canvasVisible) return;
    const preventKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '];
    if (preventKeys.includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowLeft'  && isValid(piece.shape, piece.x - 1, piece.y)) piece.x--;
    if (e.key === 'ArrowRight' && isValid(piece.shape, piece.x + 1, piece.y)) piece.x++;
    if (e.key === 'ArrowDown'  && isValid(piece.shape, piece.x, piece.y + 1)) piece.y++;
    if (e.key === 'ArrowUp') {
      const r = rotate(piece.shape);
      if (isValid(r, piece.x, piece.y)) piece.shape = r;
    }
    if (e.key === ' ') {
      while (isValid(piece.shape, piece.x, piece.y + 1)) piece.y++;
      place();
      lastDrop = performance.now();
    }
  });

  canvas.addEventListener('click', () => { if (isGameOver) reset(); });

  // Touch
  let touchStartX = 0, touchStartY = 0, touchLastX = 0;
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    touchStartX = touchLastX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (isGameOver || paused) return;
    const t = e.touches[0];
    const cellW = canvas.getBoundingClientRect().width / COLS;
    const dx = t.clientX - touchLastX;
    if (Math.abs(dx) >= cellW) {
      const dir = dx > 0 ? 1 : -1;
      if (isValid(piece.shape, piece.x + dir, piece.y)) piece.x += dir;
      touchLastX += dir * cellW;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (isGameOver) { reset(); return; }
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const r = rotate(piece.shape);
      if (isValid(r, piece.x, piece.y)) piece.shape = r;
    } else if (dy > 40 && Math.abs(dy) > Math.abs(dx)) {
      while (isValid(piece.shape, piece.x, piece.y + 1)) piece.y++;
      place();
      lastDrop = performance.now();
    }
  }, { passive: false });

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) lastDrop = performance.now();
  });

  reset();
})();
