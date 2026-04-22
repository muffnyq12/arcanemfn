const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { x: canvas.width / 2, y: canvas.height - 50, size: 20, color: '#00f2ff' };
let bullets = [];
let enemies = [];
let particles = [];
let score = 0;

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size, player.y + player.size);
    ctx.lineTo(player.x + player.size, player.y + player.size);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            color: color
        });
    }
}

function spawnEnemy() {
    if (Math.random() < 0.05) {
        enemies.push({ 
            x: Math.random() * canvas.width, 
            y: -20, 
            size: 15 + Math.random() * 10, 
            speed: 2 + Math.random() * 3,
            color: '#bc13fe' 
        });
    }
}

function update() {
    if (window.isPaused || !window.gameStarted) {
        requestAnimationFrame(update);
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background Stars (Simulated)
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for(let i=0; i<20; i++) ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2, 2);

    drawPlayer();
    
    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 3, 3);
        if (p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;

    // Bullets
    bullets.forEach((b, i) => {
        b.y -= 8;
        ctx.fillStyle = '#00f2ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2ff';
        ctx.fillRect(b.x - 2, b.y, 4, 12);
        ctx.shadowBlur = 0;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Enemies
    spawnEnemy();
    enemies.forEach((e, i) => {
        e.y += e.speed;
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.fillRect(e.x, e.y, e.size, e.size);
        ctx.shadowBlur = 0;

        // Collision with bullets
        bullets.forEach((b, bi) => {
            if (b.x > e.x && b.x < e.x + e.size && b.y > e.y && b.y < e.y + e.size) {
                createParticles(e.x + e.size/2, e.y + e.size/2, e.color);
                enemies.splice(i, 1);
                bullets.splice(bi, 1);
                score += 10;
            }
        });

        if (e.y > canvas.height) enemies.splice(i, 1);
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Inter';
    ctx.fillText(`SKOR: ${score}`, 20, 40);

    requestAnimationFrame(update);
}

window.addEventListener('keydown', (e) => {
    // PREVENT SCROLLING
    if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }

    if (e.key === 'ArrowLeft' && player.x > 20) player.x -= 25;
    if (e.key === 'ArrowRight' && player.x < canvas.width - 20) player.x += 25;
    if (e.code === 'Space') bullets.push({ x: player.x, y: player.y - 20 });
});

// MOBILE BUTTONS SUPPORT
document.getElementById('btn-left')?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player.x > 20) player.x -= 30;
});
document.getElementById('btn-right')?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player.x < canvas.width - 20) player.x += 30;
});
document.getElementById('btn-fire')?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    bullets.push({ x: player.x, y: player.y - 20 });
});

update();
