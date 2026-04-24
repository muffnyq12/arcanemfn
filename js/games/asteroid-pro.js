(function() {
    /**
     * ASTEROIDS PRO: PHASED SPACE EDITION - PAUSE & RESTART UPDATE
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let ship = { x: 0, y: 0, r: 15, a: 0, thrust: { x: 0, y: 0 }, thrusting: false };
    let asteroids = [];
    let bullets = [];
    let particles = [];
    let score = 0;
    let stage = 1;
    let gameOver = false;
    let victory = false;
    let isPaused = false;
    let keys = {};
    let shake = 0;
    let bgOffset = { x: 0, y: 0 };
    
    const VICTORY_SCORE = 20000;
    let mobileInput = { left: false, right: false, thrust: false, fire: false, active: false, startX: 0, startY: 0, currX: 0, currY: 0 };

    const shipImg = new Image(); shipImg.src = 'assets/games/asteroid/ship.png';
    const astImg = new Image(); astImg.src = 'assets/games/asteroid/asteroid.png';
    const bgImg = new Image(); bgImg.src = 'assets/games/asteroid/bg.png';
    
    let shipReady = false, astReady = false, bgReady = false;
    let processedShip, processedAst;

    shipImg.onload = () => { processedShip = removeBlack(shipImg); shipReady = true; };
    astImg.onload = () => { processedAst = removeBlack(astImg); astReady = true; };
    bgImg.onload = () => { bgReady = true; };

    function removeBlack(img) {
        const off = document.createElement('canvas'); off.width = img.width; off.height = img.height;
        const octx = off.getContext('2d'); octx.drawImage(img, 0, 0);
        const data = octx.getImageData(0,0,off.width,off.height);
        for(let i=0; i<data.data.length; i+=4) if(data.data[i]<35 && data.data[i+1]<35 && data.data[i+2]<35) data.data[i+3]=0;
        octx.putImageData(data, 0, 0); return off;
    }

    function init() {
        ship.x = canvas.width / 2; ship.y = canvas.height / 2;
        ship.thrust = { x: 0, y: 0 }; ship.a = -Math.PI / 2;
        asteroids = []; bullets = []; particles = []; score = 0; stage = 1; gameOver = false; victory = false; isPaused = false;
        window.scoreSaved = false;
        createWave();
    }

    // EXPOSE TOGGLE PAUSE
    window.togglePause = function() {
        if (gameOver || victory) return false;
        isPaused = !isPaused;
        return isPaused;
    };

    function createWave() {
        const count = 4 + stage;
        const speedMult = 1 + (stage * 0.2);
        for (let i = 0; i < count; i++) {
            let x, y;
            do { x = Math.random() * canvas.width; y = Math.random() * canvas.height; } 
            while (dist(x, y, ship.x, ship.y) < 200);
            asteroids.push(createAsteroid(x, y, 45, speedMult));
        }
    }

    function createAsteroid(x, y, r, speedMult = 1) {
        return {
            x, y, r,
            v: { x: (Math.random() - 0.5) * 3 * speedMult, y: (Math.random() - 0.5) * 3 * speedMult },
            a: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.1,
            hp: r > 30 ? 2 : 1,
            type: stage >= 3 ? 'explosive' : (stage >= 5 ? 'crystal' : 'rock'),
            pulse: Math.random() * Math.PI
        };
    }

    function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }

    function update() {
        if (!window.gameStarted) { requestAnimationFrame(update); return; }
        
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (bgReady) {
            ctx.save(); ctx.globalAlpha = 0.45;
            bgOffset.x -= ship.thrust.x * 0.1; bgOffset.y -= ship.thrust.y * 0.1;
            const bx = bgOffset.x % canvas.width; const by = bgOffset.y % canvas.height;
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    ctx.drawImage(bgImg, bx + x * canvas.width, by + y * canvas.height, canvas.width, canvas.height);
                }
            }
            ctx.restore();
        }

        ctx.save();
        if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.9; }
        
        if (!gameOver && !victory && !isPaused) {
            if (keys[37] || mobileInput.left) ship.a -= 0.1;
            if (keys[39] || mobileInput.right) ship.a += 0.1;
            ship.thrusting = keys[38] || mobileInput.thrust;
            if (ship.thrusting) { 
                ship.thrust.x += Math.cos(ship.a) * 0.25; ship.thrust.y += Math.sin(ship.a) * 0.25; 
                if (Math.random() > 0.4) particles.push({ x: ship.x - Math.cos(ship.a)*ship.r, y: ship.y - Math.sin(ship.a)*ship.r, vx: -Math.cos(ship.a)*2, vy: -Math.sin(ship.a)*2, life: 0.5, color: '#ff0077', size: 2 });
            }
            ship.thrust.x *= 0.96; ship.thrust.y *= 0.96;
            ship.x += ship.thrust.x; ship.y += ship.thrust.y;
            if (ship.x < 0) ship.x = canvas.width; if (ship.x > canvas.width) ship.x = 0;
            if (ship.y < 0) ship.y = canvas.height; if (ship.y > canvas.height) ship.y = 0;
            
            bullets.forEach((b, i) => { 
                b.x += b.vx; b.y += b.vy; b.life--; 
                if(b.life<=0) bullets.splice(i,1); 
            });

            asteroids.forEach((a, i) => {
                a.x += a.v.x; a.y += a.v.y; a.a += a.rotV;
                if (a.x < -a.r) a.x = canvas.width + a.r; if (a.x > canvas.width + a.r) a.x = -a.r;
                if (a.y < -a.r) a.y = canvas.height + a.r; if (a.y > canvas.height + a.r) a.y = -a.r;
                if (dist(ship.x, ship.y, a.x, a.y) < ship.r + a.r) { die(); }
                bullets.forEach((b, bi) => {
                    if (dist(b.x, b.y, a.x, a.y) < a.r) {
                        bullets.splice(bi, 1); a.hp--;
                        if (a.hp <= 0) {
                            score += a.r < 20 ? 100 : (a.r < 30 ? 50 : 25); shake = 10;
                            if (stage >= 3 && a.type === 'explosive') particles.push({ x: a.x, y: a.y, r: 5, maxR: 50, type: 'shockwave', life: 1, color: '#ffaa00' });
                            if (score >= VICTORY_SCORE) { victory = true; endGame(); }
                            if (score >= stage * 2000) { stage++; createWave(); }
                            if (a.r > 15) { for (let k = 0; k < 2; k++) asteroids.push(createAsteroid(a.x, a.y, a.r / 2, 1 + stage*0.1)); }
                            asteroids.splice(i, 1);
                            for(let k=0; k<15; k++) particles.push({ x: a.x, y: a.y, vx:(Math.random()-0.5)*8, vy:(Math.random()-0.5)*8, life:1, color: (a.type === 'crystal' ? '#bc13fe' : '#ff0077'), size: Math.random()*3+1 });
                        }
                    }
                });
            });

            particles.forEach((p, i) => {
                if (p.type === 'shockwave') {
                    p.r += 5; p.life -= 0.02;
                    if (dist(ship.x, ship.y, p.x, p.y) < p.r + 5 && dist(ship.x, ship.y, p.x, p.y) > p.r - 20) { die(); }
                } else {
                    p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                }
                if(p.life <= 0) particles.splice(i, 1);
            });
        }

        // Draw Ship
        if (shipReady && !gameOver && !victory) {
            ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.a + Math.PI);
            ctx.shadowBlur = 25; ctx.shadowColor = '#00f2ff';
            ctx.drawImage(processedShip, -ship.r * 1.5, -ship.r * 1.5, ship.r * 3, ship.r * 3);
            ctx.restore();
        }

        // Draw Bullets
        bullets.forEach(b => {
            ctx.save(); ctx.fillStyle='#ff0077'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff0077';
            ctx.fillRect(b.x-3, b.y-3, 6, 6); ctx.restore();
        });

        // Draw Asteroids
        asteroids.forEach(a => {
            if (astReady) {
                ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.a);
                if (a.type === 'explosive') { ctx.shadowBlur = 15; ctx.shadowColor = '#ffaa00'; ctx.filter = 'sepia(1) saturate(5) hue-rotate(-50deg)'; }
                if (a.type === 'crystal') { ctx.shadowBlur = 20; ctx.shadowColor = '#bc13fe'; ctx.filter = 'hue-rotate(90deg)'; }
                if (stage >= 4) { a.pulse += 0.05; ctx.globalAlpha = 0.4 + Math.sin(a.pulse) * 0.4; }
                ctx.drawImage(processedAst, -a.r, -a.r, a.r * 2, a.r * 2);
                ctx.restore();
            }
        });

        // Draw Shockwaves
        particles.forEach(p => {
            if (p.type === 'shockwave') {
                ctx.save(); ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = p.life;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke(); ctx.restore();
            } else {
                ctx.save(); ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
                ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore();
            }
        });

        // UI
        ctx.fillStyle = '#fff'; ctx.font = '900 24px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 20, 40);
        window.currentGameScore = score;
        ctx.fillStyle = '#00f2ff'; ctx.font = '900 18px Inter';
        ctx.fillText(`STAGE: ${stage}`, 20, 70);

        // HUD - Previous Score
        const lastScore = localStorage.getItem('retroArcade_lastScore_asteroid-pro') || 0;
        const panelW = 140, panelH = 55, pX = canvas.width - panelW - 20, pY = canvas.height - panelH - 20;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 1; ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
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
            ctx.fillText('SHIP DESTROYED', canvas.width/2, canvas.height/2 - 20);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 18px Inter';
            ctx.fillText('YENİDEN BAŞLAMAK İÇİN TIKLAYIN', canvas.width/2, canvas.height/2 + 60);
        }
        if (victory) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#39ff14'; ctx.font = '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText('GALAXY SAVED!', canvas.width/2, canvas.height/2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 18px Inter';
            ctx.fillText('YENİDEN BAŞLAMAK İÇİN TIKLAYIN', canvas.width/2, canvas.height/2 + 60);
        }
        drawMobileControls();
        ctx.restore();
        requestAnimationFrame(update);
    }

    function drawMobileControls() {
        if (window.innerWidth >= 1025) return;

        // Joystick (Left)
        const jX = 100, jY = canvas.height - 100, jR = 60;
        ctx.save(); ctx.globalAlpha = 0.5; // Increased visibility
        ctx.beginPath(); ctx.arc(jX, jY, jR, 0, Math.PI*2); ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 2; ctx.stroke();
        if (mobileInput.active) {
            ctx.beginPath(); ctx.arc(mobileInput.currX, mobileInput.currY, 20, 0, Math.PI*2); ctx.fillStyle = '#00f2ff'; ctx.fill();
        }
        
        // Fire Button (Right)
        const fX = canvas.width - 100, fY = canvas.height - 100, fR = 50;
        ctx.beginPath(); ctx.arc(fX, fY, fR, 0, Math.PI*2); ctx.strokeStyle = '#ff0077'; ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = mobileInput.fire ? '#ff0077' : 'transparent'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '900 12px Inter'; ctx.textAlign = 'center'; ctx.fillText('FIRE', fX, fY + 5);
        ctx.restore();
    }

    function die() { 
        if (!gameOver && !victory) { 
            gameOver = true; shake = 30; 
            if (window.saveUserScore) window.saveUserScore(score);
            endGame(); 
        } 
    }

    function endGame() { setTimeout(() => { const o = document.getElementById('play-overlay'); if (o) o.style.display = 'flex'; }, 4000); }

    function shoot() {
        if (gameOver || victory || isPaused || bullets.length > 8) return;
        bullets.push({ x: ship.x + Math.cos(ship.a)*ship.r, y: ship.y + Math.sin(ship.a)*ship.r, vx: Math.cos(ship.a)*10, vy: Math.sin(ship.a)*10, life: 60 });
        shake = 2;
    }

    window.addEventListener('keydown', e => { 
        if ([32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
        keys[e.keyCode] = true; 
        if (e.keyCode === 32) shoot(); 
    });
    window.addEventListener('keyup', e => { keys[e.keyCode] = false; });

    canvas.addEventListener('mousedown', () => { if (gameOver || victory) init(); });

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        if (gameOver || victory) { init(); return; }
        const rect = canvas.getBoundingClientRect();
        for (let t of e.touches) {
            const tx = t.clientX - rect.left, ty = t.clientY - rect.top;
            if (tx < canvas.width / 2) {
                mobileInput.active = true; mobileInput.startX = tx; mobileInput.startY = ty;
                mobileInput.currX = tx; mobileInput.currY = ty;
            } else {
                const fX = canvas.width - 80, fY = canvas.height - 80, fR = 60;
                if (dist(tx, ty, fX, fY) < fR) { mobileInput.fire = true; shoot(); }
            }
        }
    }, {passive: false});

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        for (let t of e.touches) {
            const tx = t.clientX - rect.left, ty = t.clientY - rect.top;
            if (mobileInput.active && tx < canvas.width / 2) {
                mobileInput.currX = tx; mobileInput.currY = ty;
                const dx = tx - mobileInput.startX, dy = ty - mobileInput.startY;
                mobileInput.left = dx < -20;
                mobileInput.right = dx > 20;
                mobileInput.thrust = dy < -20;
            }
        }
    }, {passive: false});

    canvas.addEventListener('touchend', e => {
        if (e.touches.length === 0) {
            mobileInput.active = false; mobileInput.left = false; mobileInput.right = false; mobileInput.thrust = false; mobileInput.fire = false;
        } else {
            let joystickRemaining = false;
            for (let t of e.touches) {
                const rect = canvas.getBoundingClientRect();
                if (t.clientX - rect.left < canvas.width/2) joystickRemaining = true;
            }
            if (!joystickRemaining) { mobileInput.active = false; mobileInput.left = false; mobileInput.right = false; mobileInput.thrust = false; }
            mobileInput.fire = false;
        }
    });

    init();
    requestAnimationFrame(update);
})();
