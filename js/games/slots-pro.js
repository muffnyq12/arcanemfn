(function() {
    /**
     * SLOTS BEACH: DIGITAL REEF - MOBILE OPTIMIZED
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const REEL_COUNT = 5;
    const ROW_COUNT = 3;
    let REEL_WIDTH, REEL_HEIGHT;

    const SYMBOLS = [
        { name: 'Neon Ammonite', multiplier: [0, 0, 5, 20, 100], color: '#00f2ff' },
        { name: 'Plasma Jelly', multiplier: [0, 0, 10, 30, 150], color: '#bc13fe' },
        { name: 'Circuit Coral', multiplier: [0, 0, 15, 50, 250], color: '#39ff14' },
        { name: 'Digital Pearl', multiplier: [0, 0, 20, 80, 400], color: '#ffffff' },
        { name: 'Crystal Ray', multiplier: [0, 0, 30, 150, 700], color: '#ffaa00' },
        { name: 'Cyber Star', multiplier: [0, 0, 50, 250, 1200], color: '#ff0077' },
        { name: 'WILD CORE', multiplier: [0, 0, 100, 500, 5000], color: '#ffd700', isWild: true }
    ];

    const PAYLINES = [
        [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
        [0,0,1,2,2], [2,2,1,0,0], [1,0,0,0,1], [1,2,2,2,1], [0,1,0,1,0]
    ];

    let reels = [];
    let isSpinning = false, autoSpin = false, spinTimers = [];
    let credits = 22600;
    const BET_OPTIONS = [10, 50, 100, 500, 1000];
    let betIndex = 3, lastWin = 0, lastTime = 0, shake = 0, winLines = [], particles = [], globalRotation = 0;

    function initReels() {
        reels = [];
        for (let i = 0; i < REEL_COUNT; i++) {
            let syms = [];
            for (let j = 0; j < ROW_COUNT + 10; j++) syms.push(Math.floor(Math.random() * SYMBOLS.length));
            reels.push({ symbols: syms, offset: 0 });
        }
    }

    function resize() {
        const container = document.getElementById('game-canvas-container');
        if (container) {
            canvas.width = container.offsetWidth; canvas.height = container.offsetHeight;
            const isMobile = canvas.width < 768;
            REEL_WIDTH = Math.floor((canvas.width * (isMobile ? 0.9 : 0.8)) / REEL_COUNT);
            REEL_HEIGHT = Math.floor((canvas.height * (isMobile ? 0.6 : 0.6)) / ROW_COUNT);
        }
    }

    function spin() {
        if (isSpinning || credits < BET_OPTIONS[betIndex]) { autoSpin = false; return; }
        isSpinning = true; credits -= BET_OPTIONS[betIndex]; lastWin = 0; winLines = [];
        spinTimers = reels.map((_, i) => 1500 + i * 300);
    }

    function draw() {
        ctx.save();
        globalRotation += 0.05;
        if (shake > 0) { ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake); shake *= 0.9; }

        let bgGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
        bgGrad.addColorStop(0, '#001a2e'); bgGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        const isMobile = canvas.width < 768;
        const totalW = REEL_COUNT * REEL_WIDTH, totalH = ROW_COUNT * REEL_HEIGHT;
        const ox = (canvas.width - totalW) / 2;
        const oy = isMobile ? 80 : (canvas.height - totalH) / 2 - 40;

        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)'; ctx.lineWidth = 2;
        drawRoundedRect(ctx, ox - 10, oy - 10, totalW + 20, totalH + 20, 20, false, true, '#00f2ff', 2);
        
        ctx.save();
        ctx.beginPath(); ctx.rect(ox, oy, totalW, totalH); ctx.clip();
        for (let i = 0; i < REEL_COUNT; i++) {
            let rx = ox + i * REEL_WIDTH;
            for (let j = 0; j < reels[i].symbols.length; j++) {
                let sIdx = reels[i].symbols[j];
                let ry = oy + (j - 1) * REEL_HEIGHT + reels[i].offset;
                if (ry > oy - REEL_HEIGHT && ry < oy + totalH + REEL_HEIGHT) {
                    drawProceduralSymbol(ctx, rx + REEL_WIDTH/2, ry + REEL_HEIGHT/2, REEL_HEIGHT*0.35, sIdx);
                }
            }
            if (spinTimers[i] > 0) {
                reels[i].offset += isMobile ? 45 : 60;
                if (reels[i].offset >= REEL_HEIGHT) {
                    reels[i].offset = 0;
                    reels[i].symbols.unshift(Math.floor(Math.random() * SYMBOLS.length));
                    reels[i].symbols.pop();
                }
            } else { reels[i].offset = 0; }
        }
        ctx.restore();

        particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); if (p.life <= 0) particles.splice(i, 1); });
        ctx.globalAlpha = 1;

        // UI
        const uiY = isMobile ? canvas.height - 90 : canvas.height - 80;
        if (isMobile) {
            // Compact HUD
            ctx.fillStyle = 'rgba(0, 242, 255, 0.1)'; ctx.fillRect(0, 0, canvas.width, 60);
            ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 12px Inter';
            ctx.fillText(`BAL: ${credits}`, canvas.width * 0.3, 35);
            ctx.fillText(`WIN: ${lastWin}`, canvas.width * 0.7, 35);

            drawButton(ctx, 10, uiY, 90, 70, autoSpin ? 'AUTO:ON' : 'AUTO', autoSpin ? '#ff0077' : '#004a7c');
            drawButton(ctx, 110, uiY, 110, 70, `BET:${BET_OPTIONS[betIndex]}`, '#004a7c');
            drawButton(ctx, canvas.width - 100, uiY, 90, 70, isSpinning ? '...' : 'SPIN', '#ffd700', '#000');
        } else {
            drawButton(ctx, 30, uiY, 120, 60, autoSpin ? 'AUTO: ON' : 'AUTO', autoSpin ? '#ff0077' : '#004a7c');
            drawButton(ctx, 170, uiY, 180, 60, `BET: ${BET_OPTIONS[betIndex]}`, '#004a7c');
            drawButton(ctx, 370, uiY, 250, 60, `BAL: ${credits}`, '#004a7c');
            drawButton(ctx, canvas.width - 160, uiY, 140, 60, isSpinning ? '...' : 'SPIN', '#ffd700', '#000');
        }

        if (lastWin > 0 && !isSpinning) {
            ctx.fillStyle = '#ffff00'; ctx.font = '900 40px Inter'; ctx.textAlign = 'center';
            ctx.shadowBlur = 20; ctx.shadowColor = '#000'; ctx.fillText(`WIN: +${lastWin}`, canvas.width/2, oy + totalH/2);
        }
        ctx.restore();
    }

    function drawProceduralSymbol(ctx, x, y, size, idx) {
        ctx.save(); ctx.translate(x, y); const s = SYMBOLS[idx];
        ctx.shadowBlur = 15; ctx.shadowColor = s.color; ctx.strokeStyle = s.color; ctx.lineWidth = 2.5;
        switch(idx) {
            case 0: ctx.beginPath(); for(let i=0; i<15; i++) { let r = (i/15)*size; let a = i * 0.6 + globalRotation; ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.stroke(); break;
            case 1: ctx.beginPath(); ctx.arc(0, -size/4, size/2, Math.PI, 0); ctx.stroke(); for(let i=0; i<3; i++) { ctx.beginPath(); ctx.moveTo(-size/4 + i*size/4, 0); ctx.lineTo(-size/4 + i*size/4 + Math.sin(globalRotation+i)*10, size/2); ctx.stroke(); } break;
            case 2: for(let i=0; i<4; i++) { let a = i * Math.PI/2 + globalRotation*0.5; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*size, Math.sin(a)*size); ctx.stroke(); } break;
            case 3: ctx.beginPath(); ctx.arc(0, 0, size/2, 0, Math.PI*2); ctx.stroke(); ctx.save(); ctx.rotate(-globalRotation); ctx.strokeRect(-size/4, -size/4, size/2, size/2); ctx.restore(); break;
            case 4: ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(0, -size/2); ctx.lineTo(size, 0); ctx.lineTo(0, size/2); ctx.closePath(); ctx.stroke(); break;
            case 5: ctx.beginPath(); for(let i=0; i<10; i++) { let r = i%2===0 ? size : size/2; let a = i * Math.PI/5 + globalRotation; ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.closePath(); ctx.stroke(); break;
            case 6: ctx.save(); ctx.rotate(globalRotation); ctx.strokeRect(-size/2, -size/2, size, size); ctx.rotate(globalRotation*0.5); ctx.strokeRect(-size/3, -size/3, size*0.6, size*0.6); ctx.restore(); break;
        }
        ctx.restore();
    }

    function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke, strokeColor, strokeWidth) {
        ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath(); if (fill) ctx.fill(); if (stroke) { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.stroke(); }
    }

    function drawButton(ctx, x, y, w, h, text, color, textColor = '#fff') {
        ctx.save(); let grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, color); grad.addColorStop(1, '#000');
        ctx.fillStyle = grad; drawRoundedRect(ctx, x, y, w, h, 12, true, true, '#fff', 2);
        ctx.fillStyle = textColor; ctx.font = '900 13px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w/2, y + h/2); ctx.restore();
    }

    function checkWins() {
        let totalWin = 0; const grid = reels.map(r => r.symbols.slice(0, ROW_COUNT));
        const isM = canvas.width < 768; const ox = (canvas.width - REEL_COUNT * REEL_WIDTH) / 2; const oy = isM ? 80 : (canvas.height - ROW_COUNT * REEL_HEIGHT) / 2 - 40;
        PAYLINES.forEach((line, lIdx) => {
            let sIdx = grid[0][line[0]]; let count = 1;
            for (let i = 1; i < REEL_COUNT; i++) { let current = grid[i][line[i]]; if (current === sIdx || SYMBOLS[current].isWild || SYMBOLS[sIdx].isWild) { if (SYMBOLS[sIdx].isWild && !SYMBOLS[current].isWild) sIdx = current; count++; } else break; }
            if (count >= 3) {
                totalWin += BET_OPTIONS[betIndex] * SYMBOLS[sIdx].multiplier[count - 1];
                if (count === 5) { shake = 30; for (let i = 0; i < REEL_COUNT; i++) { const px = ox + i * REEL_WIDTH + REEL_WIDTH/2, py = oy + line[i] * REEL_HEIGHT + REEL_HEIGHT/2; for(let k=0; k<12; k++) particles.push({ x: px, y: py, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 1, size: Math.random()*4+2, color: SYMBOLS[sIdx].color }); } }
            }
        });
        if (totalWin > 0) { credits += totalWin; lastWin = totalWin; if (shake === 0) shake = 10; }
        if (autoSpin && credits >= BET_OPTIONS[betIndex]) setTimeout(spin, 1200); else if (credits < BET_OPTIONS[betIndex]) autoSpin = false;
    }

    function handleInteraction(ex, ey) {
        const rect = canvas.getBoundingClientRect(); const mx = ex - rect.left, my = ey - rect.top;
        const uiY = canvas.width < 768 ? canvas.height - 90 : canvas.height - 80;
        const isM = canvas.width < 768;
        if (mx > canvas.width - (isM ? 100 : 160) && my > uiY) spin();
        else if (mx > 10 && mx < (isM ? 100 : 150) && my > uiY) { autoSpin = !autoSpin; if (autoSpin && !isSpinning) spin(); }
        else if (mx > (isM ? 110 : 170) && mx < (isM ? 220 : 350) && my > uiY) { betIndex = (betIndex + 1) % BET_OPTIONS.length; }
    }

    canvas.addEventListener('mousedown', e => handleInteraction(e.clientX, e.clientY));
    canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInteraction(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});

    function update(t) { if (!window.gameStarted) { lastTime = t; requestAnimationFrame(update); return; } let dt = t - lastTime; lastTime = t; if (isSpinning) { let fin = true; for (let i = 0; i < REEL_COUNT; i++) { if (spinTimers[i] > 0) { spinTimers[i] -= dt; fin = false; } } if (fin) { isSpinning = false; checkWins(); } } draw(); requestAnimationFrame(update); }
    initReels(); window.addEventListener('resize', resize); resize(); requestAnimationFrame(update);
})();
