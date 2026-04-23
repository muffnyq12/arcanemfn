(function() {
    /**
     * JEWELS MASTER: MATCH 3 - SYMMETRICAL PRO LAYOUT
     * OPTIMIZED FOR PERFECT PROPORTIONS
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const GRID_SIZE = 8;
    let BLOCK_SIZE;
    let grid = [];
    let selected = null;
    let isAnimating = false;
    
    let level = parseInt(localStorage.getItem('retroArcade_jewels_level')) || 1;
    const getTargetScore = (lvl) => lvl * 1000;
    let targetScore = getTargetScore(level);
    
    let score = 0; let time = 120;
    let gameOver = false; let levelCompleted = false;
    let lastTime = 0; let shake = 0;

    const COLORS = ['#ff0077', '#00f2ff', '#39ff14', '#ffff00', '#bc13fe', '#ffaa00'];

    function createGrid() {
        grid = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = { type: Math.floor(Math.random() * COLORS.length) };
        }
        while (findMatches().length > 0) {
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) grid[r][c].type = Math.floor(Math.random() * COLORS.length);
            }
        }
    }

    function resize() {
        const container = document.getElementById('game-canvas-container');
        if (container) {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            // INCREASED BLOCK SIZE FOR BETTER PROPORTIONS
            BLOCK_SIZE = Math.floor((canvas.height * 0.88) / GRID_SIZE);
            if (BLOCK_SIZE * GRID_SIZE > canvas.width * 0.5) {
                BLOCK_SIZE = Math.floor((canvas.width * 0.5) / GRID_SIZE);
            }
        }
    }

    window.addEventListener('resize', resize);
    resize();

    function findMatches() {
        let matches = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 2; c++) {
                if (grid[r][c].type !== -1 && grid[r][c].type === grid[r][c+1].type && grid[r][c].type === grid[r][c+2].type) matches.push({r, c}, {r, c:c+1}, {r, c:c+2});
            }
        }
        for (let c = 0; c < GRID_SIZE; c++) {
            for (let r = 0; r < GRID_SIZE - 2; r++) {
                if (grid[r][c].type !== -1 && grid[r][c].type === grid[r+1][c].type && grid[r][c].type === grid[r+2][c].type) matches.push({r, c}, {r:r+1, c}, {r:r+2, c});
            }
        }
        return matches;
    }

    async function handleMatches() {
        let matches = findMatches();
        if (matches.length > 0) {
            isAnimating = true; shake = 10; score += matches.length * 10;
            if (score >= targetScore && !levelCompleted) {
                levelCompleted = true;
                setTimeout(() => {
                    level++; localStorage.setItem('retroArcade_jewels_level', level);
                    alert(`LEVEL ${level-1} TAMAMLANDI!`);
                    score = 0; targetScore = getTargetScore(level); time = 120; levelCompleted = false; createGrid();
                }, 500);
            }
            matches.forEach(m => grid[m.r][m.c].type = -1);
            await new Promise(r => setTimeout(r, 200));
            for (let c = 0; c < GRID_SIZE; c++) {
                let empty = 0;
                for (let r = GRID_SIZE - 1; r >= 0; r--) {
                    if (grid[r][c].type === -1) empty++;
                    else if (empty > 0) { grid[r + empty][c].type = grid[r][c].type; grid[r][c].type = -1; }
                }
                for (let r = 0; r < empty; r++) grid[r][c].type = Math.floor(Math.random() * COLORS.length);
            }
            setTimeout(handleMatches, 300);
        } else isAnimating = false;
    }

    function draw() {
        ctx.save();
        if (shake > 0) { ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2); shake *= 0.9; }
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);

        const isMobile = canvas.width < 768;
        const boardW = GRID_SIZE * BLOCK_SIZE;
        const boardH = GRID_SIZE * BLOCK_SIZE;
        const offsetX = (canvas.width - boardW) / 2;
        const offsetY = (canvas.height - boardH) / 2;

        // PERFECT PROPORTIONS: Dynamic Panel Widths
        if (!isMobile) {
            const panelGap = 20;
            const sidePanelW = offsetX - panelGap * 2;

            // Left Panel
            drawCyberPanel(ctx, panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'GÖREV VERİLERİ');
            // Right Panel
            drawCyberPanel(ctx, offsetX + boardW + panelGap, panelGap, sidePanelW, canvas.height - panelGap * 2, 'HEDEF ANALİZİ');
            
            // HUD Text Centered in Panels
            const leftMidX = panelGap + sidePanelW / 2;
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 28px Inter';
            ctx.fillText(`SEVİYE: ${level}`, leftMidX, 120);
            ctx.font = '24px Inter'; ctx.fillText(`SKOR: ${score}`, leftMidX, 190);
            ctx.fillStyle = '#ffd700'; ctx.fillText(`HEDEF: ${targetScore}`, leftMidX, 260);
            ctx.fillStyle = '#ff0077'; ctx.fillText(`SÜRE: ${Math.floor(time)}sn`, leftMidX, 330);

            // Right Panel Content (Placeholder or extra stats)
            const rightMidX = offsetX + boardW + panelGap + sidePanelW / 2;
            ctx.fillStyle = 'rgba(0, 242, 255, 0.4)'; ctx.font = 'bold 14px Inter';
            ctx.fillText('SİSTEM DURUMU: AKTİF', rightMidX, 120);
            ctx.fillText('SYNCHRONIZING...', rightMidX, 150);
        } else {
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter';
            ctx.fillText(`LVL ${level} | SKOR: ${score} | HEDEF: ${targetScore}`, canvas.width/2, 40);
            ctx.fillStyle = '#ff0077'; ctx.fillText(`${Math.floor(time)}sn`, canvas.width/2, 70);
        }

        // DRAW BOARD (Bigger & Bold)
        ctx.strokeStyle = '#bc13fe'; ctx.lineWidth = 8;
        ctx.strokeRect(offsetX - 5, offsetY - 5, boardW + 10, boardH + 10);
        ctx.fillStyle = 'rgba(188, 19, 254, 0.05)'; ctx.fillRect(offsetX, offsetY, boardW, boardH);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                let x = offsetX + c * BLOCK_SIZE; let y = offsetY + r * BLOCK_SIZE;
                if (grid[r][c].type !== -1) {
                    if (selected && selected.r === r && selected.c === c) {
                        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    }
                    drawGem(ctx, x + BLOCK_SIZE/2, y + BLOCK_SIZE/2, BLOCK_SIZE * 0.38, grid[r][c].type);
                }
            }
        }
        ctx.restore();
    }

    function drawGem(ctx, x, y, s, t) {
        ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = COLORS[t]; ctx.fillStyle = COLORS[t];
        ctx.beginPath();
        if (t === 0) { ctx.moveTo(x, y-s); ctx.lineTo(x+s, y); ctx.lineTo(x, y+s); ctx.lineTo(x-s, y); }
        else if (t === 1) { ctx.arc(x, y, s, 0, Math.PI*2); }
        else if (t === 2) { ctx.rect(x-s, y-s, s*2, s*2); }
        else { for(let i=0; i<6; i++) ctx.lineTo(x + s*Math.cos(i*Math.PI/3), y + s*Math.sin(i*Math.PI/3)); }
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function drawCyberPanel(ctx, x, y, w, h, title) {
        ctx.save(); ctx.fillStyle = 'rgba(0, 242, 255, 0.03)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
        // Cyber Corners
        ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 4; const cl = 30;
        ctx.beginPath(); ctx.moveTo(x, y+cl); ctx.lineTo(x, y); ctx.lineTo(x+cl, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+w-cl, y+h); ctx.lineTo(x+w, y+h); ctx.lineTo(x+w, y+h-cl); ctx.stroke();
        ctx.fillStyle = 'rgba(0, 242, 255, 1)'; ctx.font = '900 12px Inter'; ctx.textAlign = 'left';
        ctx.fillText(title, x+15, y+25); ctx.restore();
    }

    function update(t) {
        let dt = (t - lastTime) / 1000; lastTime = t;
        if (!gameOver && !isAnimating && !levelCompleted) { time -= dt; if (time <= 0) { time = 0; gameOver = true; alert("ZAMAN TÜKENDİ!"); location.reload(); } }
        draw(); requestAnimationFrame(update);
    }

    canvas.addEventListener('mousedown', e => {
        if (gameOver || isAnimating || levelCompleted) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
        const boardW = GRID_SIZE * BLOCK_SIZE; const boardH = GRID_SIZE * BLOCK_SIZE;
        const ox = (canvas.width - boardW) / 2; const oy = (canvas.height - boardH) / 2;
        const c = Math.floor((mx - ox) / BLOCK_SIZE); const r = Math.floor((my - oy) / BLOCK_SIZE);
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            if (!selected) selected = { r, c };
            else {
                if (Math.abs(r - selected.r) + Math.abs(c - selected.c) === 1) {
                    let t = grid[r][c].type; grid[r][c].type = grid[selected.r][selected.c].type; grid[selected.r][selected.c].type = t;
                    if (findMatches().length === 0) { grid[selected.r][selected.c].type = grid[r][c].type; grid[r][c].type = t; }
                    else handleMatches();
                    selected = null;
                } else selected = { r, c };
            }
        }
    });

    createGrid(); requestAnimationFrame(update);
})();
