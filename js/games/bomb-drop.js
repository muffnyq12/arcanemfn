const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let bombs = [];
let targets = [];
let particles = [];
let score = 0;
let shake = 0;
let gameActive = true;

function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            size: Math.random() * 5,
            color: color
        });
    }
}

function spawnTarget() {
    if (Math.random() < 0.03) {
        targets.push({ 
            x: Math.random() * (canvas.width - 60), 
            y: canvas.height - 40, 
            width: 60, 
            color: '#39ff14' 
        });
    }
}

function update() {
    if (window.isPaused || !window.gameStarted || !gameActive) {
        requestAnimationFrame(update);
        return;
    }
    
    ctx.save();
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= 0.9;
    }
    
    ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);
    
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if (p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;

    bombs.forEach((b, i) => {
        b.y += 6;
        ctx.fillStyle = '#ff4444';
        ctx.beginPath(); ctx.arc(b.x, b.y, 12, 0, Math.PI * 2); ctx.fill();

        targets.forEach((t, ti) => {
            if (b.x > t.x && b.x < t.x + t.width && b.y > t.y - 15) {
                createParticles(b.x, b.y, '#39ff14');
                targets.splice(ti, 1); bombs.splice(i, 1);
                score += 50; shake = 10;
            }
        });
        if (b.y > canvas.height) bombs.splice(i, 1);
    });

    spawnTarget();
    targets.forEach((t) => {
        ctx.fillStyle = t.color;
        ctx.fillRect(t.x, t.y, t.width, 25);
    });

    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Inter';
    ctx.fillText(`SKOR: ${score}`, 20, 50);

    requestAnimationFrame(update);
}

canvas.addEventListener('mousedown', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    bombs.push({ x: x, y: 70 });
});

update();
