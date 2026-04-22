(function() {
    /**
     * JEWELS MASTER: MATCH 3 - MOBILE LANDSCAPE ADAPTIVE
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const GRID_SIZE = 8;
    let BLOCK_SIZE;
    let grid = [];
    let selected = null;
    let isAnimating = false;
    
    let score = 0; let level = 1; let time = 120;
    let gameOver = false; let lastTime = 0; let shake = 0;

    const COLORS = ['#ff0077', '#00f2ff', '#39ff14', '#ffff00', '#bc13fe', '#ffaa00'];

    function createGrid() {
        grid = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                grid[r][c] = { type: Math.floor(Math.random() * COLORS.length) };
            }
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
            
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                // LANDSCAPE MOBILE: Height is limited
                BLOCK_SIZE = Math.floor((canvas.height * 0.85) / GRID_SIZE);
            } else {
                BLOCK_SIZE = Math.floor((canvas.height * 0.9) / GRID_SIZE);
            }
        }
    }

    window.addEventListener('resize', resize);
    resize();

    function findMatches() {
        let matches = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 2; c++) {
                if (grid[r][c].type !== -1 && grid[r][c].type === grid[r][c+1].type && grid[r][c].type === grid[r][c+2].type) {
                    matches.push({r, c}, {r, c:c+1}, {r, c:c+2});
                }
            }
        }
        for (let c = 0; c < GRID_SIZE; c++) {
            for (let r = 0; r < GRID_SIZE - 2; r++) {
                if (grid[r][c].type !== -1 && grid[r][c].type === grid[r+1][c].type && grid[r][c].type === grid[r+2][c].type) {
                    matches.push({r, c}, {r:r+1, c}, {r:r+2, c});
                }
            }
        }
        return matches;
    }

    async function handleMatches() {
        let matches = findMatches();
        if (matches.length > 0) {
            isAnimating = true; shake = 10; score += matches.length * 10;
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

        let offsetX, offsetY;
        if (isMobile) {
            // MOBILE LANDSCAPE: Grid on the left
            offsetX = 40;
            offsetY = (canvas.height - boardH) / 2;
        } else {
            offsetX = (canvas.width - boardW) / 2;
            offsetY = (canvas.height - boardH) / 2;
        }

        // DRAW BOARD
        ctx.fillStyle = '#f4a460'; // Sandy board
        drawRoundedRect(ctx, offsetX - 15, offsetY - 15, boardW + 30, boardH + 30, 20, true, true, '#40e0d0', 8);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                let x = offsetX + c * BLOCK_SIZE;
                let y = offsetY + r * BLOCK_SIZE;
                if (grid[r][c].type !== -1) {
                    if (selected && selected.r === r && selected.c === c) {
                        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    }
                    drawGem(ctx, x + BLOCK_SIZE/2, y + BLOCK_SIZE/2, BLOCK_SIZE * 0.4, grid[r][c].type);
                }
            }
        }

        // HUD - Adapt to mobile landscape
        if (isMobile) {
            const hudX = offsetX + boardW + 60;
            ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Inter';
            ctx.fillText('JEWELS STATS', hudX, 80);
            ctx.font = '18px Inter'; ctx.fillText(`SCORE: ${score}`, hudX, 130);
            ctx.fillText(`TIME: ${Math.floor(time)}s`, hudX, 170);
            
            // Buttons at the bottom right
            drawButton(ctx, canvas.width - 150, canvas.height - 70, 130, 50, 'RESTART', '#00bfff');
        } else {
            // PC Layout (Previous)
            drawCyberPanel(ctx, 0, 0, offsetX - 30, canvas.height, 'JEWEL DATA');
            drawCyberPanel(ctx, offsetX + boardW + 30, 0, canvas.width - (offsetX + boardW + 30), canvas.height, 'PROTOCOL');
        }

        ctx.restore();
    }

    function drawGem(ctx, x, y, s, t) {
        ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = COLORS[t]; ctx.fillStyle = COLORS[t];
        ctx.beginPath();
        if (t === 0) { ctx.moveTo(x, y-s); ctx.lineTo(x+s, y); ctx.lineTo(x, y+s); ctx.lineTo(x-s, y); }
        else if (t === 1) { ctx.arc(x, y, s, 0, Math.PI*2); }
        else if (t === 2) { ctx.rect(x-s/1.2, y-s/1.2, s*1.6, s*1.6); }
        else { for(let i=0; i<6; i++) ctx.lineTo(x + s*Math.cos(i*Math.PI/3), y + s*Math.sin(i*Math.PI/3)); }
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke, strokeColor, strokeWidth) {
        ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath(); if (fill) ctx.fill(); if (stroke) { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.stroke(); }
    }

    function drawButton(ctx, x, y, w, h, text, color) {
        ctx.fillStyle = color; drawRoundedRect(ctx, x, y, w, h, 10, true, false);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w/2, y + h/2);
    }

    function drawCyberPanel(ctx, x, y, w, h, title) {
        ctx.save(); ctx.fillStyle = 'rgba(0, 242, 255, 0.05)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 4; const cl = 40;
        ctx.beginPath(); ctx.moveTo(x, y+cl); ctx.lineTo(x, y); ctx.lineTo(x+cl, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+w-cl, y); ctx.lineTo(x+w, y); ctx.lineTo(x+w, y+cl); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+w, y+h-cl); ctx.lineTo(x+w, y+h); ctx.lineTo(x+w-cl, y+h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y+h-cl); ctx.lineTo(x, y+h); ctx.lineTo(x+cl, y+h); ctx.stroke();
        ctx.fillStyle = 'rgba(0, 242, 255, 0.8)'; ctx.font = 'bold 12px Inter'; ctx.fillText(title, x+10, y+20); ctx.restore();
    }

    function update(t) {
        let dt = (t - lastTime) / 1000; lastTime = t;
        if (!gameOver) { time -= dt; if (time <= 0) { time = 0; gameOver = true; } }
        draw(); requestAnimationFrame(update);
    }

    canvas.addEventListener('mousedown', e => {
        if (gameOver || isAnimating) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
        const isMobile = window.innerWidth < 768;
        const boardW = GRID_SIZE * BLOCK_SIZE; const boardH = GRID_SIZE * BLOCK_SIZE;
        const ox = isMobile ? 40 : (canvas.width - boardW) / 2;
        const oy = (canvas.height - boardH) / 2;
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
