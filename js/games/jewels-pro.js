(function() {
    /**
     * JEWELS PRO: CANDY EDITION - MOBILE OPTIMIZED
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

    const COLORS = [null, '#00f2ff', '#bc13fe', '#ff0077', '#ffff00', '#39ff14', '#ffaa00'];
    
    // Assets & Transparency Engine
    const jewelImages = {};
    const processedJewels = {};
    let assetsLoaded = 0;

    function loadAsset(id, src) {
        const img = new Image(); img.src = src;
        img.onload = () => { processedJewels[id] = removeBlack(img); assetsLoaded++; };
        jewelImages[id] = img;
    }
    for (let i = 1; i <= 6; i++) loadAsset(i, `assets/games/jewels/${i}.png`);

    function removeBlack(img) {
        const off = document.createElement('canvas'); off.width = img.width; off.height = img.height;
        const octx = off.getContext('2d'); octx.drawImage(img, 0, 0);
        const data = octx.getImageData(0,0,off.width,off.height);
        for(let i=0; i<data.data.length; i+=4) if(data.data[i]<35 && data.data[i+1]<35 && data.data[i+2]<35) data.data[i+3]=0;
        octx.putImageData(data, 0, 0); return off;
    }

    function initGrid() {
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
        } else {
            // MOBILE COMPACT HUD
            ctx.fillStyle = 'rgba(0, 242, 255, 0.1)'; ctx.fillRect(0, 0, canvas.width, 60);
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 13px Inter';
            ctx.fillText(`LVL: ${level}`, canvas.width * 0.15, 35);
            ctx.fillText(`HEDEF: ${scoreGoal}`, canvas.width * 0.4, 35);
            ctx.fillText(`SKOR: ${score}`, canvas.width * 0.65, 35);
            ctx.fillStyle = timeLeft < 15 ? '#ff0077' : '#39ff14';
            ctx.fillText(`SÜRE: ${Math.ceil(timeLeft)}`, canvas.width * 0.88, 35);
        }

        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 4;
        ctx.strokeRect(offsetX - 2, offsetY - 2, boardW + 4, boardH + 4);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.05)'; ctx.fillRect(offsetX, offsetY, boardW, boardH);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const type = grid[r][c];
                if (type) {
                    const x = offsetX + c * CELL_SIZE, y = offsetY + r * CELL_SIZE;
                    if (selected && selected.r === r && selected.c === c) {
                        ctx.save();
                        ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                        ctx.restore();
                    }
                    if (processedJewels[type]) { 
                        let bounce = (selected && selected.r === r && selected.c === c) ? Math.sin(Date.now()*0.01)*5 : 0;
                        ctx.drawImage(processedJewels[type], x + 5, y + 5 + bounce, CELL_SIZE - 10, CELL_SIZE - 10); 
                    }
                    else { ctx.fillStyle = COLORS[type]; ctx.beginPath(); ctx.arc(x + CELL_SIZE/2, y + CELL_SIZE/2, CELL_SIZE/3, 0, Math.PI*2); ctx.fill(); }
                }
            }
        }

        particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); if (p.life <= 0) particles.splice(i, 1); });
        ctx.globalAlpha = 1;

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText('OYUN BİTTİ!', canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Inter'; ctx.fillText(`FİNAL SKOR: ${score}`, canvas.width/2, canvas.height/2 + 60);
        }
    }

    function drawCyberPanel(ctx, x, y, w, h, title) {
        ctx.save(); ctx.fillStyle = 'rgba(0, 242, 255, 0.03)'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
        ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 3; const cl = 20;
        ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();
        ctx.fillStyle = '#00f2ff'; ctx.font = '900 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(title, x + 15, y + 20); ctx.restore();
    }

    function checkLevelUp() {
        if (score >= scoreGoal) { level++; scoreGoal += 1000; timeLeft = 100; createLevelUpEffect(); }
    }

    function createLevelUpEffect() {
        for(let i=0; i<50; i++) { particles.push({x: canvas.width/2, y: canvas.height/2, vx:(Math.random()-0.5)*20, vy:(Math.random()-0.5)*20, life:1.5, size:Math.random()*6+4, color:'#bc13fe'}); }
    }

    function checkMatches() {
        let matched = false; let toRemove = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
        for (let r = 0; r < GRID_SIZE; r++) { for (let c = 0; c < GRID_SIZE - 2; c++) { if (grid[r][c] && grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) { toRemove[r][c] = toRemove[r][c+1] = toRemove[r][c+2] = true; matched = true; } } }
        for (let c = 0; c < GRID_SIZE; c++) { for (let r = 0; r < GRID_SIZE - 2; r++) { if (grid[r][c] && grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) { toRemove[r][c] = toRemove[r+1][c] = toRemove[r+2][c] = true; matched = true; } } }
        if (matched) {
            for (let r = 0; r < GRID_SIZE; r++) { for (let c = 0; c < GRID_SIZE; c++) { if (toRemove[r][c]) { const x = (canvas.width - GRID_SIZE*CELL_SIZE)/2 + c*CELL_SIZE + CELL_SIZE/2, y = (canvas.height - GRID_SIZE*CELL_SIZE)/2 + r*CELL_SIZE + CELL_SIZE/2; for(let i=0; i<8; i++) particles.push({x, y, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, life:1, size:Math.random()*4+2, color:COLORS[grid[r][c]]}); grid[r][c] = 0; score += 10; } } }
            checkLevelUp(); setTimeout(fillGrid, 300);
        } else { isProcessing = false; }
        return matched;
    }

    function fillGrid() {
        for (let c = 0; c < GRID_SIZE; c++) { let empty = 0; for (let r = GRID_SIZE - 1; r >= 0; r--) { if (grid[r][c] === 0) empty++; else if (empty > 0) { grid[r + empty][c] = grid[r][c]; grid[r][c] = 0; } } for (let r = 0; r < empty; r++) grid[r][c] = Math.floor(Math.random() * 6) + 1; }
        setTimeout(checkMatches, 200);
    }

    function handleInteraction(ex, ey) {
        if (gameOver || isProcessing) return;
        const rect = canvas.getBoundingClientRect();
        const offsetX = (canvas.width - GRID_SIZE * CELL_SIZE) / 2, offsetY = (canvas.height - GRID_SIZE * CELL_SIZE) / 2;
        const c = Math.floor((ex - rect.left - offsetX) / CELL_SIZE), r = Math.floor((ey - rect.top - offsetY) / CELL_SIZE);
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
        if (!selected) { selected = {r, c}; }
        else {
            const dist = Math.abs(selected.r - r) + Math.abs(selected.c - c);
            if (dist === 1) {
                isProcessing = true;
                const r1 = selected.r, c1 = selected.c, r2 = r, c2 = c;
                const t = grid[r1][c1]; grid[r1][c1] = grid[r2][c2]; grid[r2][c2] = t;
                setTimeout(() => { if (!checkMatches()) { const t2 = grid[r1][c1]; grid[r1][c1] = grid[r2][c2]; grid[r2][c2] = t2; isProcessing = false; } }, 300);
            }
            selected = null;
        }
    }

    canvas.addEventListener('mousedown', e => handleInteraction(e.clientX, e.clientY));
    canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInteraction(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});

    function update(t) {
        if (!window.gameStarted) { lastTime = t; requestAnimationFrame(update); return; }
        const dt = (t - lastTime) / 1000; lastTime = t;
        if (!gameOver) { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; gameOver = true; endGame(); } }
        draw(); requestAnimationFrame(update);
    }
    function endGame() { setTimeout(() => { const o = document.getElementById('play-overlay'); if (o) o.style.display = 'flex'; }, 2000); }

    initGrid(); window.addEventListener('resize', () => { canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight; });
    canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight;
    requestAnimationFrame(update);
})();
