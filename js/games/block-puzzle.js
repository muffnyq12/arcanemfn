const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 50;
const cols = Math.floor(canvas.width / gridSize);
const rows = Math.floor(canvas.height / gridSize);
let grid = Array(rows).fill().map(() => Array(cols).fill(0));

function drawGrid() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeRect(c * gridSize, r * gridSize, gridSize, gridSize);
            
            if (grid[r][c] !== 0) {
                const color = grid[r][c];
                ctx.fillStyle = color;
                ctx.shadowBlur = 20;
                ctx.shadowColor = color;
                
                // Draw Block with rounded corners
                const padding = 5;
                ctx.beginPath();
                ctx.roundRect(c * gridSize + padding, r * gridSize + padding, gridSize - padding*2, gridSize - padding*2, 8);
                ctx.fill();
                
                // Inner glow
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.shadowBlur = 0;
            }
        }
    }
}

function update() {
    if (window.isPaused || !window.gameStarted) {
        requestAnimationFrame(update);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Subtle background glow
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
    grad.addColorStop(0, 'rgba(188, 19, 254, 0.05)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Inter';
    ctx.fillText('BLOCK PUZZLE', 20, 50);
    ctx.font = '14px Inter';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Blok yerleştirmek için karelere tıkla!', 20, 80);

    requestAnimationFrame(update);
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / gridSize);
    const r = Math.floor(y / gridSize);
    
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = ['#00f2ff', '#bc13fe', '#39ff14', '#ff00ff'][Math.floor(Math.random() * 4)];
    }
});

update();
