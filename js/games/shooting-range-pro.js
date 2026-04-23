(function() {
    /**
     * CYBER RANGE: TACTICAL SHOOTER - STABLE VERSION
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let targets = [];
    let drops = [];
    let particles = [];
    let score = 0;
    let combo = 0;
    let comboTimer = 0;
    let gameOver = false;
    let lastTime = 0;
    let crosshair = { x: 0, y: 0, bloom: 0, recoilY: 0 };
    let phase = 1;
    let muzzleFlash = 0;
    let isChallengeMode = false;
    let timeLeft = 100;
    let gameActive = false; 
    let health = 3;
    let screenShake = 0;
    let isPaused = false;

    const WEAPONS = {
        pistol: { name: 'GHOST-9', dmg: 10, fireRate: 300, mag: 12, current: 12, reload: 1000, recoil: 8, color: '#00f2ff' },
        smg: { name: 'VOLT-SMG', dmg: 5, fireRate: 80, mag: 30, current: 30, reload: 1500, recoil: 4, color: '#bc13fe' },
        sniper: { name: 'ZENITH-X', dmg: 50, fireRate: 1000, mag: 5, current: 5, reload: 2500, recoil: 30, color: '#ffaa00' },
        laser: { name: 'ULTRA-BEAM', dmg: 100, fireRate: 50, mag: 100, current: 0, reload: 5000, recoil: 1, color: '#39ff14', isSpecial: true }
    };
    let currentWep = 'pistol';
    let isReloading = false;
    let lastFire = 0;

    function init(mode = 'standard') {
        targets = []; drops = []; particles = [];
        score = 0; combo = 0; phase = 1; gameOver = false;
        isChallengeMode = (mode === 'challenge');
        gameActive = true; 
        window.gameStarted = true;
        window.scoreSaved = false;
        timeLeft = 100;
        health = 3;
        screenShake = 0;
        isPaused = false;
        
        const overlay = document.getElementById('play-overlay');
        if (overlay) overlay.style.display = 'none';
        
        spawnLoop();
    }

    // EXPOSE TOGGLE PAUSE
    window.togglePause = function() {
        if (gameOver || !gameActive) return false;
        isPaused = !isPaused;
        return isPaused;
    };

    function spawnLoop() {
        if (gameOver || !gameActive || isPaused) {
            setTimeout(spawnLoop, 1000);
            return;
        }
        const count = phase === 1 ? 1 : (phase === 2 ? 2 : 3);
        for (let i = 0; i < count; i++) {
            const type = Math.random() > 0.9 ? 'gold' : 'normal';
            const speedMult = phase === 2 ? 1.6 : (phase >= 3 ? 2.8 : 1);
            targets.push({
                x: Math.random() * (canvas.width - 150) + 75,
                y: Math.random() * (canvas.height - 250) + 100,
                r: type === 'gold' ? 25 : 40,
                life: 3500 / speedMult,
                maxLife: 3500 / speedMult,
                type: type,
                vx: (Math.random() - 0.5) * 5 * speedMult,
                vy: (Math.random() - 0.5) * 3 * speedMult,
                dashTimer: Math.random() * 2000 + 1000,
                angle: Math.random() * Math.PI
            });
        }
        setTimeout(spawnLoop, Math.max(500, 2000 - score * 0.03));
    }

    function draw() {
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)'; ctx.lineWidth = 1;
        for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
        for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

        if (gameActive) {
            drops.forEach((d) => { drawDrop(d); });
            targets.forEach((t) => { drawTarget(t); });
            particles.forEach((p) => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); });
            ctx.globalAlpha = 1;
            drawCrosshair();
            drawUI();
        } else {
            ctx.fillStyle = '#00f2ff'; ctx.font = '900 40px Inter'; ctx.textAlign = 'center';
            ctx.fillText('CYBER RANGE', canvas.width/2, canvas.height/2 - 100);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Inter';
            ctx.fillText('LÜTFEN MOD SEÇİNİZ', canvas.width/2, canvas.height/2 - 50);
            injectButtons();
        }

        if (isPaused) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#fff'; ctx.font = '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText('DURAKLATILDI', canvas.width/2, canvas.height/2);
            ctx.font = 'bold 20px Inter';
            ctx.fillText('DEVAM ETMEK İÇİN DURDUR BUTONUNA BASIN', canvas.width/2, canvas.height/2 + 50);
        }

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = isChallengeMode ? '#39ff14' : '#ff0077';
            ctx.font = '900 60px Inter'; ctx.textAlign = 'center';
            ctx.fillText(isChallengeMode ? 'MÜCADELE BİTTİ' : 'SİMÜLASYON SONU', canvas.width/2, canvas.height/2 - 20);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Inter';
            ctx.fillText(`SKOR: ${score}`, canvas.width/2, canvas.height/2 + 40);
            
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 18px Inter';
            ctx.fillText('YENİDEN BAŞLAMAK İÇİN TIKLAYIN', canvas.width/2, canvas.height/2 + 100);
            injectButtons();
        }

        // --- DRAW PREVIOUS SCORE (ALWAYS VISIBLE HUD) ---
        const activeGameId = 'shooting-range-pro';
        const lastScore = localStorage.getItem('retroArcade_lastScore_' + activeGameId) || 0;
        
        const panelW = 140, panelH = 55, pX = canvas.width - panelW - 20, pY = canvas.height - panelH - 20;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 1;
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
        ctx.beginPath(); 
        if (ctx.roundRect) ctx.roundRect(pX, pY, panelW, panelH, 8); 
        else ctx.rect(pX, pY, panelW, panelH); 
        ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center'; ctx.fillStyle = '#00f2ff'; ctx.font = '900 10px Inter';
        ctx.fillText('ÖNCEKİ SKOR', pX + panelW/2, pY + 20);
        ctx.fillStyle = '#fff'; ctx.font = '900 22px Inter';
        ctx.fillText(parseInt(lastScore).toLocaleString(), pX + panelW/2, pY + 45);
        ctx.restore();
    }

    function drawTarget(t) {
        ctx.save(); ctx.translate(t.x, t.y); t.angle += 0.05; ctx.rotate(t.angle);
        const color = t.type === 'gold' ? '#ffd700' : '#00f2ff';
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = color;
        ctx.beginPath(); for(let i=0; i<6; i++) { let a = (i * Math.PI * 2) / 6; let x = Math.cos(a) * t.r, y = Math.sin(a) * t.r; if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = 0.5 + Math.sin(Date.now()*0.01)*0.3; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, t.r * 0.4, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

    function drawDrop(d) {
        ctx.save(); ctx.translate(d.x, d.y);
        const color = d.type === 'ammo' ? '#39ff14' : '#ff0077';
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowBlur = 15; ctx.shadowColor = color;
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.beginPath(); ctx.moveTo(-15,-15); ctx.lineTo(-5,-25); ctx.lineTo(25,-25); ctx.lineTo(15,-15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(15,15); ctx.lineTo(25,5); ctx.lineTo(25,-25); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '900 8px Inter'; ctx.textAlign = 'center'; ctx.fillText(d.type.toUpperCase(), 0, 5);
        ctx.restore();
    }

    function drawCrosshair() {
        ctx.save(); const sX = (Math.random()-0.5)*muzzleFlash*5, sY = (Math.random()-0.5)*muzzleFlash*5 + crosshair.recoilY; ctx.translate(crosshair.x + sX, crosshair.y + sY);
        if (muzzleFlash > 0) { ctx.fillStyle = '#fff'; ctx.shadowBlur = 30; ctx.shadowColor = '#ffff00'; ctx.beginPath(); ctx.arc(0, 0, muzzleFlash * 20, 0, Math.PI*2); ctx.fill(); muzzleFlash *= 0.7; if(muzzleFlash < 0.1) muzzleFlash = 0; }
        ctx.strokeStyle = isReloading ? '#ff0077' : WEAPONS[currentWep].color; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = ctx.strokeStyle;
        const b = crosshair.bloom; ctx.beginPath(); ctx.moveTo(-20-b, 0); ctx.lineTo(-8-b, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(20+b, 0); ctx.lineTo(8+b, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -20-b); ctx.lineTo(0, -8-b); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 20+b); ctx.lineTo(0, 5+b); ctx.stroke();
        ctx.restore(); crosshair.recoilY *= 0.85;
    }

    function drawUI() {
        const margin = 30;
        ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '900 24px Inter'; ctx.fillText(`SKOR: ${score}`, margin, margin + 20);
        window.currentGameScore = score;
        ctx.fillStyle = '#bc13fe'; ctx.font = 'bold 16px Inter'; ctx.fillText(`PHASE: ${phase}`, margin, margin + 50);
        if (isChallengeMode) {
            ctx.textAlign = 'center'; ctx.fillStyle = timeLeft < 15 ? '#ff0077' : '#39ff14'; ctx.font = '900 32px Inter'; ctx.fillText(Math.ceil(timeLeft), canvas.width/2, 50);
        }
        ctx.textAlign = 'left'; const wep = WEAPONS[currentWep];
        ctx.fillStyle = 'rgba(0, 242, 255, 0.05)'; ctx.fillRect(margin, canvas.height - 100, 200, 70);
        ctx.strokeStyle = wep.color; ctx.lineWidth = 1; ctx.strokeRect(margin, canvas.height - 100, 200, 70);
        ctx.fillStyle = '#fff'; ctx.font = '900 12px Inter'; ctx.fillText(wep.name, margin + 15, canvas.height - 75);
        ctx.font = 'bold 30px Inter'; ctx.fillText(`${wep.current} / ${wep.mag}`, margin + 15, canvas.height - 45);
        
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = i < health ? '#00f2ff' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(margin + i * 25, 100, 15, 15);
            if (i < health) {
                ctx.fillStyle = '#00f2ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
                ctx.fillRect(margin + i * 25 + 3, 103, 9, 9);
                ctx.shadowBlur = 0;
            }
        }
    }

    function update(t) {
        let dt = t - lastTime; lastTime = t;
        if (gameActive && !gameOver && !isPaused) {
            crosshair.bloom *= 0.9;
            if (isChallengeMode) { 
                timeLeft -= dt / 1000; 
                if (timeLeft <= 0) { 
                    timeLeft = 0; 
                    gameOver = true; 
                    if (window.saveUserScore) window.saveUserScore(score);
                } 
            }
            if (score >= 5000) phase = 3; else if (score >= 2000) phase = 2;
            targets = targets.filter(t => {
                t.life -= dt; t.x += t.vx; t.y += t.vy;
                if (phase >= 3) { t.dashTimer -= dt; if (t.dashTimer <= 0) { t.vx *= 3; t.vy *= 3; t.dashTimer = 2000; setTimeout(() => { t.vx /= 3; t.vy /= 3; }, 300); } }
                if (t.x < t.r || t.x > canvas.width - t.r) t.vx *= -1; if (t.y < t.r || t.y > canvas.height - t.r) t.vy *= -1;
                if (t.life <= 0) {
                    health--; screenShake = 15;
                    if (health <= 0) { health = 0; gameOver = true; if (window.saveUserScore) window.saveUserScore(score); }
                    return false;
                }
                return true;
            });
            if (comboTimer > 0) { comboTimer -= dt; if(comboTimer <= 0) combo = 0; }
            drops.forEach((d, i) => { d.y += 1.5; if (d.y > canvas.height) drops.splice(i, 1); });
            particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; if(p.life <= 0) particles.splice(i, 1); });
        }

        if (screenShake > 0) {
            ctx.save();
            ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
            screenShake *= 0.9; if (screenShake < 0.1) screenShake = 0;
            draw(); ctx.restore();
        } else {
            draw();
        }
        requestAnimationFrame(update);
    }

    function fire() {
        const now = Date.now(); const wep = WEAPONS[currentWep];
        if (gameOver || !gameActive || isPaused || isReloading || now - lastFire < wep.fireRate) return;
        if (wep.current <= 0) return;
        wep.current--; lastFire = now; crosshair.bloom += wep.recoil; crosshair.recoilY -= wep.recoil; muzzleFlash = 1.0;
        let hitSomething = false;
        for (let i = drops.length - 1; i >= 0; i--) { let d = drops[i]; if (Math.sqrt((crosshair.x - d.x)**2 + (crosshair.y - d.y)**2) < 35) { if (d.type === 'ammo') WEAPONS[currentWep].current = WEAPONS[currentWep].mag; else { WEAPONS.laser.current = 100; currentWep = 'laser'; } drops.splice(i, 1); hitSomething = true; createImpact(d.x, d.y, '#fff', 10); break; } }
        let closestTarget = null, minDist = Infinity, targetIndex = -1;
        targets.forEach((t, i) => { let d = Math.sqrt((crosshair.x - t.x)**2 + (crosshair.y - t.y)**2); if (d < t.r && d < minDist) { minDist = d; closestTarget = t; targetIndex = i; } });
        if (closestTarget) { hitSomething = true; combo++; comboTimer = 2000; score += (closestTarget.type === 'gold' ? 500 : 100) * combo; if (Math.random() > 0.8) drops.push({ x: closestTarget.x, y: closestTarget.y, type: Math.random() > 0.8 ? 'weapon' : 'ammo' }); targets.splice(targetIndex, 1); createImpact(closestTarget.x, closestTarget.y, closestTarget.type === 'gold' ? '#ffd700' : '#00f2ff', 20); }
        if (!hitSomething) combo = 0;
    }

    function injectButtons() {
        const overlay = document.getElementById('play-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        const content = overlay.querySelector('.overlay-content') || overlay;
        const existingStd = document.getElementById('std-mode-btn');
        if (!existingStd) {
            content.innerHTML = `
                <h2 style="color:white; margin-bottom:20px;">MOD SEÇİN</h2>
                <button id="std-mode-btn" class="play-button" style="background:#00f2ff; color:black; padding:15px 30px; border:none; border-radius:10px; font-weight:900; cursor:pointer; margin-bottom:10px; width:200px;">STANDART MOD</button>
                <button id="chl-mode-btn" class="play-button" style="background:#39ff14; color:black; padding:15px 30px; border:none; border-radius:10px; font-weight:900; cursor:pointer; width:200px;">CHALLENGE (100s)</button>
            `;
            document.getElementById('std-mode-btn').onclick = () => init('standard');
            document.getElementById('chl-mode-btn').onclick = () => init('challenge');
            const defBtn = document.getElementById('play-btn'); if(defBtn) defBtn.style.display = 'none';
        }
    }

    function createImpact(x, y, color, count) { for(let i=0; i<count; i++) particles.push({ x, y, vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20, life: 1, size: Math.random()*4+2, color: color }); }
    canvas.addEventListener('mousemove', e => { const rect = canvas.getBoundingClientRect(); crosshair.x = e.clientX - rect.left; crosshair.y = e.clientY - rect.top; });
    canvas.addEventListener('mousedown', e => { 
        if (gameOver) { init(isChallengeMode ? 'challenge' : 'standard'); return; }
        if (!gameActive || isPaused) return; 
        fire(); 
    });
    window.addEventListener('keydown', e => { if (e.key === 'r' || e.key === 'R') reload(); });

    requestAnimationFrame(update);
})();
