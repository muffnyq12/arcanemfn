(function() {
    /**
     * SLOTS BEACH: PRO EDITION - MOBILE LANDSCAPE ADAPTIVE
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const REEL_COUNT = 5;
    const ROW_COUNT = 3;
    let REEL_WIDTH, REEL_HEIGHT;
    
    const SYMBOLS = [
        { char: '🐙', color: '#ff69b4', value: 10 },
        { char: '⚓', color: '#4682b4', value: 20 },
        { char: '🐚', color: '#fff5ee', value: 30 },
        { char: '🍹', color: '#ff4500', value: 50 },
        { char: '🦀', color: '#ff0000', value: 100 },
        { char: '🎡', color: '#ffd700', value: 500 }
    ];

    let reels = [];
    let isSpinning = false;
    let spinTimers = [];
    let credits = 22600;
    let bet = 500;
    let lastWin = 0;
    let lastTime = 0;
    let shake = 0;

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
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                REEL_WIDTH = Math.floor((canvas.width * 0.65) / REEL_COUNT);
                REEL_HEIGHT = Math.floor((canvas.height * 0.75) / ROW_COUNT);
            } else {
                REEL_WIDTH = Math.floor((canvas.width * 0.75) / REEL_COUNT);
                REEL_HEIGHT = Math.floor((canvas.height * 0.65) / ROW_COUNT);
            }
        }
    }

    window.addEventListener('resize', resize);
    resize();

    function spin() {
        if (isSpinning || credits < bet) return;
        isSpinning = true; credits -= bet; lastWin = 0;
        spinTimers = reels.map((_, i) => 2000 + i * 400);
    }

    function draw() {
        ctx.save();
        if (shake > 0) { ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2); shake *= 0.9; }

        let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, '#00bfff'); bgGrad.addColorStop(1, '#f4a460');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        const isMobile = canvas.width < 768;
        const totalW = REEL_COUNT * REEL_WIDTH;
        const totalH = ROW_COUNT * REEL_HEIGHT;

        let ox, oy;
        if (isMobile) {
            ox = 20; // Pushed to left
            oy = (canvas.height - totalH) / 2;
        } else {
            ox = (canvas.width - totalW) / 2;
            oy = (canvas.height - totalH) / 2 - 30;
        }

        // Draw Frame
        ctx.fillStyle = '#f5deb3';
        drawRoundedRect(ctx, ox - 15, oy - 15, totalW + 30, totalH + 30, 20, true, true, '#40e0d0', 10);

        ctx.save();
        ctx.beginPath(); ctx.rect(ox, oy, totalW, totalH); ctx.clip();
        for (let i = 0; i < REEL_COUNT; i++) {
            let rx = ox + i * REEL_WIDTH;
            for (let j = 0; j < reels[i].symbols.length; j++) {
                let sIdx = reels[i].symbols[j];
                let ry = oy + (j - 1) * REEL_HEIGHT + reels[i].offset;
                if (ry > oy - REEL_HEIGHT && ry < oy + totalH + REEL_HEIGHT) {
                    ctx.fillStyle = '#5f9ea0';
                    drawRoundedRect(ctx, rx + 4, ry + 4, REEL_WIDTH - 8, REEL_HEIGHT - 8, 12, true, true, 'rgba(255,255,255,0.2)', 2);
                    ctx.font = `${REEL_HEIGHT * 0.55}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(SYMBOLS[sIdx].char, rx + REEL_WIDTH/2, ry + REEL_HEIGHT/2);
                }
            }
            if (spinTimers[i] > 0) {
                reels[i].offset += 50;
                if (reels[i].offset >= REEL_HEIGHT) {
                    reels[i].offset = 0;
                    reels[i].symbols.unshift(Math.floor(Math.random() * SYMBOLS.length));
                    reels[i].symbols.pop();
                }
            }
        }
        ctx.restore();

        // UI
        if (isMobile) {
            const hx = ox + totalW + 30;
            drawBubble(ctx, hx, 40, canvas.width - hx - 20, 50, `CREDIT:${credits}`, '#004a7c', 16);
            drawBubble(ctx, hx, 100, canvas.width - hx - 20, 50, `BET:${bet}`, '#004a7c', 16);
            drawButton(ctx, hx, 170, canvas.width - hx - 20, 80, isSpinning ? '...' : 'GO', '#ffd700', '#000');
        } else {
            const uiY = canvas.height - 85;
            drawButton(ctx, 30, uiY, 150, 65, 'AUTO', '#7bc8f6');
            drawButton(ctx, 210, uiY, 220, 65, `BET:${bet}`, '#00bfff');
            drawButton(ctx, 460, uiY, 220, 65, `CREDIT:${credits}`, '#00bfff');
            drawButton(ctx, canvas.width - 160, uiY, 130, 65, isSpinning ? '...' : 'GO', '#ffd700', '#000');
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
        ctx.fillStyle = grad; drawRoundedRect(ctx, x, y, w, h, 15, true, true, '#fff', 2);
        ctx.fillStyle = textColor; ctx.font = 'bold 20px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w/2, y + h/2); ctx.restore();
    }

    function drawBubble(ctx, x, y, w, h, text, color, fs) {
        ctx.save(); ctx.fillStyle = color; drawRoundedRect(ctx, x, y, w, h, 10, true, false);
        ctx.fillStyle = '#fff'; ctx.font = `bold ${fs}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w/2, y + h/2); ctx.restore();
    }

    function update(t) {
        let dt = t - lastTime; lastTime = t;
        if (isSpinning) {
            let fin = true; for (let i = 0; i < REEL_COUNT; i++) { if (spinTimers[i] > 0) { spinTimers[i] -= dt; fin = false; } }
            if (fin) { isSpinning = false; checkWins(); }
        }
        draw(); requestAnimationFrame(update);
    }

    function checkWins() { /* Simple logic */ let win = Math.random() < 0.1 ? bet * 2 : 0; if (win > 0) { credits += win; shake = 10; } }

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
        if (mx > canvas.width - 200) spin();
    });

    initReels(); requestAnimationFrame(update);
})();
