(function() {
    /**
     * ASTEROIDS PRO: NEON STRIKE - VIRTUAL JOYSTICK EDITION
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let ship, asteroids, bullets, particles, score, gameOver, isPaused = false;
    let keys = {}; let lastTime = 0;

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
            setupMobileUI();
        }
    }
    window.addEventListener('resize', resize);

    // VIRTUAL JOYSTICK LOGIC
    let joystick = { active: false, startX: 0, startY: 0, currX: 0, currY: 0 };
    let mobileInput = { left: false, right: false, thrust: false };

    function setupMobileUI() {
        const isTouch = window.matchMedia("(pointer: coarse)").matches;
        const isMobileSize = window.innerWidth <= 1366;
        if (!isTouch && !isMobileSize) return;
        const container = document.getElementById('game-canvas-container');
        if (!container) return;
        
        let ui = document.getElementById('asteroid-mobile-ui');
        if (ui) ui.remove();

        ui = document.createElement('div');
        ui.id = 'asteroid-mobile-ui';
        ui.style = "position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:9999;";

        // JOYSTICK AREA (LEFT BOTTOM)
        const joystickBase = document.createElement('div');
        joystickBase.style = "position:absolute;bottom:40px;left:40px;width:120px;height:120px;background:rgba(0,242,255,0.1);border:2px solid rgba(0,242,255,0.3);border-radius:50%;pointer-events:auto;touch-action:none;";
        
        const joystickStick = document.createElement('div');
        joystickStick.style = "position:absolute;top:50%;left:50%;width:50px;height:50px;background:var(--neon-blue);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 20px var(--neon-blue);transition:0.1s;";
        joystickBase.appendChild(joystickStick);

        // FIRE BUTTON (RIGHT BOTTOM)
        const fireBtn = document.createElement('div');
        fireBtn.innerHTML = "🔥";
        fireBtn.style = "position:absolute;bottom:50px;right:50px;width:90px;height:90px;background:rgba(255,0,119,0.2);border:3px solid #ff0077;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:2rem;pointer-events:auto;box-shadow:0 0 20px #ff0077;touch-action:manipulation;";

        // PAUSE/RESUME BUTTON (TOP RIGHT)
        const pauseBtn = document.createElement('div');
        pauseBtn.id = 'mobile-pause-btn';
        pauseBtn.innerHTML = "⏸";
        pauseBtn.style = "position:absolute;top:20px;right:20px;width:50px;height:50px;background:rgba(255,255,255,0.1);border:1px solid #fff;border-radius:10px;color:white;display:flex;align-items:center;justify-content:center;font-size:1.2rem;pointer-events:auto;z-index:10000;";

        // JOYSTICK EVENTS
        const handleStart = (e) => {
            joystick.active = true;
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystickBase.getBoundingClientRect();
            joystick.startX = rect.left + rect.width/2;
            joystick.startY = rect.top + rect.height/2;
        };

        const handleMove = (e) => {
            if (!joystick.active) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - joystick.startX;
            const dy = touch.clientY - joystick.startY;
            const dist = Math.min(60, Math.hypot(dx, dy));
            const angle = Math.atan2(dy, dx);
            
            joystickStick.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`;

            // Ship Input
            mobileInput.left = (dx < -20);
            mobileInput.right = (dx > 20);
            mobileInput.thrust = (dy < -20);
        };

        const handleEnd = () => {
            joystick.active = false;
            joystickStick.style.transform = `translate(-50%, -50%)`;
            mobileInput = { left: false, right: false, thrust: false };
        };

        joystickBase.addEventListener('touchstart', handleStart, {passive:false});
        window.addEventListener('touchmove', handleMove, {passive:false});
        window.addEventListener('touchend', handleEnd);

        fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); fire(); }, {passive:false});
        pauseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isPaused = !isPaused; pauseBtn.innerHTML = isPaused ? "▶" : "⏸"; }, {passive:false});

        ui.appendChild(joystickBase);
        ui.appendChild(fireBtn);
        ui.appendChild(pauseBtn);
        container.appendChild(ui);
    }

    function fire() {
        if (gameOver || isPaused) return;
        bullets.push({ x: ship.x + Math.cos(ship.a) * ship.r, y: ship.y + Math.sin(ship.a) * ship.r, v: { x: Math.cos(ship.a) * 6, y: Math.sin(ship.a) * 6 }, life: 60 });
    }

    function update(t) {
        const dt = (t - lastTime) / 1000; lastTime = t;
        if (isPaused) { draw(); requestAnimationFrame(update); return; }

        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!gameOver) {
            // MOVEMENT PHYSICS (REDUCED DRIFT)
            if (keys[37] || mobileInput.left) ship.a -= 0.1;
            if (keys[39] || mobileInput.right) ship.a += 0.1;
            
            ship.thrusting = keys[38] || mobileInput.thrust;
            if (ship.thrusting) { 
                ship.thrust.x += Math.cos(ship.a) * 0.22; 
                ship.thrust.y += Math.sin(ship.a) * 0.22; 
            }
            
            // INCREASED FRICTION (PREVENTS SLIDING)
            ship.thrust.x *= 0.94; 
            ship.thrust.y *= 0.94;

            ship.x += ship.thrust.x; 
            ship.y += ship.thrust.y;
            if (ship.x < 0) ship.x = canvas.width; if (ship.x > canvas.width) ship.x = 0;
            if (ship.y < 0) ship.y = canvas.height; if (ship.y > canvas.height) ship.y = 0;
            
            ctx.strokeStyle = ship.thrusting ? '#ff0077' : '#00f2ff'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(ship.x + Math.cos(ship.a) * ship.r, ship.y + Math.sin(ship.a) * ship.r);
            ctx.lineTo(ship.x + Math.cos(ship.a + 2.5) * ship.r, ship.y + Math.sin(ship.a + 2.5) * ship.r);
            ctx.lineTo(ship.x + Math.cos(ship.a - 2.5) * ship.r, ship.y + Math.sin(ship.a - 2.5) * ship.r);
            ctx.closePath(); ctx.stroke();
        }

        bullets.forEach((b, i) => { b.x += b.v.x; b.y += b.v.y; b.life--; ctx.fillStyle='#ff0077'; ctx.fillRect(b.x-2,b.y-2,4,4); if(b.life<=0) bullets.splice(i,1); });
        asteroids.forEach((a, i) => {
            a.x += a.v.x; a.y += a.v.y;
            if (a.x < 0) a.x = canvas.width; if (a.x > canvas.width) a.x = 0;
            if (a.y < 0) a.y = canvas.height; if (a.y > canvas.height) a.y = 0;
            ctx.strokeStyle = '#bc13fe'; ctx.beginPath();
            for (let j=0; j<10; j++) { let ang=(j/10)*Math.PI*2; ctx.lineTo(a.x+Math.cos(ang)*a.r*a.offs[j], a.y+Math.sin(ang)*a.r*a.offs[j]); }
            ctx.closePath(); ctx.stroke();
            if (!gameOver) {
                if (Math.hypot(ship.x-a.x, ship.y-a.y) < ship.r+a.r) { gameOver=true; createExplosion(ship.x, ship.y, '#00f2ff'); setTimeout(reset, 2000); }
                bullets.forEach((b, j) => {
                    if (Math.hypot(b.x-a.x, b.y-a.y) < a.r) {
                        createExplosion(a.x, a.y, '#bc13fe');
                        if (a.r > 20) { createAsteroid(a.x, a.y, a.r/2); createAsteroid(a.x, a.y, a.r/2); }
                        asteroids.splice(i, 1); bullets.splice(j, 1); score += 100;
                    }
                });
            }
        });

        particles.forEach((p, i) => { p.x += p.v.x; p.y += p.v.y; p.life -= 0.02; ctx.fillStyle=p.color; ctx.globalAlpha=p.life; ctx.fillRect(p.x,p.y,2,2); ctx.globalAlpha=1; if(p.life<=0) particles.splice(i,1); });

        ctx.fillStyle = '#fff'; ctx.font = '20px Inter'; ctx.textAlign = 'left'; ctx.fillText(`${window.i18n.get('score')}: ${score}`, 20, 40);
        if (gameOver) { ctx.textAlign='center'; ctx.font='40px Inter'; ctx.fillText(window.i18n.get('game_over'), canvas.width/2, canvas.height/2); }
        if (isPaused) { ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='bold 50px Inter'; ctx.fillText(window.i18n.get('paused'), canvas.width/2, canvas.height/2); }

        requestAnimationFrame(update);
    }

    function draw() { /* Empty draw to satisfy pause loop */ }

    window.addEventListener('keydown', e => { 
        if([32,37,38,39,40].includes(e.keyCode)) e.preventDefault();
        if(e.keyCode === 80) { isPaused = !isPaused; const p = document.getElementById('mobile-pause-btn'); if(p) p.innerHTML = isPaused ? "▶" : "⏸"; }
        keys[e.keyCode] = true; if(e.keyCode == 32) fire(); 
    });
    window.addEventListener('keyup', e => keys[e.keyCode] = false);

    resize(); requestAnimationFrame(update);
})();
