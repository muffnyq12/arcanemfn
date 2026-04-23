(function() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // SAFE I18N GETTER
    const _t = (key) => {
        if (window.i18n && typeof window.i18n.get === 'function') return window.i18n.get(key);
        return { score: "SKOR", game_over: "OYUN BİTTİ" }[key] || key;
    };

    let player = { x: canvas.width / 2, y: canvas.height - 80, size: 25, color: '#00f2ff', targetX: canvas.width / 2 };
    let bullets = [];
    let enemies = [];
    let particles = [];
    let stars = [];
    let score = 0;
    let gameOver = false;
    let shake = 0;
    let lastTime = 0;

    // Initialize stars for Parallax
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 3 + 1
        });
    }

    function createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                size: Math.random() * 4 + 2,
                color: color
            });
        }
    }

    function spawnEnemy() {
        if (Math.random() < 0.04 && !gameOver) {
            enemies.push({ 
                x: Math.random() * (canvas.width - 40) + 20, 
                y: -40, 
                size: 30 + Math.random() * 20, 
                speed: 2 + Math.random() * 2,
                color: '#bc13fe',
                health: 1,
                pulse: 0
            });
        }
    }

    function update(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;

        if (window.isPaused || !window.gameStarted) {
            requestAnimationFrame(update);
            return;
        }

        ctx.save();
        
        // SCREEN SHAKE
        if (shake > 0) {
            ctx.translate(Math.random() * shake - shake / 2, Math.random() * shake - shake / 2);
            shake *= 0.9;
            if (shake < 0.1) shake = 0;
        }

        ctx.fillStyle = '#010103';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // PARALLAX STARS
        stars.forEach(s => {
            s.y += s.speed;
            if (s.y > canvas.height) {
                s.y = 0;
                s.x = Math.random() * canvas.width;
            }
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (s.size / 3) + ')';
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        if (!gameOver) {
            // Player movement smoothing
            player.x += (player.targetX - player.x) * 0.2;

            // DRAW PLAYER (Neon Ship)
            ctx.shadowBlur = 20;
            ctx.shadowColor = player.color;
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.moveTo(player.x, player.y - player.size);
            ctx.lineTo(player.x - player.size, player.y + player.size);
            ctx.lineTo(player.x + player.size, player.y + player.size);
            ctx.fill();
            
            // Engine Glow
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(player.x, player.y + player.size, 5 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // ENGINE PARTICLES
            if (Math.random() > 0.5) {
                particles.push({
                    x: player.x, y: player.y + player.size,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 3 + 2,
                    life: 0.8,
                    size: 3,
                    color: '#ff0077'
                });
            }
        }

        // PARTICLES
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        });
        ctx.globalAlpha = 1;

        // BULLETS
        bullets.forEach((b, i) => {
            b.y -= 12;
            ctx.fillStyle = '#00f2ff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00f2ff';
            ctx.fillRect(b.x - 2, b.y, 4, 15);
            ctx.shadowBlur = 0;
            if (b.y < 0) bullets.splice(i, 1);
        });

        // ENEMIES
        spawnEnemy();
        enemies.forEach((e, i) => {
            e.y += e.speed;
            e.pulse += 0.1;
            
            const pulseSize = Math.sin(e.pulse) * 5;
            ctx.shadowBlur = 15 + pulseSize;
            ctx.shadowColor = e.color;
            ctx.fillStyle = e.color;
            
            // Draw enemy as a neon diamond
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - e.size / 2);
            ctx.lineTo(e.x + e.size / 2, e.y);
            ctx.lineTo(e.x, e.y + e.size / 2);
            ctx.lineTo(e.x - e.size / 2, e.y);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Collision with bullets
            bullets.forEach((b, bi) => {
                const dist = Math.hypot(b.x - e.x, b.y - e.y);
                if (dist < e.size / 2 + 5) {
                    createParticles(e.x, e.y, e.color, 15);
                    enemies.splice(i, 1);
                    bullets.splice(bi, 1);
                    score += 100;
                    shake = 10;
                }
            });

            // Collision with player
            if (!gameOver && Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size / 2) {
                gameOver = true;
                createParticles(player.x, player.y, player.color, 30);
                createParticles(e.x, e.y, e.color, 30);
                shake = 30;
                setTimeout(() => { location.reload(); }, 2000);
            }

            if (e.y > canvas.height + 50) enemies.splice(i, 1);
        });

        // UI
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = '900 24px Inter';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2ff';
        ctx.fillText(`${_t('score')}: ${score.toLocaleString()}`, 30, 50);
        ctx.shadowBlur = 0;

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0,0,canvas.width, canvas.height);
            ctx.fillStyle = '#ff0077';
            ctx.textAlign = 'center';
            ctx.font = 'bold 50px Inter';
            ctx.fillText(_t('game_over'), canvas.width/2, canvas.height/2);
        }

        ctx.restore();
        requestAnimationFrame(update);
    }

    // Input Handling
    window.addEventListener('keydown', (e) => {
        if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
        if (gameOver) return;
        if (e.key === 'ArrowLeft') player.targetX = Math.max(30, player.targetX - 40);
        if (e.key === 'ArrowRight') player.targetX = Math.min(canvas.width - 30, player.targetX + 40);
        if (e.code === 'Space') bullets.push({ x: player.x, y: player.y - 20 });
    });

    // Mouse/Touch movement
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        player.targetX = e.clientX - rect.left;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        player.targetX = e.touches[0].clientX - rect.left;
    }, {passive: false});

    canvas.addEventListener('touchstart', (e) => {
        if (gameOver) return;
        bullets.push({ x: player.x, y: player.y - 20 });
    }, {passive: false});

    update();
})();
