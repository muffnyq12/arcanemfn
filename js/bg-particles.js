(function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-particles-canvas';
    Object.assign(canvas.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: '-1',
        pointerEvents: 'none',
        background: '#000'
    });
    document.body.style.background = 'transparent';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height; // Initial random spread
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() > 0.5 ? -10 : canvas.height + 10;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.size = Math.random() * 2.5 + 1;
            this.color = Math.random() > 0.5 ? '0, 242, 255' : '255, 0, 119'; // Cyan or Pink
            this.opacity = Math.random() * 0.4 + 0.2;
            this.fadeDir = Math.random() > 0.5 ? 0.008 : -0.008;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.opacity += this.fadeDir;
            if (this.opacity > 0.3 || this.opacity < 0.05) this.fadeDir *= -1;

            if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
                this.reset();
            }
        }
        draw() {
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgb(${this.color})`;
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // Initialize particles
    for (let i = 0; i < 100; i++) {
        const p = new Particle();
        p.y = Math.random() * canvas.height; // Spread them across screen initially
        particles.push(p);
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
})();
