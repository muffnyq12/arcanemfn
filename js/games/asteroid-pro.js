(function() {
    /**
     * ASTEROIDS PRO: INFINITE SPACE EDITION
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let ship = { x: 0, y: 0, r: 15, a: 0, thrust: { x: 0, y: 0 }, thrusting: false };
    let asteroids = [];
    let bullets = [];
    let particles = [];
    let score = 0;
    let level = 1;
    let gameOver = false;
    let victory = false;
    let keys = {};
    let shake = 0;
    let bgOffset = { x: 0, y: 0 };
    
    const VICTORY_SCORE = 20000;

    // Mobile Input
    let mobileInput = { left: false, right: false, thrust: false, fire: false };

    // Assets
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
        asteroids = []; bullets = []; particles = []; score = 0; level = 1; gameOver = false; victory = false;
        createWave();
    }

    function createWave() {
        const count = 4 + level;
        const speedMult = 1 + (level * 0.2);
        for (let i = 0; i < count; i++) {
            let x, y;
            do { x = Math.random() * canvas.width; y = Math.random() * canvas.height; } 
            while (dist(x, y, ship.x, ship.y) < 150);
            asteroids.push(createAsteroid(x, y, 40, speedMult));
        }
    }

    function createAsteroid(x, y, r, speedMult = 1) {
        return {
            x, y, r,
            v: { x: (Math.random() - 0.5) * 3 * speedMult, y: (Math.random() - 0.5) * 3 * speedMult },
            a: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.1,
            hp: r > 30 ? 2 : 1,
            type: level > 5 ? 'crystal' : 'rock'
        };
    }

    function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }

    function update() {
        if (!window.gameStarted) { requestAnimationFrame(update); return; }
        
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // DRAW NEBULA BACKGROUND (Dimmed)
        if (bgReady) {
            ctx.save(); ctx.globalAlpha = 0.45; // Improved visibility
            bgOffset.x -= ship.thrust.x * 0.1; bgOffset.y -= ship.thrust.y * 0.1;
            const bx = bgOffset.x % canvas.width; const by = bgOffset.y % canvas.height;
            ctx.drawImage(bgImg, bx, by, canvas.width, canvas.height);
            ctx.drawImage(bgImg, bx + canvas.width, by, canvas.width, canvas.height);
            ctx.drawImage(bgImg, bx - canvas.width, by, canvas.width, canvas.height);
            ctx.drawImage(bgImg, bx, by + canvas.height, canvas.width, canvas.height);
            ctx.drawImage(bgImg, bx, by - canvas.height, canvas.width, canvas.height);
            ctx.restore();
        }

        ctx.save();
        if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.9; }
        
        if (!gameOver && !victory) {
            if (keys[37] || mobileInput.left) ship.a -= 0.1;
            if (keys[39] || mobileInput.right) ship.a += 0.1;
            ship.thrusting = keys[38] || mobileInput.thrust;
            if (ship.thrusting) { 
                ship.thrust.x += Math.cos(ship.a) * 0.25; ship.thrust.y += Math.sin(ship.a) * 0.25; 
                if (Math.random() > 0.4) particles.push({ x: ship.x - Math.cos(ship.a)*ship.r, y: ship.y - Math.sin(ship.a)*ship.r, vx: -Math.cos(ship.a)*2, vy: -Math.sin(ship.a)*2, life: 0.5, color: '#ff0077' });
            }
            ship.thrust.x *= 0.96; ship.thrust.y *= 0.96;
            ship.x += ship.thrust.x; ship.y += ship.thrust.y;
            if (ship.x < 0) ship.x = canvas.width; if (ship.x > canvas.width) ship.x = 0;
            if (ship.y < 0) ship.y = canvas.height; if (ship.y > canvas.height) ship.y = 0;
            
            if (shipReady) {
                ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.a + Math.PI);
                ctx.shadowBlur = 25; ctx.shadowColor = '#00f2ff';
                ctx.drawImage(processedShip, -ship.r * 1.5, -ship.r * 1.5, ship.r * 3, ship.r * 3);
                ctx.restore();
            }
        }

        bullets.forEach((b, i) => { 
            b.x += b.vx; b.y += b.vy; b.life--; 
            ctx.save(); ctx.fillStyle='#ff0077'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff0077';
            ctx.fillRect(b.x-3, b.y-3, 6, 6); ctx.restore();
            if(b.life<=0) bullets.splice(i,1); 
        });

        asteroids.forEach((a, i) => {
            a.x += a.v.x; a.y += a.v.y; a.a += a.rotV;
            if (a.x < -a.r) a.x = canvas.width + a.r; if (a.x > canvas.width + a.r) a.x = -a.r;
            if (a.y < -a.r) a.y = canvas.height + a.r; if (a.y > canvas.height + a.r) a.y = -a.r;
            
            if (astReady) {
                ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.a);
                if (a.type === 'crystal') { ctx.shadowBlur = 20; ctx.shadowColor = '#bc13fe'; ctx.filter = 'hue-rotate(90deg)'; }
                ctx.drawImage(processedAst, -a.r, -a.r, a.r * 2, a.r * 2);
                ctx.restore();
            }

            if (!gameOver && !victory && dist(ship.x, ship.y, a.x, a.y) < ship.r + a.r) { gameOver = true; shake = 30; endGame(); }

            bullets.forEach((b, bi) => {
                if (dist(b.x, b.y, a.x, a.y) < a.r) {
                    bullets.splice(bi, 1); a.hp--;
                    if (a.hp <= 0) {
                        score += a.r < 20 ? 100 : (a.r < 30 ? 50 : 25);
                        shake = 5;
                        if (score >= VICTORY_SCORE) { victory = true; endGame(); }
                        if (score >= level * 1000) { level++; }
                        
                        if (a.r > 15) {
                            for (let k = 0; k < 2; k++) asteroids.push(createAsteroid(a.x, a.y, a.r / 2, 1 + level*0.1));
                        }
                        for (let k = 0; k < 8; k++) particles.push({ x: a.x, y: a.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 1, color: a.type === 'crystal' ? '#bc13fe' : '#fff' });
                        asteroids.splice(i, 1);
                    }
                }
            });
        });

        if (asteroids.length === 0 && !gameOver && !victory) createWave();

        particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, 3, 3); if (p.life <= 0) particles.splice(i, 1); });
        ctx.globalAlpha = 1;
        
        // HUD
        ctx.fillStyle = '#fff'; ctx.font = '900 20px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`SKOR: ${score}`, 20, 40);
        ctx.textAlign = 'right';
        ctx.fillText(`LEVEL: ${level}`, canvas.width - 20, 40);
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Inter'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`HEDEF: 20,000`, canvas.width/2, 35);

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = '900 60px Inter'; ctx.fillText('GAMEOVER', canvas.width/2, canvas.height/2);
        }
        if (victory) {
            ctx.fillStyle = 'rgba(0,0,20,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#00f2ff'; ctx.font = '900 60px Inter'; ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Inter'; ctx.fillText('GALAKSİNİN KORUYUCUSU OLDUN!', canvas.width/2, canvas.height/2 + 60);
        }
        ctx.restore();
        requestAnimationFrame(update);
    }

    function shoot() {
        if (gameOver || victory) return;
        bullets.push({ x: ship.x + Math.cos(ship.a)*ship.r, y: ship.y + Math.sin(ship.a)*ship.r, vx: Math.cos(ship.a)*8, vy: Math.sin(ship.a)*8, life: 60 });
    }

    function endGame() { setTimeout(() => { const o = document.getElementById('play-overlay'); if (o) o.style.display = 'flex'; }, 3000); }

    window.addEventListener('keydown', e => { 
        if ([32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
        keys[e.keyCode] = true; 
        if (e.keyCode === 32) shoot(); 
    });
    window.addEventListener('keyup', e => { keys[e.keyCode] = false; });
    
    // Mobile Touch Support
    canvas.addEventListener('touchstart', e => {
        const touch = e.touches[0]; const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        if (tx < canvas.width / 3) mobileInput.left = true;
        else if (tx > (canvas.width / 3) * 2) mobileInput.right = true;
        else { mobileInput.thrust = true; shoot(); }
    });
    canvas.addEventListener('touchend', () => { mobileInput.left = false; mobileInput.right = false; mobileInput.thrust = false; });

    init(); requestAnimationFrame(update);
})();
