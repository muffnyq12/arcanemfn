(function() {
    /**
     * TETRIS PRO: CYBER EDITION - PAUSE & RESTART UPDATE
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 10;
    const ROWS = 20;
    let BLOCK_SIZE = 30;
    let offsetX = 0, offsetY = 0;

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let score = 0, level = 1, lines = 0;
    let gameOver = false, isPaused = false;
    let dropCounter = 0, dropInterval = 1000;
    let lastTime = 0;
    let particles = [];

    // Assets
    const blockImg = new Image(); blockImg.src = 'assets/games/tetris/block.png';
    const boardBg = new Image(); boardBg.src = 'assets/games/tetris/bg.png';
    const coloredBlockCache = {};
    let assetsLoaded = false;

    blockImg.onload = () => {
        COLORS.forEach((color, i) => { if (i === 0) return; coloredBlockCache[i] = colorizeBlock(blockImg, color); });
        assetsLoaded = true;
    };

    function colorizeBlock(img, color) {
        const off = document.createElement('canvas'); off.width = 64; off.height = 64;
        const octx = off.getContext('2d'); octx.drawImage(img, 0, 0, 64, 64);
        const data = octx.getImageData(0,0,64,64);
        for(let i=0; i<data.data.length; i+=4) if(data.data[i]<40 && data.data[i+1]<40 && data.data[i+2]<40) data.data[i+3]=0;
        octx.putImageData(data, 0, 0);
        octx.globalCompositeOperation = 'source-atop'; ctx.save();
        octx.fillStyle = color; octx.globalAlpha = 0.7; octx.fillRect(0, 0, 64, 64); ctx.restore();
        octx.globalAlpha = 1.0; return off;
    }

    const COLORS = [null, '#00f2ff', '#bc13fe', '#ff0077', '#ffff00', '#39ff14', '#ffaa00', '#ff4d00'];
    const SHAPES = [null, [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], [[0,1,0],[1,1,1],[0,0,0]], [[1,1,0],[0,1,1],[0,0,0]], [[0,1,1],[1,1,0],[0,0,0]], [[1,1],[1,1]], [[0,0,1],[1,1,1],[0,0,0]], [[1,0,0],[1,1,1],[0,0,0]]];

    let player = { pos: { x: 0, y: 0 }, matrix: null, color: 0, next: null };

    function createPiece(type) { return { matrix: JSON.parse(JSON.stringify(SHAPES[type])), color: type }; }

    function init() {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        score = 0; level = 1; lines = 0; gameOver = false; isPaused = false;
        dropInterval = 1000; window.scoreSaved = false;
        playerReset();
    }

    function playerReset() {
        if (!player.next) player.next = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
        player.matrix = player.next.matrix; player.color = player.next.color;
        player.next = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
        player.pos.y = 0; player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
        if (collide(board, player)) { gameOver = true; if (window.saveUserScore) window.saveUserScore(score); }
    }

    // EXPOSE TOGGLE PAUSE
    window.togglePause = function() {
        if (gameOver) return false;
        isPaused = !isPaused;
        return isPaused;
    };

    function collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) { for (let x = 0; x < m[y].length; ++x) { if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) return true; } }
        return false;
    }

    function merge(board, player) { player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) board[y + player.pos.y][x + player.pos.x] = player.color; }); }); }

    function arenaSweep() {
        let rowCount = 1;
        outer: for (let y = ROWS - 1; y > 0; --y) {
            for (let x = 0; x < COLS; ++x) if (board[y][x] === 0) continue outer;
            for(let x=0; x<COLS; x++) {
                for(let i=0; i<3; i++) {
                    particles.push({
                        x: offsetX + x * BLOCK_SIZE + BLOCK_SIZE/2,
                        y: offsetY + y * BLOCK_SIZE + BLOCK_SIZE/2,
                        vx: (Math.random()-0.5) * 8,
                        vy: (Math.random()-0.5) * 8,
                        life: 1.0,
                        color: COLORS[board[y][x]] || '#00f2ff'
                    });
                }
            }
            const row = board.splice(y, 1)[0].fill(0); board.unshift(row); ++y;
            score += rowCount * 100; lines += 1; rowCount *= 2;
            if (lines > 0 && lines % 10 === 0) level++; dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }

    function playerDrop() { player.pos.y++; if (collide(board, player)) { player.pos.y--; merge(board, player); playerReset(); arenaSweep(); } dropCounter = 0; }
    function playerMove(dir) { player.pos.x += dir; if (collide(board, player)) player.pos.x -= dir; }
    function rotate(matrix, dir) { for (let y = 0; y < matrix.length; ++y) { for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]; } if (dir > 0) matrix.forEach(row => row.reverse()); else matrix.reverse(); }
    function playerRotate(dir) { const pos = player.pos.x; let offset = 1; rotate(player.matrix, dir); while (collide(board, player)) { player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1)); if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; } } }
    function getGhostPos() { let ghost = JSON.parse(JSON.stringify(player)); while (!collide(board, ghost)) { ghost.pos.y++; } ghost.pos.y--; return ghost.pos; }

    function draw() {
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const isMobile = canvas.width < 768;
        BLOCK_SIZE = Math.floor((canvas.height * (isMobile?0.85:0.96)) / ROWS);
        if (BLOCK_SIZE * COLS > canvas.width * 0.85) BLOCK_SIZE = Math.floor((canvas.width * 0.85) / COLS);
        
        const boardW = COLS * BLOCK_SIZE, boardH = ROWS * BLOCK_SIZE;
        offsetX = (canvas.width - boardW) / 2; offsetY = (canvas.height - boardH) / 2;

        if (!isMobile) {
            const panelGap = 20; 
            const sidePanelW = offsetX - panelGap * 2;
            drawCyberPanel(ctx, panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'VERİ MERKEZİ');
            drawCyberPanel(ctx, offsetX + boardW + panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'SIRADAKİ');
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 20px Inter'; ctx.fillText('SKOR', panelGap + sidePanelW/2, 100);
            ctx.font = 'bold 32px Inter'; ctx.fillStyle = '#00f2ff'; ctx.fillText(score, panelGap + sidePanelW/2, 140);
            if (player.next) { const rx = offsetX + boardW + panelGap + sidePanelW/2; ctx.save(); ctx.translate(rx - (player.next.matrix[0].length * BLOCK_SIZE * 0.7)/2, 150); ctx.scale(0.7, 0.7); player.next.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, x * BLOCK_SIZE, y * BLOCK_SIZE, player.next.color); }); }); ctx.restore(); }
        } else { ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Inter'; ctx.fillText(`SKOR: ${score}`, canvas.width/2, 45); }
        window.currentGameScore = score;

        // Draw Board Background Asset
        if (boardBg.complete) {
            ctx.save(); ctx.globalAlpha = 0.5;
            ctx.drawImage(boardBg, offsetX, offsetY, boardW, boardH);
            ctx.restore();
        }

        if (!gameOver && !isPaused) { const gp = getGhostPos(); ctx.globalAlpha = 0.15; player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, offsetX + (x + gp.x) * BLOCK_SIZE, offsetY + (y + gp.y) * BLOCK_SIZE, player.color); }); }); ctx.globalAlpha = 1.0; }
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 4; ctx.strokeRect(offsetX - 2, offsetY - 2, boardW + 4, boardH + 4);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.05)'; ctx.fillRect(offsetX, offsetY, boardW, boardH);
        board.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, value); }); });
        if (!gameOver) { player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, offsetX + (x + player.pos.x) * BLOCK_SIZE, offsetY + (y + player.pos.y) * BLOCK_SIZE, player.color); }); }); }

        const lastScore = localStorage.getItem('retroArcade_lastScore_tetris-pro') || 0;
        const panelW = 140, panelH = 55, pX = canvas.width - panelW - 20, pY = canvas.height - panelH - 20;
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 1; ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(pX, pY, panelW, panelH, 8); else ctx.rect(pX, pY, panelW, panelH); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.fillStyle = '#00f2ff'; ctx.font = '900 10px Inter';
        ctx.fillText('ÖNCEKİ SKOR', pX + panelW/2, pY + 20); ctx.fillStyle = '#fff'; ctx.font = '900 22px Inter';
        ctx.fillText(parseInt(lastScore).toLocaleString(), pX + panelW/2, pY + 45); ctx.restore();

        if (isPaused) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#fff'; ctx.font = '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText('DURAKLATILDI', canvas.width/2, canvas.height/2);
            ctx.font = 'bold 20px Inter'; ctx.fillText('DEVAM ETMEK İÇİN DURDUR BUTONUNA BASIN', canvas.width/2, canvas.height/2 + 50);
        }

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 18px Inter';
            ctx.fillText('YENİDEN BAŞLAMAK İÇİN TIKLAYIN', canvas.width/2, canvas.height/2 + 60);
        }

        particles.forEach(p => {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });

        drawMobileControls();
        ctx.globalAlpha = 1.0;
    }

    function drawMobileControls() {
        if (window.innerWidth > 1024) {
            const old = document.getElementById('tetris-mobile-ctrl');
            if (old) old.remove();
            return;
        }
        if (document.getElementById('tetris-mobile-ctrl')) return;

        const container = document.getElementById('game-canvas-container');
        if (!container) return;

        const ctrlDiv = document.createElement('div');
        ctrlDiv.id = 'tetris-mobile-ctrl';
        ctrlDiv.style = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:9999; pointer-events:none;';
        
        ctrlDiv.innerHTML = `
            <div id="t-drag-area" style="position:absolute; top:0; left:0; width:100%; height:80%; pointer-events:auto; touch-action:none;"></div>
            <button id="t-rot-btn" style="position:absolute; top:20px; right:20px; width:80px; height:80px; background:rgba(188,19,254,0.3); border:3px solid #bc13fe; border-radius:50%; color:#fff; font-weight:900; font-size:14px; pointer-events:auto; touch-action:manipulation; box-shadow:0 0 20px rgba(188,19,254,0.5);">DÖNDÜR</button>
            <div style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,0.4); font-size:10px; font-weight:bold; pointer-events:none;">SÜRÜKLE: HAREKET | TIKLA: DÜŞÜR</div>
        `;
        
        container.appendChild(ctrlDiv);

        const dragArea = document.getElementById('t-drag-area');
        const rotBtn = document.getElementById('t-rot-btn');

        let lastX = -1;
        let touchStartTime = 0;
        let startX = 0, startY = 0;

        dragArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            startX = t.clientX; startY = t.clientY;
            touchStartTime = Date.now();
        }, {passive:false});

        dragArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const relX = t.clientX - rect.left;
            
            // Calculate which column (0 to board width)
            const col = Math.floor((relX - offsetX) / BLOCK_SIZE);
            if (col >= 0 && col < board[0].length && col !== player.pos.x) {
                const diff = col - player.pos.x;
                playerMove(diff);
            }
        }, {passive:false});

        dragArea.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            const duration = Date.now() - touchStartTime;
            const dist = Math.sqrt((t.clientX - startX)**2 + (t.clientY - startY)**2);

            if (duration < 250 && dist < 15) {
                // IT'S A TAP -> HARD DROP
                while(!collide(board, player)) player.pos.y++;
                player.pos.y--; merge(board, player); playerReset(); arenaSweep();
            }
        });

        rotBtn.addEventListener('touchstart', (e) => { e.preventDefault(); playerRotate(1); }, {passive:false});
    }

    function drawBlock(ctx, x, y, colorIdx) { const s = BLOCK_SIZE; if (assetsLoaded && coloredBlockCache[colorIdx]) { ctx.drawImage(coloredBlockCache[colorIdx], x, y, s, s); } else { ctx.fillStyle = COLORS[colorIdx]; ctx.fillRect(x+1, y+1, s-2, s-2); } }
    function drawCyberPanel(ctx, x, y, w, h, title) { ctx.save(); ctx.fillStyle = 'rgba(0, 242, 255, 0.03)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 3; const cl = 20; ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke(); ctx.fillStyle = '#00f2ff'; ctx.font = '900 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(title, x + 15, y + 20); ctx.restore(); }

    function update(time = 0) {
        const dt = time - lastTime; lastTime = time;
        if (!isPaused && !gameOver && window.gameStarted) {
            dropCounter += dt; if (dropCounter > dropInterval) playerDrop();
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                if (p.life <= 0) particles.splice(i, 1);
            }
        }
        draw(); requestAnimationFrame(update);
    }

    window.addEventListener('keydown', e => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
        if (gameOver || isPaused) return;
        if (e.keyCode === 37) playerMove(-1); else if (e.keyCode === 39) playerMove(1); else if (e.keyCode === 40) playerDrop(); else if (e.keyCode === 38) playerRotate(1); else if (e.keyCode === 32) { while(!collide(board, player)) player.pos.y++; player.pos.y--; merge(board, player); playerReset(); arenaSweep(); }
    });

    canvas.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        if (gameOver) { init(); return; }
    }, {passive: false});

    playerReset(); requestAnimationFrame(update);
})();
