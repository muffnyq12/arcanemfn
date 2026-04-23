(function() {
    /**
     * TETRIS PRO: NEON ULTIMATE - PAUSE/RESUME & GESTURE EDITION
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 10;
    const ROWS = 20;
    let BLOCK_SIZE;
    let grid = [];
    
    let score = 0; let lines = 0; let level = 1;
    let gameOver = false; let isPaused = false;
    let nextPiece; let holdPiece = null;
    let canHold = true; let dropCounter = 0; let dropInterval = 1000;
    let lastTime = 0; let shake = 0;

    const COLORS = [null, '#00f2ff', '#0077ff', '#ffaa00', '#ffff00', '#39ff14', '#bc13fe', '#ff0077'];
    const SHAPES = [null, 
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[2,0,0],[2,2,2],[0,0,0]],
        [[0,0,3],[3,3,3],[0,0,0]],
        [[4,4],[4,4]],
        [[0,5,5],[5,5,0],[0,0,0]],
        [[0,6,0],[6,6,6],[0,0,0]],
        [[7,7,0],[0,7,7],[0,0,0]]
    ];

    function createPiece(type) { return { pos: { x: 3, y: 0 }, matrix: SHAPES[type], type: type }; }
    function resetGrid() { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }

    function resize() {
        const container = document.getElementById('game-canvas-container');
        if (container) {
            canvas.width = container.offsetWidth; canvas.height = container.offsetHeight;
            const isMobile = window.innerWidth <= 1366;
            if (isMobile) {
                BLOCK_SIZE = Math.floor((canvas.width * 0.90) / COLS);
                if (BLOCK_SIZE * ROWS > canvas.height * 0.50) BLOCK_SIZE = Math.floor((canvas.height * 0.50) / ROWS);
            } else BLOCK_SIZE = Math.floor((canvas.height * 0.98) / ROWS);
            setupMobileControls();
        }
    }
    window.addEventListener('resize', resize);

    let player = { pos: { x: 0, y: 0 }, matrix: null, type: 0 };

    function playerReset() {
        if (!nextPiece) nextPiece = createPiece(Math.floor(Math.random() * 7) + 1);
        player.matrix = nextPiece.matrix; player.type = nextPiece.type; player.pos.y = 0;
        player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
        nextPiece = createPiece(Math.floor(Math.random() * 7) + 1);
        canHold = true;
        if (collide(grid, player)) { gameOver = true; endGame(); }
    }

    function collide(grid, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (grid[y + o.y] && grid[y + o.y][x + o.x]) !== 0) return true;
            }
        }
        return false;
    }

    function merge(grid, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => { if (value !== 0) grid[y + player.pos.y][x + player.pos.x] = value; });
        });
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
        if (dir > 0) matrix.forEach(row => row.reverse()); else matrix.reverse();
    }

    function playerRotate(dir) {
        if (isPaused) return;
        const pos = player.pos.x; let offset = 1; rotate(player.matrix, dir);
        while (collide(grid, player)) {
            player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
        }
    }

    function playerDrop() {
        if (isPaused) return;
        player.pos.y++;
        if (collide(grid, player)) { player.pos.y--; merge(grid, player); playerReset(); gridSweep(); shake = 5; }
        dropCounter = 0;
    }

    function playerHardDrop() { if (isPaused) return; while (!collide(grid, player)) player.pos.y++; player.pos.y--; merge(grid, player); playerReset(); gridSweep(); shake = 15; }
    function playerMove(dir) { if (isPaused) return; player.pos.x += dir; if (collide(grid, player)) player.pos.x -= dir; }
    function playerHold() {
        if (!canHold || isPaused) return;
        if (holdPiece === null) { holdPiece = player.type; playerReset(); }
        else { const t = player.type; player.type = holdPiece; player.matrix = SHAPES[holdPiece]; holdPiece = t; player.pos.y = 0; player.pos.x = Math.floor(COLS/2)-Math.floor(player.matrix[0].length/2); }
        canHold = false;
    }

    function magicSwap() {
        if (isPaused) return;
        const newType = Math.floor(Math.random() * 7) + 1;
        player.type = newType; player.matrix = SHAPES[newType];
        if (collide(grid, player)) playerReset();
        shake = 10;
    }

    function gridSweep() {
        let rowCount = 1;
        outer: for (let y = ROWS - 1; y > 0; --y) {
            for (let x = 0; x < COLS; ++x) if (grid[y][x] === 0) continue outer;
            grid.unshift(grid.splice(y, 1)[0].fill(0)); ++y;
            score += rowCount * 100 * level; rowCount *= 2; lines++;
            if (lines % 10 === 0) { level++; dropInterval = Math.max(100, 1000 - (level * 50)); }
        }
    }

    function draw() {
        ctx.save();
        if (shake > 0) { ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2); shake *= 0.9; }
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);

        const isMobile = window.innerWidth <= 1024;
        const boardW = COLS * BLOCK_SIZE; const boardH = ROWS * BLOCK_SIZE;
        const offsetX = (canvas.width - boardW) / 2;
        const offsetY = isMobile ? 85 : (canvas.height - boardH) / 2;

        if (!isMobile) {
            drawCyberPanel(ctx, 0, 0, offsetX - 10, canvas.height, 'SİSTEM VERİLERİ');
            drawCyberPanel(ctx, offsetX + boardW + 10, 0, canvas.width - (offsetX + boardW + 10), canvas.height, 'TAKTIK RADAR');
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Inter';
            ctx.fillText('GÖREV İSTATİSTİĞİ', offsetX / 2, 100);
            ctx.font = '22px Inter'; ctx.fillText(`SKOR: ${score.toLocaleString()}`, offsetX / 2, 180);
            ctx.fillText(`SEVİYE: ${level}`, offsetX / 2, 240);
            ctx.fillText(`SATIR: ${lines}`, offsetX / 2, 300);
            ctx.font = 'bold 18px Inter'; ctx.fillText('SIRADAKİ', offsetX + boardW + (canvas.width - (offsetX + boardW)) / 2, 100);
            if (nextPiece) drawMatrix(nextPiece.matrix, { x: 0, y: 0 }, offsetX + boardW + (canvas.width - (offsetX + boardW)) / 2 - (BLOCK_SIZE * 2), 150, 0.8);
        } else {
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 16px Inter';
            ctx.fillText(`SKOR: ${score.toLocaleString()}`, canvas.width/4, 45);
            ctx.fillText(`SEVİYE: ${level}`, canvas.width/2, 45);
            ctx.fillText(`SATIR: ${lines}`, (canvas.width/4)*3, 45);
        }

        ctx.strokeStyle = '#bc13fe'; ctx.lineWidth = 4; ctx.strokeRect(offsetX - 3, offsetY - 3, boardW + 6, boardH + 6);
        drawMatrix(grid, { x: 0, y: 0 }, offsetX, offsetY);
        const ghost = { ...player, pos: { ...player.pos } };
        while (!collide(grid, ghost)) ghost.pos.y++;
        ghost.pos.y--; ctx.globalAlpha = 0.15; drawMatrix(ghost.matrix, ghost.pos, offsetX, offsetY); ctx.globalAlpha = 1.0;
        drawMatrix(player.matrix, player.pos, offsetX, offsetY);

        if (isPaused) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Inter'; ctx.textAlign = 'center';
            ctx.fillText('DURAKLATILDI', canvas.width/2, canvas.height/2);
        }

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(0,0,canvas.width, canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = 'bold 50px Inter'; ctx.textAlign = 'center';
            ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2);
        }
        ctx.restore();
    }

    function drawCyberPanel(ctx, x, y, w, h, title) {
        ctx.save(); ctx.fillStyle = 'rgba(0, 242, 255, 0.05)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.8)'; ctx.font = '900 12px Inter'; ctx.fillText(title, x + 15, y + 30); ctx.restore();
    }

    function drawMatrix(matrix, offset, offsetX, offsetY, scale = 1) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const size = BLOCK_SIZE * scale; const px = offsetX + (x + offset.x) * size; const py = offsetY + (y + offset.y) * size;
                    ctx.fillStyle = COLORS[value]; ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
                }
            });
        });
    }

    function update(time = 0) {
        const deltaTime = time - lastTime; lastTime = time; 
        if (!isPaused) {
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) playerDrop();
        }
        draw(); 
        if (!gameOver) requestAnimationFrame(update);
    }

    function endGame() { setTimeout(() => { const overlay = document.getElementById('play-overlay'); if (overlay) overlay.style.display = 'flex'; }, 1500); }

    window.addEventListener('keydown', e => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
        if (gameOver) return;
        if (e.keyCode === 80) { isPaused = !isPaused; const p = document.getElementById('mobile-pause-btn'); if(p) p.innerHTML = isPaused ? "▶" : "⏸"; }
        if (isPaused) return;
        if (e.keyCode === 37) playerMove(-1); else if (e.keyCode === 39) playerMove(1);
        else if (e.keyCode === 40) playerDrop(); else if (e.keyCode === 38) playerRotate(1);
        else if (e.keyCode === 32) playerHardDrop(); else if (e.keyCode === 16 || e.keyCode === 67) playerHold();
    });

    let touchStartX = 0; let touchStartY = 0; let touchStartTime = 0;
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; touchStartTime = Date.now();
    }, {passive: false});

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); if (gameOver || isPaused) return;
        const touchX = e.touches[0].clientX; const diffX = touchX - touchStartX;
        if (Math.abs(diffX) > BLOCK_SIZE * 0.8) { playerMove(diffX > 0 ? 1 : -1); touchStartX = touchX; }
    }, {passive: false});

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault(); if (gameOver || isPaused) return;
        const duration = Date.now() - touchStartTime; const touchX = e.changedTouches[0].clientX; const touchY = e.changedTouches[0].clientY;
        const dist = Math.hypot(touchX - touchStartX, touchY - touchStartY);
        if (duration < 200 && dist < 20) playerHardDrop();
    }, {passive: false});

    function setupMobileControls() {
        const isTouch = window.matchMedia("(pointer: coarse)").matches;
        const isMobileSize = window.innerWidth <= 1366;
        if (!isTouch && !isMobileSize) return;
        const container = document.getElementById('game-canvas-container');
        if (!container) return;
        const old = document.getElementById('tetris-mobile-ui'); if (old) old.remove();

        const ui = document.createElement('div');
        ui.id = 'tetris-mobile-ui';
        ui.style = "position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:9999;";

        const bottomBar = document.createElement('div');
        bottomBar.style = "position:absolute;bottom:25px;left:0;right:0;display:flex;justify-content:center;gap:15px;pointer-events:none;";
        const btnStyle = "width:60px;height:60px;background:rgba(0,242,255,0.25);border:2px solid #00f2ff;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:bold;user-select:none;touch-action:manipulation;box-shadow:0 0 15px #00f2ff;pointer-events:auto;";
        const controls = [ { l: '↻', a: () => playerRotate(1) }, { l: '↓', a: () => playerDrop() }, { l: 'H', a: () => playerHold(), s: true } ];
        controls.forEach(b => {
            const btn = document.createElement('div'); btn.innerHTML = b.l; btn.style = b.s ? btnStyle + "border-color:#ff0077;box-shadow:0 0 15px #ff0077;" : btnStyle;
            const trigger = (e) => { e.preventDefault(); if(!gameOver) b.a(); };
            btn.addEventListener('touchstart', trigger, {passive: false});
            btn.addEventListener('mousedown', trigger);
            bottomBar.appendChild(btn);
        });

        const pauseBtn = document.createElement('div');
        pauseBtn.id = 'mobile-pause-btn'; pauseBtn.innerHTML = "⏸";
        pauseBtn.style = "position:absolute;top:15px;left:15px;width:50px;height:50px;background:rgba(255,255,255,0.1);border:1px solid #fff;border-radius:10px;color:white;display:flex;align-items:center;justify-content:center;font-size:1.2rem;pointer-events:auto;";
        pauseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isPaused = !isPaused; pauseBtn.innerHTML = isPaused ? "▶" : "⏸"; }, {passive: false});

        const magicBtn = document.createElement('div');
        magicBtn.innerHTML = "DEĞİŞTİR"; magicBtn.style = "position:absolute;top:15px;right:15px;width:70px;height:70px;background:rgba(255,0,119,0.2);border:2px solid #ff0077;border-radius:12px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:900;pointer-events:auto;box-shadow:0 0 15px #ff0077;";
        magicBtn.addEventListener('touchstart', (e) => { e.preventDefault(); magicSwap(); }, {passive: false});

        ui.appendChild(bottomBar); ui.appendChild(pauseBtn); ui.appendChild(magicBtn);
        container.appendChild(ui);
    }

    function init() { resetGrid(); playerReset(); update(); resize(); }
    init();
})();
