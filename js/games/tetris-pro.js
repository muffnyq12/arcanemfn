(function() {
    /**
     * TETRIS PRO: NEON ULTIMATE - MOBILE TOUCH CONSOLE EDITION
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 10;
    const ROWS = 20;
    let BLOCK_SIZE;
    let grid = [];
    
    let score = 0; let lines = 0; let level = 1;
    let gameOver = false; let nextPiece; let holdPiece = null;
    let canHold = true; let dropCounter = 0; let dropInterval = 1000;
    let lastTime = 0; let shake = 0;

    let bgParticles = [];
    for(let i=0; i<50; i++) bgParticles.push({ x: Math.random() * 2000, y: Math.random() * 2000, s: Math.random() * 2 + 1, v: Math.random() * 0.4 + 0.1 });

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
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                BLOCK_SIZE = Math.floor((canvas.width * 0.90) / COLS);
                if (BLOCK_SIZE * ROWS > canvas.height * 0.70) BLOCK_SIZE = Math.floor((canvas.height * 0.70) / ROWS);
            } else BLOCK_SIZE = Math.floor((canvas.height * 0.98) / ROWS);
        }
    }

    window.addEventListener('resize', resize);
    resize();

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
        const pos = player.pos.x; let offset = 1; rotate(player.matrix, dir);
        while (collide(grid, player)) {
            player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
        }
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(grid, player)) { player.pos.y--; merge(grid, player); playerReset(); gridSweep(); shake = 5; }
        dropCounter = 0;
    }

    function playerHardDrop() { while (!collide(grid, player)) player.pos.y++; player.pos.y--; merge(grid, player); playerReset(); gridSweep(); shake = 15; }
    function playerMove(dir) { player.pos.x += dir; if (collide(grid, player)) player.pos.x -= dir; }
    function playerHold() {
        if (!canHold) return;
        if (holdPiece === null) { holdPiece = player.type; playerReset(); }
        else { const t = player.type; player.type = holdPiece; player.matrix = SHAPES[holdPiece]; holdPiece = t; player.pos.y = 0; player.pos.x = Math.floor(COLS/2)-Math.floor(player.matrix[0].length/2); }
        canHold = false;
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
        bgParticles.forEach(p => { ctx.fillStyle = 'rgba(0, 242, 255, 0.2)'; ctx.fillRect(p.x % canvas.width, p.y % canvas.height, p.s, p.s); p.y += p.v; });

        const isMobile = canvas.width < 768;
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

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(0,0,canvas.width, canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = 'bold 50px Inter'; ctx.textAlign = 'center';
            ctx.fillText('BAĞLANTI KESİLDİ', canvas.width/2, canvas.height/2);
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
        const deltaTime = time - lastTime; lastTime = time; dropCounter += deltaTime;
        if (dropCounter > dropInterval) playerDrop(); draw(); if (!gameOver) requestAnimationFrame(update);
    }

    function endGame() { setTimeout(() => { const overlay = document.getElementById('play-overlay'); if (overlay) overlay.style.display = 'flex'; }, 1500); }

    window.addEventListener('keydown', e => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
        if (gameOver) return;
        if (e.keyCode === 37) playerMove(-1); else if (e.keyCode === 39) playerMove(1);
        else if (e.keyCode === 40) playerDrop(); else if (e.keyCode === 38) playerRotate(1);
        else if (e.keyCode === 32) playerHardDrop(); else if (e.keyCode === 16 || e.keyCode === 67) playerHold();
    });

    function setupMobileControls() {
        if (window.innerWidth > 768) return;
        const container = document.getElementById('game-canvas-container');
        const old = document.getElementById('tetris-mobile-ui'); if (old) old.remove();

        const ui = document.createElement('div');
        ui.id = 'tetris-mobile-ui';
        ui.style = "position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:center;gap:8px;pointer-events:auto;z-index:100;padding:10px;";
        
        const btnStyle = "width:55px;height:55px;background:rgba(0,242,255,0.05);border:2px solid #00f2ff;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:bold;user-select:none;touch-action:manipulation;box-shadow:0 0 10px #00f2ff;pointer-events:auto;";
        const specStyle = btnStyle + "border-color:#ff0077;box-shadow:0 0 10px #ff0077;width:65px;height:65px;";

        const controls = [
            { l: '←', a: () => playerMove(-1) },
            { l: '↻', a: () => playerRotate(1) },
            { l: '→', a: () => playerMove(1) },
            { l: '↓', a: () => playerDrop() },
            { l: '⤓', a: () => playerHardDrop(), s: true },
            { l: 'H', a: () => playerHold(), s: true }
        ];

        controls.forEach(b => {
            const btn = document.createElement('div');
            btn.innerHTML = b.l;
            btn.style = b.s ? specStyle : btnStyle;
            const trigger = (e) => { e.preventDefault(); if(!gameOver) b.a(); };
            btn.ontouchstart = trigger;
            ui.appendChild(btn);
        });

        container.appendChild(ui);
    }

    function init() { resetGrid(); playerReset(); update(); if (window.innerWidth < 768) setupMobileControls(); }
    init();
})();
