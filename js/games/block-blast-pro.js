(function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const GRID_SIZE = 8;
    let BLOCK_SIZE = 40;
    let offsetX = 0, offsetY = 0;
    let grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    
    let shapesPool = [];
    let selectedShape = null;
    let dragPos = { x: 0, y: 0 };
    let isTouch = false;
    
    let score = 0;
    let gameOver = false;
    let challengeMode = false;
    let shake = 0;
    let particles = [];

    const COLORS = [null, '#00f2ff', '#39ff14', '#ff0077', '#ffff00', '#bc13fe', '#ffaa00'];

    const blockImages = {};
    const processedBlocks = {};
    let assetsLoaded = 0;

    function loadAsset(key, src) {
        const img = new Image(); img.src = src;
        img.onload = () => { processedBlocks[key] = removeBlack(img); assetsLoaded++; };
        blockImages[key] = img;
    }

    loadAsset('1', 'assets/games/block-blast/1.png');
    loadAsset('2', 'assets/games/block-blast/2.png');
    loadAsset('3', 'assets/games/block-blast/3.png');
    loadAsset('4', 'assets/games/block-blast/4.png');
    loadAsset('5', 'assets/games/block-blast/5.png');
    loadAsset('tnt', 'assets/games/block-blast/tnt.png');

    function removeBlack(img) {
        const off = document.createElement('canvas'); off.width = img.width; off.height = img.height;
        const octx = off.getContext('2d'); octx.drawImage(img, 0, 0);
        const data = octx.getImageData(0,0,off.width,off.height);
        for(let i=0; i<data.data.length; i+=4) if(data.data[i]<35 && data.data[i+1]<35 && data.data[i+2]<35) data.data[i+3]=0;
        octx.putImageData(data, 0, 0); return off;
    }
    
    const SHAPES = [
        [[1,1,1]], [[1],[1],[1]], [[1,1],[1,1]], [[1,1,1],[0,1,0]],
        [[1,0],[1,0],[1,1]], [[1,1,1,1]], [[1,1],[1,0]], [[1,1],[0,1]], [[1]]
    ];
    
    const HARD_SHAPES = [
        [[1,1,1,1,1]], [[1,1,1],[1,0,0],[1,0,0]], [[1,1,1],[1,1,1],[1,1,1]], [[0,1,0],[1,1,1],[0,1,0]], [[1,1,0],[0,1,1],[0,0,1]]
    ];

    function resetGame() {
        grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        score = 0; window.currentGameScore = 0; gameOver = false; generateShapes(); shake = 0; particles = [];
        window.scoreSaved = false;
    }

    function generateShapes() {
        shapesPool = [];
        const pool = challengeMode ? [...SHAPES, ...HARD_SHAPES] : SHAPES;
        for (let i = 0; i < 3; i++) {
            const shapeIdx = Math.floor(Math.random() * pool.length);
            const colorIdx = Math.floor(Math.random() * 5) + 1;
            let special = (challengeMode && Math.random() < 0.2) ? 'TNT' : null;
            shapesPool.push({ matrix: pool[shapeIdx], colorIdx: colorIdx, used: false, special: special });
        }
        checkGameOver();
    }

    function canPlace(r, c, matrix) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x]) {
                    if (r + y < 0 || r + y >= GRID_SIZE || c + x < 0 || c + x >= GRID_SIZE || grid[r + y][c + x] !== 0) return false;
                }
            }
        }
        return true;
    }

    function placeShape(r, c, matrix, colorIdx, special) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x]) grid[r + y][c + x] = special === 'TNT' ? 'tnt' : colorIdx;
            }
        }
        checkLines();
        if (shapesPool.every(s => s.used)) generateShapes();
        checkGameOver();
    }

    function checkLines() {
        let rowsToClear = [], colsToClear = [];
        for (let r = 0; r < GRID_SIZE; r++) if (grid[r].every(cell => cell !== 0)) rowsToClear.push(r);
        for (let c = 0; c < GRID_SIZE; c++) {
            let full = true;
            for (let r = 0; r < GRID_SIZE; r++) if (grid[r][c] === 0) full = false;
            if (full) colsToClear.push(c);
        }
        if (rowsToClear.length > 0 || colsToClear.length > 0) {
            shake = 20; score += (rowsToClear.length + colsToClear.length) * 100;
            rowsToClear.forEach(r => { 
                for (let c = 0; c < GRID_SIZE; c++) {
                    const color = COLORS[grid[r][c]] || '#00f2ff';
                    for(let i=0; i<3; i++) particles.push({ x: offsetX + c*BLOCK_SIZE + BLOCK_SIZE/2, y: offsetY + r*BLOCK_SIZE + BLOCK_SIZE/2, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1, color });
                    grid[r][c] = 0; 
                }
            });
            colsToClear.forEach(c => { 
                for (let r = 0; r < GRID_SIZE; r++) {
                    if (grid[r][c] === 0) continue;
                    const color = COLORS[grid[r][c]] || '#00f2ff';
                    for(let i=0; i<3; i++) particles.push({ x: offsetX + c*BLOCK_SIZE + BLOCK_SIZE/2, y: offsetY + r*BLOCK_SIZE + BLOCK_SIZE/2, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1, color });
                    grid[r][c] = 0; 
                }
            });
        }
    }

    function checkGameOver() {
        const activeShapes = shapesPool.filter(s => !s.used);
        if (activeShapes.length === 0) return;
        let anyPossible = false;
        for (let s of activeShapes) {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (canPlace(r, c, s.matrix)) { anyPossible = true; break; }
                }
                if (anyPossible) break;
            }
            if (anyPossible) break;
        }
        if (!anyPossible) gameOver = true;
    }

    function resize() {
        const container = document.getElementById('game-canvas-container');
        if (container) {
            canvas.width = container.offsetWidth; canvas.height = container.offsetHeight;
            const isMobile = canvas.width < 768;
            BLOCK_SIZE = Math.floor((canvas.height * (isMobile?0.85:0.92)) / (GRID_SIZE + (isMobile?4:2.5)));
            offsetX = Math.floor((canvas.width - GRID_SIZE * BLOCK_SIZE) / 2);
            offsetY = isMobile ? 80 : Math.floor((canvas.height - (GRID_SIZE + (isMobile?4:2.5)) * BLOCK_SIZE) / 2);
        }
    }

    function drawCyberPanel(ctx, x, y, w, h, title, active = false) {
        ctx.save(); ctx.fillStyle = active ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 242, 255, 0.03)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = active ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
        ctx.strokeStyle = active ? '#ff0000' : '#00f2ff'; ctx.lineWidth = 3; const cl = 20;
        ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();
        ctx.fillStyle = active ? '#ff0000' : '#00f2ff'; ctx.font = '900 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(title, x + 15, y + 20); ctx.restore();
    }

    function draw() {
        ctx.fillStyle = challengeMode ? '#080101' : '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        if (shake > 0) { ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake); shake *= 0.9; }

        const isMobile = canvas.width < 768;
        const boardW = GRID_SIZE * BLOCK_SIZE;
        const boardH = GRID_SIZE * BLOCK_SIZE;

        if (!isMobile) {
            const panelGap = 20; const sidePanelW = offsetX - panelGap * 2;
            drawCyberPanel(ctx, panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'GÖREV VERİLERİ', challengeMode);
            drawCyberPanel(ctx, offsetX + boardW + panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'CHALLENGE MOD', challengeMode);
            const leftMidX = panelGap + sidePanelW / 2;
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 24px Inter'; ctx.fillText(`SKOR`, leftMidX, 100);
            ctx.font = 'bold 36px Inter'; ctx.fillStyle = challengeMode ? '#ff0000' : '#00f2ff'; ctx.fillText(`${score}`, leftMidX, 150);
            const rightMidX = offsetX + boardW + panelGap + sidePanelW / 2;
            const btnW = sidePanelW * 0.8; const btnH = 60; const btnX = rightMidX - btnW/2; const btnY = 150;
            ctx.fillStyle = challengeMode ? '#ff0000' : 'rgba(0, 242, 255, 0.1)'; ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(btnX, btnY, btnW, btnH);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter'; ctx.fillText(challengeMode ? 'CHALLENGE: ON' : 'AKTİF ET', rightMidX, btnY + 35);
        }
        window.currentGameScore = score;

        ctx.strokeStyle = challengeMode ? '#ff0000' : '#bc13fe'; ctx.lineWidth = 6; ctx.strokeRect(offsetX - 5, offsetY - 5, boardW + 10, boardH + 10);
        
        // Grid Lines
        ctx.strokeStyle = challengeMode ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 242, 255, 0.5)'; ctx.lineWidth = 1;
        for (let r = 0; r <= GRID_SIZE; r++) {
            ctx.beginPath(); ctx.moveTo(offsetX, offsetY + r * BLOCK_SIZE); ctx.lineTo(offsetX + boardW, offsetY + r * BLOCK_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(offsetX + r * BLOCK_SIZE, offsetY); ctx.lineTo(offsetX + r * BLOCK_SIZE, offsetY + boardH); ctx.stroke();
        }
        
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (cell) {
                    if (processedBlocks[cell]) ctx.drawImage(processedBlocks[cell], offsetX + c * BLOCK_SIZE, offsetY + r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    else { ctx.fillStyle = cell === 'tnt' ? '#ff0000' : COLORS[cell]; ctx.fillRect(offsetX + c * BLOCK_SIZE + 2, offsetY + r * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4); }
                }
            }
        }

        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            if (p.life <= 0) { particles.splice(i, 1); return; }
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        ctx.globalAlpha = 1;

        const poolY = isMobile ? canvas.height - 120 : offsetY + boardH + 40;
        shapesPool.forEach((s, i) => {
            if (s.used) return;
            const sx = offsetX + (i * (boardW / 3)) + (boardW / 6) - (s.matrix[0].length * BLOCK_SIZE * 0.25);
            ctx.save(); ctx.translate(sx, poolY); ctx.scale(0.5, 0.5);
            s.matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val) {
                        const type = s.special === 'TNT' ? 'tnt' : s.colorIdx;
                        if (processedBlocks[type]) ctx.drawImage(processedBlocks[type], x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
            ctx.restore();
        });

        if (selectedShape && !gameOver) {
            const dropY = dragPos.y - 70;
            const c = Math.round((dragPos.x - offsetX - (selectedShape.matrix[0].length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            const r = Math.round((dropY - offsetY - (selectedShape.matrix.length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            if (canPlace(r, c, selectedShape.matrix)) {
                ctx.save(); ctx.fillStyle = 'rgba(0, 242, 255, 0.15)'; ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)'; ctx.lineWidth = 2;
                selectedShape.matrix.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val) {
                            const gx = offsetX + (c + x) * BLOCK_SIZE; const gy = offsetY + (r + y) * BLOCK_SIZE;
                            ctx.fillRect(gx, gy, BLOCK_SIZE, BLOCK_SIZE); ctx.strokeRect(gx + 2, gy + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                        }
                    });
                });
                ctx.restore();
            }
        }

        if (selectedShape && !gameOver) {
            ctx.save(); ctx.globalAlpha = 0.8;
            selectedShape.matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val) {
                        const type = selectedShape.special === 'TNT' ? 'tnt' : selectedShape.colorIdx;
                        const dx = dragPos.x + x * BLOCK_SIZE - (selectedShape.matrix[0].length * BLOCK_SIZE) / 2;
                        const dy = dragPos.y + y * BLOCK_SIZE - (selectedShape.matrix.length * BLOCK_SIZE / 2) - 70;
                        if (processedBlocks[type]) ctx.drawImage(processedBlocks[type], dx, dy, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
            ctx.restore();
        }

        const lastScore = localStorage.getItem('retroArcade_lastScore_block-blast-pro') || 0;
        const panelW = 140, panelH = 55, pX = canvas.width - panelW - 20, pY = canvas.height - panelH - 20;
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 1; ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(pX, pY, panelW, panelH, 8); else ctx.rect(pX, pY, panelW, panelH); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.fillStyle = '#00f2ff'; ctx.font = '900 10px Inter';
        ctx.fillText('ÖNCEKİ SKOR', pX + panelW/2, pY + 20); ctx.fillStyle = '#fff'; ctx.font = '900 22px Inter';
        ctx.fillText(parseInt(lastScore).toLocaleString(), pX + panelW/2, pY + 45); ctx.restore();

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText('OYUN BİTTİ', canvas.width/2, canvas.height/2 - 20);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Inter'; ctx.fillText(`FİNAL SKOR: ${score}`, canvas.width/2, canvas.height/2 + 30);
            if (!window.scoreSaved) { if (window.saveUserScore) window.saveUserScore(score); window.scoreSaved = true; }
        }
        ctx.restore();
    }

    function update(t) { if (window.gameStarted) draw(); requestAnimationFrame(update); }

    function handleStart(mx, my) {
        if (gameOver) { resetGame(); return; }
        if (canvas.width >= 768) {
            const panelGap = 20; const sidePanelW = offsetX - panelGap * 2;
            const rightMidX = offsetX + (GRID_SIZE * BLOCK_SIZE) + panelGap + sidePanelW / 2;
            const btnW = sidePanelW * 0.8, btnH = 60, btnX = rightMidX - btnW/2, btnY = 150;
            if (mx > btnX && mx < btnX + btnW && my > btnY && my < btnY + btnH) {
                challengeMode = !challengeMode; resetGame(); shake = 30; return;
            }
        }
        const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        const isMobile = window.innerWidth <= 1400 || isTouch;
        const poolY = isMobile ? canvas.height - 120 : offsetY + GRID_SIZE * BLOCK_SIZE + 40;
        shapesPool.forEach((s, i) => {
            if (s.used) return;
            const sx = offsetX + (i * (GRID_SIZE * BLOCK_SIZE / 3)) + (GRID_SIZE * BLOCK_SIZE / 6) - (s.matrix[0].length * BLOCK_SIZE * 0.25);
            if (mx > sx - 40 && mx < sx + 100 && my > poolY - 40 && my < poolY + 100) { selectedShape = s; dragPos = { x: mx, y: my }; }
        });
    }

    function handleMove(mx, my) { if (selectedShape) dragPos = { x: mx, y: my }; }

    function handleEnd() {
        if (selectedShape) {
            const dropY = dragPos.y - 70;
            const c = Math.round((dragPos.x - offsetX - (selectedShape.matrix[0].length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            const r = Math.round((dropY - offsetY - (selectedShape.matrix.length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && canPlace(r, c, selectedShape.matrix)) {
                selectedShape.used = true; placeShape(r, c, selectedShape.matrix, selectedShape.colorIdx, selectedShape.special);
            }
            selectedShape = null;
        }
    }

    canvas.addEventListener('mousedown', e => { 
        const rect = canvas.getBoundingClientRect(); handleStart(e.clientX - rect.left, e.clientY - rect.top);
    });
    window.addEventListener('mousemove', e => { 
        const rect = canvas.getBoundingClientRect(); handleMove(e.clientX - rect.left, e.clientY - rect.top);
    });
    window.addEventListener('mouseup', handleEnd);

    canvas.addEventListener('touchstart', e => {
        e.preventDefault(); const rect = canvas.getBoundingClientRect(); const t = e.touches[0];
        handleStart(t.clientX - rect.left, t.clientY - rect.top);
    }, {passive: false});
    window.addEventListener('touchmove', e => {
        if (selectedShape) e.preventDefault();
        const rect = canvas.getBoundingClientRect(); const t = e.touches[0];
        handleMove(t.clientX - rect.left, t.clientY - rect.top);
    }, {passive: false});
    window.addEventListener('touchend', handleEnd);

    window.addEventListener('resize', resize); resize(); generateShapes(); requestAnimationFrame(update);
})();
