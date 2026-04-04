// Smooth active nav highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav ul a');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(`nav ul a[href="#${entry.target.id}"]`);
      if (active) active.style.color = 'var(--text)';
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));

// Fade-in on scroll
const fadeEls = document.querySelectorAll('.project-card, .skill-group, .about-grid');
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  fadeObserver.observe(el);
});

// ── Tetris ──
(function () {
  const canvas = document.getElementById('tetris');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('tetris-score-val');
  if (!scoreEl) return;

  const COLS = 10, ROWS = 20, S = 20;

  const COLORS = [
    '#00f0f0', // I cyan
    '#f0f000', // O yellow
    '#a000f0', // T purple
    '#00f000', // S green
    '#f00000', // Z red
    '#0000f0', // J blue
    '#f0a000', // L orange
  ];

  const SHAPES = [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
    [[1,1],[1,1]],                               // O
    [[0,1,0],[1,1,1],[0,0,0]],                  // T
    [[0,1,1],[1,1,0],[0,0,0]],                  // S
    [[1,1,0],[0,1,1],[0,0,0]],                  // Z
    [[1,0,0],[1,1,1],[0,0,0]],                  // J
    [[0,0,1],[1,1,1],[0,0,0]],                  // L
  ];

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
    ctx.fillStyle = color;
    ctx.fillRect(x * S + 1, y * S + 1, S - 2, S - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x * S + 1, y * S + 1, S - 2, 3);
    ctx.fillRect(x * S + 1, y * S + 1, 3, S - 2);
  }

  function draw() {
    // Clip to rounded corners to match CSS border-radius
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 12);
    ctx.clip();

    // Background
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * S, 0); ctx.lineTo(c * S, ROWS * S); ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * S); ctx.lineTo(COLS * S, r * S); ctx.stroke();
    }

    // Placed board cells
    board.forEach((row, r) =>
      row.forEach((color, c) => { if (color) drawCell(c, r, color); })
    );

    // Active piece
    if (!isGameOver) {
      piece.shape.forEach((row, dy) =>
        row.forEach((cell, dx) => {
          if (cell) drawCell(piece.x + dx, piece.y + dy, piece.color);
        })
      );
    }

    // Ghost piece (shows where piece will land)
    if (!isGameOver) {
      let ghostY = piece.y;
      while (isValid(piece.shape, piece.x, ghostY + 1)) ghostY++;
      if (ghostY !== piece.y) {
        ctx.globalAlpha = 0.2;
        piece.shape.forEach((row, dy) =>
          row.forEach((cell, dx) => {
            if (cell) drawCell(piece.x + dx, ghostY + dy, piece.color);
          })
        );
        ctx.globalAlpha = 1;
      }
    }

    // Game over overlay
    if (isGameOver) {
      ctx.fillStyle = 'rgba(13,17,23,0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 12);
      ctx.fillStyle = '#8b949e';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('click to restart', canvas.width / 2, canvas.height / 2 + 10);
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

  // Track canvas visibility so arrow keys don't block page scroll
  let canvasVisible = true;
  new IntersectionObserver(([entry]) => {
    canvasVisible = entry.isIntersecting;
  }, { threshold: 0.1 }).observe(canvas);

  // Keyboard controls
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

  // Touch/click zones: left third = left, right third = right, bottom third = hard drop, center top = rotate
  canvas.addEventListener('click', e => {
    if (isGameOver) { reset(); return; }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;
    if (cy > canvas.height * 0.67) {
      while (isValid(piece.shape, piece.x, piece.y + 1)) piece.y++;
      place();
      lastDrop = performance.now();
    } else if (cx < canvas.width * 0.33) {
      if (isValid(piece.shape, piece.x - 1, piece.y)) piece.x--;
    } else if (cx > canvas.width * 0.67) {
      if (isValid(piece.shape, piece.x + 1, piece.y)) piece.x++;
    } else {
      const r = rotate(piece.shape);
      if (isValid(r, piece.x, piece.y)) piece.shape = r;
    }
  });

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) lastDrop = performance.now();
  });

  reset();
})();
