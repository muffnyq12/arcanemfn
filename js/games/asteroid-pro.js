(function() {
    /**
     * ASTEROIDS PRO: NEON STRIKE - ABSOLUTE MOBILE UI
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let ship, asteroids, bullets, particles, score, gameOver, keys = {};
    let lastTime = 0;

    function reset() {
        ship = { x: canvas.width / 2, y: canvas.height / 2, r: 15, a: 0, rot: 0, thrust: { x: 0, y: 0 }, thrusting: false };
        asteroids = []; bullets = []; particles = []; score = 0; gameOver = false;
        for (let i = 0; i < 5; i++) createAsteroid(Math.random() * canvas.width, Math.random() * canvas.height, 40);
    }

    function createAsteroid(x, y, r) {
        asteroids.push({ x, y, r, v: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 }, offs: Array.from({ length: 10 }, () => Math.random() * 0.4 + 0.8) });
    }

    function createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) particles.push({ x, y, v: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 }, life: 1, color });
    }

    function resize() {
        const container = document.getElementById('game-canvas-container');
        if (container) {
            canvas.width = container.offsetWidth; canvas.height = container.offsetHeight;
            if (!ship) reset();
            setupMobileControls(); // RE-RENDER ON RESIZE/ROTATE
        }
    }
    window.addEventListener('resize', resize);
    
    // MOBILE CONTROLS (BYPASS LANDSCAPE WIDTH ISSUE)
    let mobileKeys = { left: false, right: false, thrust: false };
    function setupMobileControls() {
        const isMobile = window.innerWidth <= 1024 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) return;

        const container = document.getElementById('game-canvas-container');
        if (!container) return;
        
        let ui = document.getElementById('mobile-asteroid-ui');
        if (ui) ui.remove();

        ui = document.createElement('div');
        ui.id = 'mobile-asteroid-ui';
        ui.style = "position:absolute;bottom:20px;left:0;right:0;height:120px;display:flex;justify-content:space-between;padding:0 30px;pointer-events:none;z-index:9999;";
        
        const btnStyle = "width:75px;height:75px;background:rgba(0,242,255,0.2);border:3px solid #00f2ff;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:1.8rem;pointer-events:auto;user-select:none;touch-action:manipulation;box-shadow:0 0 20px rgba(0,242,255,0.4);";
        const fireStyle = btnStyle + "border-color:#ff0077;box-shadow:0 0 20px rgba(255,0,119,0.4);width:100px;height:100px;";

        const leftGroup = document.createElement('div'); leftGroup.style = "display:flex;gap:30px;align-items:center;";
        const rightGroup = document.createElement('div'); rightGroup.style = "display:flex;gap:30px;align-items:center;";

        const btnL = document.createElement('div'); btnL.innerHTML = "←"; btnL.style = btnStyle;
        const btnR = document.createElement('div'); btnR.innerHTML = "→"; btnR.style = btnStyle;
        const btnT = document.createElement('div'); btnT.innerHTML = "🚀"; btnT.style = btnStyle;
        const btnF = document.createElement('div'); btnF.innerHTML = "🔥"; btnF.style = fireStyle;

        const bind = (el, key, val) => {
            const start = (e) => { e.preventDefault(); e.stopPropagation(); mobileKeys[key] = val; if(key==='fire') fire(); };
            const end = (e) => { e.preventDefault(); e.stopPropagation(); mobileKeys[key] = false; };
            el.addEventListener('touchstart', start, {passive: false});
            el.addEventListener('touchend', end, {passive: false});
            el.addEventListener('mousedown', start);
            el.addEventListener('mouseup', end);
        };

        bind(btnL, 'left', true); bind(btnR, 'right', true); bind(btnT, 'thrust', true);
        btnF.addEventListener('touchstart', (e) => { e.preventDefault(); fire(); }, {passive: false});
        btnF.addEventListener('mousedown', (e) => { e.preventDefault(); fire(); });

        leftGroup.appendChild(btnL); leftGroup.appendChild(btnR);
        rightGroup.appendChild(btnT); rightGroup.appendChild(btnF);
        ui.appendChild(leftGroup); ui.appendChild(rightGroup);
        container.appendChild(ui);
    }

    function fire() {
        if (gameOver) return;
        bullets.push({ x: ship.x + Math.cos(ship.a) * ship.r, y: ship.y + Math.sin(ship.a) * ship.r, v: { x: Math.cos(ship.a) * 6, y: Math.sin(ship.a) * 6 }, life: 60 });
    }

    function update(t) {
        const dt = (t - lastTime) / 1000; lastTime = t;
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!gameOver) {
            if (keys[37] || mobileKeys.left) ship.a -= 0.1;
            if (keys[39] || mobileKeys.right) ship.a += 0.1;
            ship.thrusting = keys[38] || mobileKeys.thrust;
            if (ship.thrusting) { ship.thrust.x += Math.cos(ship.a) * 0.18; ship.thrust.y += Math.sin(ship.a) * 0.18; }
            else { ship.thrust.x *= 0.98; ship.thrust.y *= 0.98; }
            ship.x += ship.thrust.x; ship.y += ship.thrust.y;
            if (ship.x < 0) ship.x = canvas.width; if (ship.x > canvas.width) ship.x = 0;
            if (ship.y < 0) ship.y = canvas.height; if (ship.y > canvas.height) ship.y = 0;
            ctx.strokeStyle = ship.thrusting ? '#ff0077' : '#00f2ff'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(ship.x + Math.cos(ship.a) * ship.r, ship.y + Math.sin(ship.a) * ship.r);
            ctx.lineTo(ship.x + Math.cos(ship.a + 2.5) * ship.r, ship.y + Math.sin(ship.a + 2.5) * ship.r);
            ctx.lineTo(ship.x + Math.cos(ship.a - 2.5) * ship.r, ship.y + Math.sin(ship.a - 2.5) * ship.r);
            ctx.closePath(); ctx.stroke();
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i]; b.x += b.v.x; b.y += b.v.y; b.life--;
            ctx.fillStyle = '#ff0077'; ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
            if (b.life <= 0) bullets.splice(i, 1);
        }
        for (let i = asteroids.length - 1; i >= 0; i--) {
            let a = asteroids[i]; a.x += a.v.x; a.y += a.v.y;
            if (a.x < 0) a.x = canvas.width; if (a.x > canvas.width) a.x = 0;
            if (a.y < 0) a.y = canvas.height; if (a.y > canvas.height) a.y = 0;
            ctx.strokeStyle = '#bc13fe'; ctx.beginPath();
            for (let j = 0; j < 10; j++) {
                let ang = (j / 10) * Math.PI * 2;
                ctx.lineTo(a.x + Math.cos(ang) * a.r * a.offs[j], a.y + Math.sin(ang) * a.r * a.offs[j]);
            }
            ctx.closePath(); ctx.stroke();
            if (!gameOver) {
                let d = Math.hypot(ship.x - a.x, ship.y - a.y);
                if (d < ship.r + a.r) { gameOver = true; createExplosion(ship.x, ship.y, '#00f2ff'); setTimeout(reset, 2000); }
                for (let j = bullets.length - 1; j >= 0; j--) {
                    let b = bullets[j];
                    if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
                        createExplosion(a.x, a.y, '#bc13fe');
                        if (a.r > 20) { createAsteroid(a.x, a.y, a.r / 2); createAsteroid(a.x, a.y, a.r / 2); }
                        asteroids.splice(i, 1); bullets.splice(j, 1); score += 100; break;
                    }
                }
            }
        }
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i]; p.x += p.v.x; p.y += p.v.y; p.life -= 0.02;
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, 2, 2); ctx.globalAlpha = 1;
            if (p.life <= 0) particles.splice(i, 1);
        }
        ctx.fillStyle = '#fff'; ctx.font = '20px Inter'; ctx.textAlign = 'left'; ctx.fillText(`SKOR: ${score}`, 20, 40);
        if (gameOver) { ctx.textAlign = 'center'; ctx.font = '40px Inter'; ctx.fillText('GAMEOVER', canvas.width / 2, canvas.height / 2); }
        requestAnimationFrame(update);
    }

    window.addEventListener('keydown', e => { if([32,37,38,39,40].includes(e.keyCode)) e.preventDefault(); keys[e.keyCode] = true; if(e.keyCode == 32) fire(); });
    window.addEventListener('keyup', e => keys[e.keyCode] = false);

    resize(); requestAnimationFrame(update);
})();
