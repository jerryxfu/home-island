// Stars animation using canvas for better performance and visual quality
/** @type {HTMLCanvasElement} */
let starsCanvas = null;
/** @type {CanvasRenderingContext2D} */
let starsCtx = null;
let starsData = [];
let shootingStarsData = [];
let starsOpacity = 0;
let starsAnimId = null;
let lastStarsTime = 0;

function createStars() {
    const container = document.getElementById("stars-container");
    container.innerHTML = "";

    starsCanvas = document.createElement("canvas");
    starsCanvas.id = "stars-canvas";
    container.appendChild(starsCanvas);
    starsCtx = starsCanvas.getContext("2d");

    resizeStarsCanvas();

    // Debounce resize to avoid excessive canvas re-allocations
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeStarsCanvas, 150);
    });

    // Generate star data (pure data objects, no DOM elements)
    const starCount = 135;
    const sizeRadii = [0.5, 1, 1.5];
    const glowRadii = [2, 4, 6];
    const glowAlphas = [0.3, 0.4, 0.5];
    const weights = [0.7, 0.25, 0.05];

    starsData = [];
    for (let i = 0; i < starCount; i++) {
        const rand = Math.random();
        let sizeIndex = 0;
        let cumulative = 0;
        for (let j = 0; j < weights.length; j++) {
            cumulative += weights[j];
            if (rand < cumulative) {
                sizeIndex = j;
                break;
            }
        }

        starsData.push({
            x: Math.random(),
            y: Math.random(),
            radius: sizeRadii[sizeIndex],
            glowRadius: glowRadii[sizeIndex],
            glowAlpha: glowAlphas[sizeIndex],
            phase: Math.random() * Math.PI * 2,
            speed: 2 + Math.random() * 4,
        });
    }

    // Shooting star data
    shootingStarsData = [];
    for (let i = 0; i < 3; i++) {
        shootingStarsData.push({
            x: 0.1 + Math.random() * 0.6,
            y: Math.random() * 0.4,
            delay: 5 + Math.random() * 20,
            period: 15 + Math.random() * 15,
            angle: 30 * (Math.PI / 180),
            length: 150,
        });
    }

    lastStarsTime = performance.now();
    if (starsAnimId) cancelAnimationFrame(starsAnimId);
    starsAnimLoop();
}

function resizeStarsCanvas() {
    if (!starsCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    starsCanvas.width = window.innerWidth * dpr;
    starsCanvas.height = window.innerHeight * dpr;
    starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function starsAnimLoop() {
    starsAnimId = requestAnimationFrame(starsAnimLoop);

    // Zero CPU cost during daytime — skip entirely when stars aren't visible
    if (starsOpacity <= 0) return;

    const now = performance.now();
    const elapsed = now - lastStarsTime;

    // Throttle to ~30 fps — twinkling stars don't need 60
    if (elapsed < 33) return;
    lastStarsTime = now;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const ctx = starsCtx;
    const timeSec = now / 1000;

    ctx.clearRect(0, 0, w, h);

    // Draw stars
    for (let i = 0; i < starsData.length; i++) {
        const s = starsData[i];
        // Sine-wave twinkle: opacity oscillates 0.3 → 1.0 (matches old CSS keyframes)
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(timeSec * (Math.PI * 2 / s.speed) + s.phase));
        const scale = 1 + 0.2 * (twinkle - 0.3) / 0.7;

        const px = s.x * w;
        const py = s.y * h;
        const r = s.radius * scale;

        // Glow (cheap radial fill — replaces expensive CSS box-shadow)
        ctx.globalAlpha = starsOpacity * twinkle * s.glowAlpha;
        ctx.beginPath();
        ctx.arc(px, py, s.glowRadius * scale, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();

        // Core dot
        ctx.globalAlpha = starsOpacity * twinkle;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
    }

    // Shooting stars
    for (let i = 0; i < shootingStarsData.length; i++) {
        const ss = shootingStarsData[i];
        const cycleTime = (timeSec - ss.delay) % ss.period;
        if (cycleTime < 0) continue;
        const visibleWindow = ss.period * 0.15;
        if (cycleTime > visibleWindow) continue;

        const progress = cycleTime / visibleWindow;
        const opacity = progress < 0.33 ? progress / 0.33 : (1 - progress);
        if (opacity <= 0) continue;

        const px = ss.x * w + Math.cos(ss.angle) * 300 * progress;
        const py = ss.y * h + Math.sin(ss.angle) * 173 * progress;
        const tailX = px - Math.cos(ss.angle) * ss.length;
        const tailY = py - Math.sin(ss.angle) * ss.length * 0.577;

        ctx.globalAlpha = starsOpacity * Math.max(0, opacity);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(px, py);
        const grad = ctx.createLinearGradient(tailX, tailY, px, py);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,1)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}
