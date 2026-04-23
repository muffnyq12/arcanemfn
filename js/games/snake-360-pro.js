(function() {
    /**
     * NEON SNAKE 360: SPHERICAL EDITION
     */
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let snake = [];
    let food = { lat: 0, lon: 0 };
    let dir = { lat: 0.05, lon: 0 };
    let score = 0;
    let gameOver = false;
    let lastTime = 0;
    let sphereRotation = { x: 0, y: 0 };
    let particles = [];

    const RADIUS = 150;

    function init() {
        snake = [];
        for(let i=0; i<10; i++) snake.push({ lat: 0, lon: -i * 0.05 });
        spawnFood();
        score = 0;
        gameOver = false;
    }

    function spawnFood() {
        food.lat = (Math.random() - 0.5) * Math.PI;
        food.lon = Math.random() * Math.PI * 2;
    }

    function project(lat, lon) {
        // Simple 3D projection to 2D
        let x = RADIUS * Math.cos(lat) * Math.cos(lon + sphereRotation.y);
        let y = RADIUS * Math.sin(lat + sphereRotation.x);
        let z = RADIUS * Math.cos(lat) * Math.sin(lon + sphereRotation.y);
        
        // Scale based on Z (depth)
        let scale = (z + RADIUS * 2) / (RADIUS * 3);
        return { x: x * scale + canvas.width/2, y: y * scale + canvas.height/2, z: z, scale: scale };
    }

    function draw() {
        ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw Sphere Wireframe
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)'; ctx.lineWidth = 1;
        for(let a=0; a<Math.PI*2; a+=Math.PI/8) {
            ctx.beginPath();
            for(let b=-Math.PI/2; b<=Math.PI/2; b+=0.2) {
                let p = project(b, a);
                if (b === -Math.PI/2) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Draw Food
        let fp = project(food.lat, food.lon);
        if (fp.z > -50) { // Only draw if not too far back
            ctx.fillStyle = '#ff0077'; ctx.shadowBlur = 20; ctx.shadowColor = '#ff0077';
            ctx.beginPath(); ctx.arc(fp.x, fp.y, 8 * fp.scale, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw Snake
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        for (let i = 0; i < snake.length - 1; i++) {
            let p1 = project(snake[i].lat, snake[i].lon);
            let p2 = project(snake[i+1].lat, snake[i+1].lon);
            
            if (p1.z > -RADIUS*0.8 || p2.z > -RADIUS*0.8) {
                ctx.strokeStyle = `hsla(180, 100%, 50%, ${p1.scale})`;
                ctx.shadowBlur = 10 * p1.scale; ctx.shadowColor = '#00f2ff';
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
        }

        // Particles
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 2, 2);
            if(p.life <= 0) particles.splice(i, 1);
        });
        ctx.globalAlpha = 1;

        // UI
        ctx.fillStyle = '#fff'; ctx.font = '900 24px Inter'; ctx.textAlign = 'center';
        ctx.fillText(`SCORE: ${score}`, canvas.width/2, 40);

        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ff0077'; ctx.font = '900 60px Inter'; ctx.fillText('CRASHED', canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Inter'; ctx.fillText('TAP TO RESTART', canvas.width/2, canvas.height/2 + 60);
        }
    }

    function update(t) {
        if (!window.gameStarted) { lastTime = t; requestAnimationFrame(update); return; }
        let dt = t - lastTime; lastTime = t;

        if (!gameOver) {
            // Move Snake
            let head = { lat: snake[0].lat + dir.lat, lon: snake[0].lon + dir.lon };
            
            // Wrap coordinates
            if (head.lat > Math.PI/2) head.lat = Math.PI/2;
            if (head.lat < -Math.PI/2) head.lat = -Math.PI/2;
            
            snake.unshift(head);
            
            // Check Food
            let d = Math.sqrt((head.lat - food.lat)**2 + (head.lon - food.lon)**2);
            if (d < 0.15) {
                score += 100; spawnFood();
                for(let i=0; i<10; i++) particles.push({x: canvas.width/2, y: canvas.height/2, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, life:1, color:'#ff0077'});
            } else {
                snake.pop();
            }

            // Check Self-Collision (simplified)
            for (let i = 4; i < snake.length; i++) {
                if (Math.abs(head.lat - snake[i].lat) < 0.02 && Math.abs(head.lon - snake[i].lon) < 0.02) {
                    gameOver = true; endGame();
                }
            }

            // Auto-rotate sphere to follow snake
            sphereRotation.y -= dir.lon;
            sphereRotation.x = -head.lat * 0.5;
        }

        draw();
        requestAnimationFrame(update);
    }

    function endGame() { setTimeout(() => { const o = document.getElementById('play-overlay'); if (o) o.style.display = 'flex'; }, 2000); }

    window.addEventListener('keydown', e => {
        if (gameOver) return;
        if (e.keyCode === 37) { dir.lon = -0.05; dir.lat = 0; }
        if (e.keyCode === 39) { dir.lon = 0.05; dir.lat = 0; }
        if (e.keyCode === 38) { dir.lat = 0.05; dir.lon = 0; }
        if (e.keyCode === 40) { dir.lat = -0.05; dir.lon = 0; }
    });

    canvas.addEventListener('touchstart', e => {
        if (gameOver) { init(); return; }
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        
        if (tx < canvas.width/3) { dir.lon = -0.05; dir.lat = 0; }
        else if (tx > (canvas.width/3)*2) { dir.lon = 0.05; dir.lat = 0; }
        else if (ty < canvas.height/2) { dir.lat = 0.05; dir.lon = 0; }
        else { dir.lat = -0.05; dir.lon = 0; }
    });

    init();
    requestAnimationFrame(update);
})();
