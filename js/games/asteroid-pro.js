(function() {
    /**
     * ASTEROIDS: NEON STRIKE - MOBILE LANDSCAPE ADAPTIVE
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let ship; let asteroids = []; let bullets = []; let particles = [];
    let score = 0; let wave = 1; let gameOver = false; let lastTime = 0;

    class Ship {
        constructor() { this.reset(); }
        reset() {
            this.x = canvas.width / 2; this.y = canvas.height / 2;
            this.r = 12; this.angle = 0; this.rotation = 0;
            this.velocity = { x: 0, y: 0 }; this.thrusting = false;
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
            ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 2; ctx.shadowBlur = 15; ctx.shadowColor = '#00f2ff';
            ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, 8); ctx.lineTo(-4, 0); ctx.lineTo(-8, -8); ctx.closePath(); ctx.stroke();
            if (this.thrusting) { ctx.strokeStyle = '#ff0077'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-12, 0); ctx.stroke(); }
            ctx.restore();
        }
        update() {
            if (this.thrusting) { this.velocity.x += Math.cos(this.angle) * 0.12; this.velocity.y += Math.sin(this.angle) * 0.12; }
            this.velocity.x *= 0.99; this.velocity.y *= 0.99;
            this.x += this.velocity.x; this.y += this.velocity.y; this.angle += this.rotation;
            if (this.x < 0) this.x = canvas.width; if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height; if (this.y > canvas.height) this.y = 0;
        }
    }

    class Asteroid {
        constructor(x, y, r, t) {
            this.x = x || Math.random() * canvas.width; this.y = y || Math.random() * canvas.height;
            this.r = r || 30; this.t = t || 3;
            this.v = { x: (Math.random()-0.5)*3, y: (Math.random()-0.5)*3 };
            this.verts = Math.floor(Math.random()*5+7); this.offs = [];
            for(let i=0; i<this.verts; i++) this.offs.push(Math.random()*0.4+0.8);
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y); ctx.strokeStyle = '#bc13fe'; ctx.lineWidth = 2;
            ctx.beginPath(); for(let i=0; i<this.verts; i++) {
                let a = (i/this.verts)*Math.PI*2; let r = this.r*this.offs[i]; ctx.lineTo(r*Math.cos(a), r*Math.sin(a));
            }
            ctx.closePath(); ctx.stroke(); ctx.restore();
        }
        update() {
            this.x += this.v.x; this.y += this.v.y;
            if (this.x < -this.r) this.x = canvas.width + this.r; if (this.x > canvas.width + this.r) this.x = -this.r;
            if (this.y < -this.r) this.y = canvas.height + this.r; if (this.y > canvas.height + this.r) this.y = -this.r;
        }
    }

    function resize() {
        const container = document.getElementById('game-canvas-container');
        if (container) { canvas.width = container.offsetWidth; canvas.height = container.offsetHeight; }
    }

    window.addEventListener('resize', resize);
    resize();

    function drawHUD() {
        const isMobile = canvas.width < 768;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 20, 30);
        ctx.textAlign = 'right'; ctx.fillText(`WAVE: ${wave}`, canvas.width - 20, 30);
        if (!isMobile) {
            // PC Side Panels (Optional overlay)
        }
    }

    function update(t) {
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (!gameOver) {
            ship.update(); ship.draw();
            asteroids.forEach((a, i) => {
                a.update(); a.draw();
                if (Math.hypot(ship.x - a.x, ship.y - a.y) < ship.r + a.r) gameOver = true;
            });
            bullets.forEach((b, bi) => {
                b.x += b.vx; b.y += b.vy;
                ctx.fillStyle = '#ff0077'; ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, Math.PI*2); ctx.fill();
                asteroids.forEach((a, ai) => {
                    if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
                        bullets.splice(bi, 1);
                        if (a.r > 12) { asteroids.push(new Asteroid(a.x, a.y, a.r/2, a.t-1)); asteroids.push(new Asteroid(a.x, a.y, a.r/2, a.t-1)); }
                        asteroids.splice(ai, 1); score += 100;
                        if (asteroids.length === 0) { wave++; spawnWave(); }
                    }
                });
            });
        }
        drawHUD();
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,canvas.width, canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = 'bold 40px Inter'; ctx.textAlign = 'center';
            ctx.fillText('MISSION FAILED', canvas.width/2, canvas.height/2);
        }
        requestAnimationFrame(update);
    }

    function spawnWave() { for(let i=0; i<3+wave; i++) asteroids.push(new Asteroid()); }

    function setupMobileControls() {
        const isMobile = window.innerWidth < 768;
        if (!isMobile) return;
        const container = document.getElementById('game-canvas-container');
        const old = document.getElementById('asteroid-mobile-ui'); if (old) old.remove();
        const ui = document.createElement('div'); ui.id = 'asteroid-mobile-ui';
        ui.style = "position:absolute;bottom:20px;left:20px;right:20px;display:flex;justify-content:space-between;pointer-events:none;z-index:100;";
        const leftGrp = document.createElement('div'); leftGrp.style = "display:flex;gap:10px;pointer-events:auto;";
        const rightGrp = document.createElement('div'); rightGrp.style = "display:flex;gap:10px;pointer-events:auto;";
        
        const btnStyle = "width:60px;height:60px;background:rgba(0,242,255,0.1);border:2px solid #00f2ff;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;user-select:none;touch-action:manipulation;";
        
        const bL = document.createElement('div'); bL.innerHTML = '←'; bL.style = btnStyle;
        bL.ontouchstart = (e) => { e.preventDefault(); ship.rotation = -0.1; }; bL.ontouchend = () => ship.rotation = 0;
        const bR = document.createElement('div'); bR.innerHTML = '→'; bR.style = btnStyle;
        bR.ontouchstart = (e) => { e.preventDefault(); ship.rotation = 0.1; }; bR.ontouchend = () => ship.rotation = 0;
        const bT = document.createElement('div'); bT.innerHTML = '↑'; bT.style = btnStyle + "background:rgba(188,19,254,0.1);border-color:#bc13fe;";
        bT.ontouchstart = (e) => { e.preventDefault(); ship.thrusting = true; }; bT.ontouchend = () => ship.thrusting = false;
        const bF = document.createElement('div'); bF.innerHTML = '🔥'; bF.style = btnStyle + "background:rgba(255,0,119,0.1);border-color:#ff0077;";
        bF.ontouchstart = (e) => { e.preventDefault(); bullets.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.angle)*8, vy: Math.sin(ship.angle)*8 }); };

        leftGrp.appendChild(bL); leftGrp.appendChild(bR);
        rightGrp.appendChild(bT); rightGrp.appendChild(bF);
        ui.appendChild(leftGrp); ui.appendChild(rightGrp);
        container.appendChild(ui);
    }

    function init() { ship = new Ship(); spawnWave(); requestAnimationFrame(update); setupMobileControls(); }
    init();
})();
