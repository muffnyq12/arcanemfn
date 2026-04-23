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
    let lastTime = 0;
    let particles = [];

    const COLORS = [null, '#00f2ff', '#39ff14', '#ff0077', '#ffff00', '#bc13fe', '#ffaa00'];
    const CHALLENGE_COLORS = [null, '#ff4d00', '#ff0000', '#7a00ff', '#fbff00', '#00ff77'];

    // Assets
    const blockImages = {};
    const processedBlocks = {};
    let assetsLoaded = 0;
    const totalAssets = 6; // 1-5 and tnt

    function loadAsset(key, src) {
        const img = new Image(); img.src = src;
        img.onload = () => {
            processedBlocks[key] = removeBlack(img);
            assetsLoaded++;
        };
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

    const _t = (key) => {
        if (window.i18n && typeof window.i18n.get === 'function') return window.i18n.get(key);
        return { score: "SKOR", game_over: "OYUN BİTTİ" }[key] || key;
    };

    function resetGame() {
        grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        score = 0; gameOver = false; generateShapes(); shake = 0; particles = [];
    }

    function generateShapes() {
        shapesPool = [];
        const pool = challengeMode ? [...SHAPES, ...HARD_SHAPES] : SHAPES;
        for (let i = 0; i < 3; i++) {
            const shapeIdx = Math.floor(Math.random() * pool.length);
            const colorIdx = Math.floor(Math.random() * 5) + 1; // Use 1-5
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
                if (matrix[y][x]) {
                    grid[r + y][c + x] = special === 'TNT' ? 'tnt' : colorIdx;
                    const pCol = special === 'TNT' ? '#ff0000' : COLORS[colorIdx];
                    createParticles(offsetX + (c + x) * BLOCK_SIZE + BLOCK_SIZE/2, offsetY + (r + y) * BLOCK_SIZE + BLOCK_SIZE/2, pCol);
                }
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
            const toClear = [];
            rowsToClear.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) toClear.push({r, c}); });
            colsToClear.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) toClear.push({r, c}); });
            toClear.forEach(pos => {
                const cell = grid[pos.r][pos.c];
                if (cell === 'tnt') triggerExplosion(pos.r, pos.c);
                if (grid[pos.r][pos.c] !== 0) {
                    const col = typeof cell === 'number' ? COLORS[cell] : '#ff0000';
                    createParticles(offsetX + pos.c * BLOCK_SIZE + BLOCK_SIZE/2, offsetY + pos.r * BLOCK_SIZE + BLOCK_SIZE/2, col);
                    grid[pos.r][pos.c] = 0;
                }
            });
        }
    }

    function triggerExplosion(r, c) {
        shake = 40;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nr = r + i, nc = c + j;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                    if (grid[nr][nc] !== 0) {
                        createParticles(offsetX + nc * BLOCK_SIZE + BLOCK_SIZE/2, offsetY + nr * BLOCK_SIZE + BLOCK_SIZE/2, '#ffaa00');
                        grid[nr][nc] = 0; score += 50;
                    }
                }
            }
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

    function createParticles(x, y, color) {
        const count = isTouch ? 5 : 8;
        for (let i = 0; i < count; i++) {
            particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1, size: Math.random()*2+1, color });
        }
    }

    function resize() {
        const container = document.getElementById('game-canvas-container');
        if (container) {
            canvas.width = container.offsetWidth; canvas.height = container.offsetHeight;
            const isMobile = canvas.width < 768;
            BLOCK_SIZE = Math.floor((canvas.height * (isMobile?0.85:0.92)) / (GRID_SIZE + (isMobile?4:2.5)));
            if (BLOCK_SIZE * GRID_SIZE > canvas.width * (isMobile?0.95:0.85)) {
                BLOCK_SIZE = Math.floor((canvas.width * (isMobile?0.95:0.85)) / GRID_SIZE);
            }
            offsetX = Math.floor((canvas.width - GRID_SIZE * BLOCK_SIZE) / 2);
            offsetY = isMobile ? 80 : Math.floor((canvas.height - (GRID_SIZE + (isMobile?4:2.5)) * BLOCK_SIZE) / 2);
        }
    }

    window.addEventListener('resize', resize);
    resize();

    function drawCyberPanel(ctx, x, y, w, h, title, active = false) {
        ctx.save(); ctx.fillStyle = active ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 242, 255, 0.03)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = active ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
        ctx.strokeStyle = active ? '#ff0000' : '#00f2ff'; ctx.lineWidth = 3; const cl = 20;
        ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();
        ctx.fillStyle = active ? '#ff0000' : '#00f2ff'; ctx.font = '900 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(title, x + 15, y + 20); ctx.restore();
    }

    function draw() {
        ctx.setTransform(1,0,0,1,0,0);
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
        } else {
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Inter'; ctx.fillText(`${_t('score')}: ${score}`, canvas.width/2, 45);
        }

        ctx.strokeStyle = challengeMode ? '#ff0000' : '#bc13fe'; ctx.lineWidth = 6; ctx.strokeRect(offsetX - 5, offsetY - 5, boardW + 10, boardH + 10);
        ctx.fillStyle = challengeMode ? 'rgba(255,0,0,0.05)' : 'rgba(188, 19, 254, 0.05)'; ctx.fillRect(offsetX, offsetY, boardW, boardH);

        ctx.strokeStyle = challengeMode ? 'rgba(255, 0, 0, 0.15)' : 'rgba(0, 242, 255, 0.2)'; ctx.lineWidth = 1;
        for (let r = 0; r <= GRID_SIZE; r++) {
            ctx.beginPath(); ctx.moveTo(offsetX, offsetY + r * BLOCK_SIZE); ctx.lineTo(offsetX + GRID_SIZE * BLOCK_SIZE, offsetY + r * BLOCK_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(offsetX + r * BLOCK_SIZE, offsetY); ctx.lineTo(offsetX + r * BLOCK_SIZE, offsetY + GRID_SIZE * BLOCK_SIZE); ctx.stroke();
        }

        if (selectedShape && !gameOver) {
            const dyO = (isMobile && isTouch) ? -100 : -70;
            const dropY = dragPos.y + dyO;
            const c = Math.round((dragPos.x - offsetX - (selectedShape.matrix[0].length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            const r = Math.round((dropY - offsetY - (selectedShape.matrix.length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            if (canPlace(r, c, selectedShape.matrix)) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                selectedShape.matrix.forEach((row, y) => {
                    row.forEach((val, x) => { if (val) ctx.fillRect(offsetX + (c + x) * BLOCK_SIZE, offsetY + (r + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); });
                });
            }
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = grid[r][c];
                if (cell) drawBlock(offsetX + c * BLOCK_SIZE, offsetY + r * BLOCK_SIZE, BLOCK_SIZE, cell);
            }
        }

        const poolY = isMobile ? canvas.height - 120 : offsetY + GRID_SIZE * BLOCK_SIZE + 40;
        const poolWidth = isMobile ? canvas.width * 0.9 : GRID_SIZE * BLOCK_SIZE;
        const poolX = isMobile ? (canvas.width - poolWidth) / 2 : offsetX;
        shapesPool.forEach((s, i) => {
            if (s.used) return;
            const sx = poolX + (i * (poolWidth / 3)) + (poolWidth / 6) - (s.matrix[0].length * BLOCK_SIZE * 0.25);
            ctx.save(); ctx.translate(sx, poolY); ctx.scale(isMobile ? 0.5 : 0.6, isMobile ? 0.5 : 0.6);
            s.matrix.forEach((row, y) => {
                row.forEach((val, x) => { if (val) drawBlock(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, s.special === 'TNT' ? 'tnt' : s.colorIdx); });
            });
            ctx.restore();
        });

        if (selectedShape && !gameOver) {
            const dyO = (isMobile && isTouch) ? -100 : -70;
            ctx.save(); ctx.globalAlpha = 0.8;
            selectedShape.matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val) {
                        const dx = dragPos.x + x * BLOCK_SIZE - (selectedShape.matrix[0].length * BLOCK_SIZE) / 2;
                        const dy = dragPos.y + y * BLOCK_SIZE - (selectedShape.matrix.length * BLOCK_SIZE / 2) + dyO;
                        drawBlock(dx, dy, BLOCK_SIZE, selectedShape.special === 'TNT' ? 'tnt' : selectedShape.colorIdx);
                    }
                });
            });
            ctx.restore();
        }

        particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); if (p.life <= 0) particles.splice(i, 1); });
        ctx.globalAlpha = 1;

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = isMobile ? '900 40px Inter' : '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText(_t('game_over'), canvas.width/2, canvas.height/2 - 20);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Inter'; ctx.fillText(`FİNAL SKOR: ${score}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillStyle = '#00f2ff'; ctx.font = 'bold 16px Inter'; ctx.fillText('TEKRAR BAŞLAMAK İÇİN TIKLA', canvas.width/2, canvas.height/2 + 80);
        }
        ctx.restore();
    }

    function drawBlock(x, y, s, type) {
        if (processedBlocks[type]) {
            ctx.drawImage(processedBlocks[type], x, y, s, s);
        } else {
            ctx.fillStyle = (type === 'tnt') ? '#ff0000' : COLORS[type] || '#fff';
            ctx.fillRect(x+2, y+2, s-4, s-4);
        }
    }

    function update(t) { requestAnimationFrame(update); if (!window.gameStarted) return; lastTime = t; draw(); }

    function handleStart(mx, my, touch) {
        isTouch = touch; if (gameOver) { resetGame(); return; }
        if (canvas.width >= 768) {
            const panelGap = 20; const sidePanelW = offsetX - panelGap * 2;
            const rightMidX = offsetX + (GRID_SIZE * BLOCK_SIZE) + panelGap + sidePanelW / 2;
            const btnW = sidePanelW * 0.8, btnH = 60, btnX = rightMidX - btnW/2, btnY = 150;
            if (mx > btnX && mx < btnX + btnW && my > btnY && my < btnY + btnH) {
                challengeMode = !challengeMode; generateShapes(); shake = 30; checkGameOver(); return;
            }
        }
        const isMobile = canvas.width < 768;
        const poolY = isMobile ? canvas.height - 120 : offsetY + GRID_SIZE * BLOCK_SIZE + 40;
        const poolWidth = isMobile ? canvas.width * 0.9 : GRID_SIZE * BLOCK_SIZE;
        const poolX = isMobile ? (canvas.width - poolWidth) / 2 : offsetX;
        shapesPool.forEach((s, i) => {
            if (s.used) return;
            const sx = poolX + (i * (poolWidth / 3)) + (poolWidth / 6) - (s.matrix[0].length * BLOCK_SIZE * 0.25);
            const hit = isMobile ? 60 : 40;
            if (mx > sx - hit && mx < sx + 100 && my > poolY - hit && my < poolY + 100) { selectedShape = s; dragPos = { x: mx, y: my }; }
        });
    }

    function handleMove(mx, my) { if (selectedShape) dragPos = { x: mx, y: my }; }
    function handleEnd() {
        if (selectedShape) {
            const isMobile = canvas.width < 768;
            const dropY = dragPos.y + ((isMobile && isTouch) ? -100 : -70);
            const c = Math.round((dragPos.x - offsetX - (selectedShape.matrix[0].length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            const r = Math.round((dropY - offsetY - (selectedShape.matrix.length * BLOCK_SIZE / 2)) / BLOCK_SIZE);
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && canPlace(r, c, selectedShape.matrix)) {
                selectedShape.used = true; placeShape(r, c, selectedShape.matrix, selectedShape.colorIdx, selectedShape.special);
            }
            selectedShape = null;
        }
    }

    canvas.addEventListener('mousedown', e => { const rect = canvas.getBoundingClientRect(); handleStart(e.clientX - rect.left, e.clientY - rect.top, false); });
    window.addEventListener('mousemove', e => { const rect = canvas.getBoundingClientRect(); handleMove(e.clientX - rect.left, e.clientY - rect.top); });
    window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', e => { const rect = canvas.getBoundingClientRect(); const touch = e.touches[0]; handleStart(touch.clientX - rect.left, touch.clientY - rect.top, true); }, {passive: true});
    canvas.addEventListener('touchmove', e => { const rect = canvas.getBoundingClientRect(); const touch = e.touches[0]; handleMove(touch.clientX - rect.left, touch.clientY - rect.top); }, {passive: true});
    canvas.addEventListener('touchend', handleEnd);

    generateShapes(); requestAnimationFrame(update);
})();
