(function() {
    /**
     * JEWELS PRO: FULL RECOVERY & STABILIZATION
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const GRID_SIZE = 8;
    let CELL_SIZE = 60;
    let grid = [];
    let selected = null;
    let score = 0;
    let level = 1;
    let scoreGoal = 1000;
    let timeLeft = 100;
    let gameOver = false;
    let lastTime = 0;
    let particles = [];
    let isProcessing = false;
    let isPaused = false;

    const COLORS = [null, '#00f2ff', '#bc13fe', '#ff0077', '#ffff00', '#39ff14', '#ffaa00'];
    const processedJewels = {};
    const boardBg = new Image(); boardBg.src = 'assets/games/jewels/bg.png';

    function loadAsset(id, src) {
        const img = new Image(); img.src = src;
        img.onload = () => { processedJewels[id] = removeBlack(img); };
    }
    for (let i = 1; i <= 6; i++) loadAsset(i, `assets/games/jewels/${i}.png`);

    function removeBlack(img) {
        const off = document.createElement('canvas'); off.width = img.width; off.height = img.height;
        const octx = off.getContext('2d'); octx.drawImage(img, 0, 0);
        const data = octx.getImageData(0,0,off.width,off.height);
        for(let i=0; i<data.data.length; i+=4) if(data.data[i]<35 && data.data[i+1]<35 && data.data[i+2]<35) data.data[i+3]=0;
        octx.putImageData(data, 0, 0); return off;
    }

    function saveGameState() {
        if (gameOver) return;
        const state = { grid, score, level, scoreGoal, timeLeft, timestamp: Date.now() };
        localStorage.setItem('retroArcade_save_jewels-pro', JSON.stringify(state));
    }

    function loadGameState() {
        const saved = localStorage.getItem('retroArcade_save_jewels-pro');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                grid = state.grid; score = state.score; level = state.level;
                scoreGoal = state.scoreGoal; timeLeft = state.timeLeft;
                return true;
            } catch(e) { return false; }
        }
        return false;
    }

    function init(forceNew = false) {
        if (!forceNew && loadGameState()) {
            gameOver = false; isPaused = false; window.scoreSaved = false;
            return;
        }
        grid = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                let type;
                do { type = Math.floor(Math.random() * 6) + 1; } 
                while ((c > 1 && grid[r][c-1] === type && grid[r][c-2] === type) || (r > 1 && grid[r-1][c] === type && grid[r-2][c] === type));
                grid[r][c] = type;
            }
        }
        score = 0; level = 1; scoreGoal = 1000; timeLeft = 100; gameOver = false; isPaused = false;
        window.scoreSaved = false;
        localStorage.removeItem('retroArcade_save_jewels-pro');
    }

    window.togglePause = function() {
        if (gameOver) return false;
        isPaused = !isPaused;
        return isPaused;
    };

    function drawCyberPanel(ctx, x, y, w, h, title) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.2)'; ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.02)'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.5)'; ctx.fillRect(x, y, w, 25);
        ctx.fillStyle = '#000'; ctx.font = '900 12px Inter'; ctx.textAlign = 'center';
        ctx.fillText(title, x + w/2, y + 17);
        ctx.restore();
    }

    function draw() {
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const isMobile = canvas.width < 768;
        const scale = isMobile ? 0.85 : 0.92;
        CELL_SIZE = Math.floor((canvas.height * scale) / GRID_SIZE);
        if (CELL_SIZE * GRID_SIZE > canvas.width * 0.9) CELL_SIZE = Math.floor((canvas.width * 0.9) / GRID_SIZE);
        const boardW = GRID_SIZE * CELL_SIZE, boardH = GRID_SIZE * CELL_SIZE;
        const offsetX = (canvas.width - boardW) / 2, offsetY = (canvas.height - boardH) / 2;

        if (!isMobile) {
            const panelGap = 20; const sideW = offsetX - panelGap * 2;
            drawCyberPanel(ctx, panelGap, panelGap, sideW, canvas.height - panelGap * 2, 'OYUNCU VERİSİ');
            drawCyberPanel(ctx, offsetX + boardW + panelGap, panelGap, sideW, canvas.height - panelGap * 2, 'GÖREV DURUMU');
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 18px Inter';
            ctx.fillText('SKOR', panelGap + sideW/2, 80);
            ctx.font = 'bold 36px Inter'; ctx.fillStyle = '#00f2ff'; ctx.fillText(score, panelGap + sideW/2, 120);
            ctx.fillText('HEDEF', panelGap + sideW/2, 200);
            ctx.font = 'bold 30px Inter'; ctx.fillStyle = '#ffaa00'; ctx.fillText(scoreGoal, panelGap + sideW/2, 240);
            ctx.fillText('KALAN SÜRE', offsetX + boardW + panelGap + sideW/2, 80);
            ctx.font = 'bold 45px Inter'; ctx.fillStyle = timeLeft < 15 ? '#ff0077' : '#39ff14';
            ctx.fillText(Math.ceil(timeLeft), offsetX + boardW + panelGap + sideW/2, 130);
            ctx.fillStyle = '#fff'; ctx.font = '900 18px Inter';
            ctx.fillText('SEVİYE', offsetX + boardW + panelGap + sideW/2, 210);
            ctx.font = 'bold 40px Inter'; ctx.fillStyle = '#bc13fe'; ctx.fillText(level, offsetX + boardW + panelGap + sideW/2, 260);
        }
        window.currentGameScore = score;

        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 4;
        ctx.strokeRect(offsetX - 2, offsetY - 2, boardW + 4, boardH + 4);

        // Draw Board Background Asset
        if (boardBg.complete) {
            ctx.save(); ctx.globalAlpha = 0.5;
            ctx.drawImage(boardBg, offsetX, offsetY, boardW, boardH);
            ctx.restore();
        }
        
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const type = grid[r][c];
                if (type) {
                    const x = offsetX + c * CELL_SIZE, y = offsetY + r * CELL_SIZE;
                    if (processedJewels[type]) ctx.drawImage(processedJewels[type], x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10);
                    else { ctx.fillStyle = COLORS[type]; ctx.fillRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10); }
                    if (selected && selected.r === r && selected.c === c) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4); }
                }
            }
        }
        
        particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); });
        ctx.globalAlpha = 1;

        const lastScore = localStorage.getItem('retroArcade_lastScore_jewels-pro') || 0;
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
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = 'bold 40px Inter'; ctx.textAlign = 'center';
            ctx.fillText('ZAMAN DOLDU!', canvas.width/2, canvas.height/2 - 20);
            ctx.fillStyle = '#fff'; ctx.font = '20px Inter'; ctx.fillText(`Final Skor: ${score}`, canvas.width/2, canvas.height/2 + 30);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 18px Inter';
            ctx.fillText('YENİDEN BAŞLAMAK İÇİN TIKLAYIN', canvas.width/2, canvas.height/2 + 80);
        }
    }

    function checkMatches() {
        let matched = false; const matchGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
        for (let r = 0; r < GRID_SIZE; r++) { for (let c = 0; c < GRID_SIZE - 2; c++) { if (grid[r][c] && grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) { matchGrid[r][c] = matchGrid[r][c+1] = matchGrid[r][c+2] = true; matched = true; } } }
        for (let c = 0; c < GRID_SIZE; c++) { for (let r = 0; r < GRID_SIZE - 2; r++) { if (grid[r][c] && grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) { matchGrid[r][c] = matchGrid[r+1][c] = matchGrid[r+2][c] = true; matched = true; } } }
        if (matched) {
            isProcessing = true; let matchCount = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (matchGrid[r][c]) {
                        for(let k=0; k<8; k++) particles.push({ x: (canvas.width - GRID_SIZE * CELL_SIZE) / 2 + c*CELL_SIZE + CELL_SIZE/2, y: (canvas.height - GRID_SIZE * CELL_SIZE) / 2 + r*CELL_SIZE + CELL_SIZE/2, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, life:1, color: COLORS[grid[r][c]], size: Math.random()*5+2 });
                        grid[r][c] = null; matchCount++;
                    }
                }
            }
            score += matchCount * 10;
            saveGameState();
            setTimeout(() => { fillGaps(); }, 300);
        } else {
            isProcessing = false;
            if (score >= scoreGoal) { level++; scoreGoal += 500; timeLeft = 100; saveGameState(); }
        }
    }

    function fillGaps() {
        for (let c = 0; c < GRID_SIZE; c++) {
            let emptySpaces = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) { if (grid[r][c] === null) emptySpaces++; else if (emptySpaces > 0) { grid[r + emptySpaces][c] = grid[r][c]; grid[r][c] = null; } }
            for (let i = 0; i < emptySpaces; i++) grid[i][c] = Math.floor(Math.random() * 6) + 1;
        }
        checkMatches();
    }

    function handleInteraction(e) {
        if (gameOver || isProcessing || isPaused) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX, clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left, y = clientY - rect.top;
        const boardW = GRID_SIZE * CELL_SIZE, boardH = GRID_SIZE * CELL_SIZE;
        const offsetX = (canvas.width - boardW) / 2, offsetY = (canvas.height - boardH) / 2;
        const c = Math.floor((x - offsetX) / CELL_SIZE), r = Math.floor((y - offsetY) / CELL_SIZE);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            if (!selected) selected = { r, c };
            else { if (Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1) { const temp = grid[r][c]; grid[r][c] = grid[selected.r][selected.c]; grid[selected.r][selected.c] = temp; selected = null; checkMatches(); } else selected = { r, c }; }
        }
    }

    let saveTimer = 0;
    function update(time) {
        const dt = (time - lastTime) / 1000; lastTime = time;
        if (!isPaused && window.gameStarted && !gameOver) {
            timeLeft -= dt;
            saveTimer += dt;
            if (saveTimer > 2) { saveGameState(); saveTimer = 0; } // Save every 2 seconds
            if (timeLeft <= 0) { 
                timeLeft = 0; gameOver = true; 
                localStorage.removeItem('retroArcade_save_jewels-pro');
                if (window.saveUserScore) window.saveUserScore(score); 
            }
        }
        draw(); requestAnimationFrame(update);
    }

    canvas.addEventListener('mousedown', e => { if (gameOver) { init(true); return; } handleInteraction(e); });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameOver) { init(true); return; } handleInteraction(e); });

    init();
    requestAnimationFrame(update);
})();
