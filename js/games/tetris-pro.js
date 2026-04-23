(function() {
    /**
     * TETRIS PRO: CYBER EDITION - ARCADE HUB
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 10;
    const ROWS = 20;
    let BLOCK_SIZE = 30;

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let score = 0, level = 1, lines = 0;
    let gameOver = false, isPaused = false;
    let dropCounter = 0, dropInterval = 1000;
    let lastTime = 0;

    // Assets
    const blockImg = new Image(); blockImg.src = 'assets/games/tetris/block.png';
    const coloredBlockCache = {};
    let assetsLoaded = false;

    blockImg.onload = () => {
        COLORS.forEach((color, i) => {
            if (i === 0) return;
            coloredBlockCache[i] = colorizeBlock(blockImg, color);
        });
        assetsLoaded = true;
    };

    function colorizeBlock(img, color) {
        const off = document.createElement('canvas'); off.width = 64; off.height = 64;
        const octx = off.getContext('2d'); octx.drawImage(img, 0, 0, 64, 64);
        const data = octx.getImageData(0,0,64,64);
        for(let i=0; i<data.data.length; i+=4) if(data.data[i]<40 && data.data[i+1]<40 && data.data[i+2]<40) data.data[i+3]=0;
        octx.putImageData(data, 0, 0);
        octx.globalCompositeOperation = 'source-atop';
        octx.fillStyle = color; octx.globalAlpha = 0.7; octx.fillRect(0, 0, 64, 64);
        octx.globalAlpha = 1.0; return off;
    }

    const COLORS = [null, '#00f2ff', '#bc13fe', '#ff0077', '#ffff00', '#39ff14', '#ffaa00', '#ff4d00'];
    const SHAPES = [null, 
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
        [[0,1,0],[1,1,1],[0,0,0]], // T
        [[1,1,0],[0,1,1],[0,0,0]], // Z
        [[0,1,1],[1,1,0],[0,0,0]], // S
        [[1,1],[1,1]], // O
        [[0,0,1],[1,1,1],[0,0,0]], // L
        [[1,0,0],[1,1,1],[0,0,0]]  // J
    ];

    let player = { pos: { x: 0, y: 0 }, matrix: null, color: 0, next: null };

    function createPiece(type) { return { matrix: JSON.parse(JSON.stringify(SHAPES[type])), color: type }; }

    function playerReset() {
        if (!player.next) player.next = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
        player.matrix = player.next.matrix; player.color = player.next.color;
        player.next = createPiece(Math.floor(Math.random() * (SHAPES.length - 1)) + 1);
        player.pos.y = 0; player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
        if (collide(board, player)) { gameOver = true; endGame(); }
    }

    function collide(board, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) return true;
            }
        }
        return false;
    }

    function merge(board, player) {
        player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) board[y + player.pos.y][x + player.pos.x] = player.color; }); });
    }

    function arenaSweep() {
        let rowCount = 1;
        outer: for (let y = ROWS - 1; y > 0; --y) {
            for (let x = 0; x < COLS; ++x) if (board[y][x] === 0) continue outer;
            const row = board.splice(y, 1)[0].fill(0); board.unshift(row); ++y;
            score += rowCount * 100; lines += 1; rowCount *= 2;
            if (lines % 10 === 0) level++; dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }

    function playerDrop() { player.pos.y++; if (collide(board, player)) { player.pos.y--; merge(board, player); playerReset(); arenaSweep(); } dropCounter = 0; }
    function playerMove(dir) { player.pos.x += dir; if (collide(board, player)) player.pos.x -= dir; }
    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) { for (let x = 0; x < y; ++x) [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]; }
        if (dir > 0) matrix.forEach(row => row.reverse()); else matrix.reverse();
    }
    function playerRotate(dir) {
        const pos = player.pos.x; let offset = 1; rotate(player.matrix, dir);
        while (collide(board, player)) { player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1)); if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; } }
    }
    function getGhostPos() { let ghost = JSON.parse(JSON.stringify(player)); while (!collide(board, ghost)) { ghost.pos.y++; } ghost.pos.y--; return ghost.pos; }

    function draw() {
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const isMobile = canvas.width < 768;
        const scaleFactor = isMobile ? 0.85 : 0.92;
        BLOCK_SIZE = Math.floor((canvas.height * scaleFactor) / ROWS);
        if (BLOCK_SIZE * COLS > canvas.width * 0.8) BLOCK_SIZE = Math.floor((canvas.width * 0.8) / COLS);
        
        const boardW = COLS * BLOCK_SIZE;
        const boardH = ROWS * BLOCK_SIZE;
        const offsetX = (canvas.width - boardW) / 2;
        const offsetY = (canvas.height - boardH) / 2;

        if (!isMobile) {
            const panelGap = 20; const sidePanelW = offsetX - panelGap * 2;
            drawCyberPanel(ctx, panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'VERİ MERKEZİ');
            drawCyberPanel(ctx, offsetX + boardW + panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'SIRADAKİ');
            
            // Stats in Left Panel
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 20px Inter';
            ctx.fillText('SKOR', panelGap + sidePanelW/2, 100);
            ctx.font = 'bold 32px Inter'; ctx.fillStyle = '#00f2ff'; ctx.fillText(score, panelGap + sidePanelW/2, 140);
            ctx.fillStyle = '#fff'; ctx.font = '900 20px Inter'; ctx.fillText('LEVEL', panelGap + sidePanelW/2, 220);
            ctx.font = 'bold 32px Inter'; ctx.fillStyle = '#bc13fe'; ctx.fillText(level, panelGap + sidePanelW/2, 260);

            // Next in Right Panel
            if (player.next) {
                const rx = offsetX + boardW + panelGap + sidePanelW/2;
                ctx.save(); ctx.translate(rx - (player.next.matrix[0].length * BLOCK_SIZE)/2, 120);
                player.next.matrix.forEach((row, y) => {
                    row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, x * BLOCK_SIZE, y * BLOCK_SIZE, player.next.color, 1); });
                });
                ctx.restore();
            }
        } else {
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Inter'; ctx.fillText(`SKOR: ${score}`, canvas.width/2, 45);
        }

        // Ghost
        if (!gameOver && !isPaused) {
            const gp = getGhostPos(); ctx.globalAlpha = 0.2;
            player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, offsetX + (x + gp.x) * BLOCK_SIZE, offsetY + (y + gp.y) * BLOCK_SIZE, player.color, 1); }); });
            ctx.globalAlpha = 1.0;
        }

        // Board
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 4; ctx.strokeRect(offsetX - 2, offsetY - 2, boardW + 4, boardH + 4);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.05)'; ctx.fillRect(offsetX, offsetY, boardW, boardH);

        board.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, value, 1); }); });
        if (!gameOver) { player.matrix.forEach((row, y) => { row.forEach((value, x) => { if (value !== 0) drawBlock(ctx, offsetX + (x + player.pos.x) * BLOCK_SIZE, offsetY + (y + player.pos.y) * BLOCK_SIZE, player.color, 1); }); }); }

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = '900 60px Inter'; ctx.textAlign = 'center'; ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2);
        }
    }

    function drawBlock(ctx, x, y, colorIdx, scale) {
        const size = BLOCK_SIZE;
        if (assetsLoaded && coloredBlockCache[colorIdx]) { ctx.drawImage(coloredBlockCache[colorIdx], x, y, size, size); }
        else { ctx.fillStyle = COLORS[colorIdx]; ctx.fillRect(x+1, y+1, size-2, size-2); }
    }

    function drawCyberPanel(ctx, x, y, w, h, title) {
        ctx.save(); ctx.fillStyle = 'rgba(0, 242, 255, 0.03)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
        ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 3; const cl = 20;
        ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();
        ctx.fillStyle = '#00f2ff'; ctx.font = '900 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(title, x + 15, y + 20); ctx.restore();
    }

    function update(time = 0) { if (!window.gameStarted) { lastTime = time; requestAnimationFrame(update); return; } const dt = time - lastTime; lastTime = time; if (!isPaused && !gameOver) { dropCounter += dt; if (dropCounter > dropInterval) playerDrop(); } draw(); if (!gameOver) requestAnimationFrame(update); }
    function endGame() { setTimeout(() => { const o = document.getElementById('play-overlay'); if (o) o.style.display = 'flex'; }, 2000); }

    window.addEventListener('keydown', e => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
        if (gameOver) return;
        if (e.keyCode === 80) isPaused = !isPaused;
        if (isPaused) return;
        if (e.keyCode === 37) playerMove(-1);
        if (e.keyCode === 39) playerMove(1);
        if (e.keyCode === 40) playerDrop();
        if (e.keyCode === 38) playerRotate(1);
        if (e.keyCode === 32) { while(!collide(board, player)) player.pos.y++; player.pos.y--; merge(board, player); playerReset(); arenaSweep(); }
    });

    function resize() { canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight; }
    window.addEventListener('resize', resize); resize();
    playerReset(); requestAnimationFrame(update);
})();
