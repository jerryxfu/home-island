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
let starsResizeHandler = null;
let starsResizeTimer = null;

function createStars() {
    const container = document.getElementById("stars-container");
    if (!container) return;
    container.innerHTML = "";

    starsCanvas = document.createElement("canvas");
    starsCanvas.id = "stars-canvas";
    container.appendChild(starsCanvas);
    starsCtx = starsCanvas.getContext("2d");
    if (!starsCtx) return;

    resizeStarsCanvas();

    // Debounce resize to avoid excessive canvas re-allocations
    if (starsResizeHandler) {
        window.removeEventListener("resize", starsResizeHandler);
    }
    starsResizeHandler = () => {
        clearTimeout(starsResizeTimer);
        starsResizeTimer = setTimeout(resizeStarsCanvas, 150);
    };
    window.addEventListener("resize", starsResizeHandler, {passive: true});

    // Generate star data (pure data objects, no DOM elements)
    const starCount = 88;
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
            // Twinkle period in seconds (slightly higher minimum to avoid very fast pulsing)
            speed: 2.8 + Math.random() * 3.2,
        });
    }

    // Shooting star data
    shootingStarsData = [];
    for (let i = 0; i < 3; i++) {
        const angle = (24 + Math.random() * 10) * (Math.PI / 180);
        const stagger = i * 6;
        shootingStarsData.push({
            x: 0.1 + Math.random() * 0.55,
            y: 0.03 + Math.random() * 0.32,
            delay: 4 + stagger + Math.random() * 5,
            period: 18 + Math.random() * 12,
            angle,
            length: 120 + Math.random() * 50,
            travel: 250 + Math.random() * 60,
            visibleFraction: 0.13 + Math.random() * 0.06,
            lineWidth: 0.75 + Math.random() * 0.45,
            opacity: 0.55 + Math.random() * 0.2,
        });
    }

    lastStarsTime = performance.now();
    if (starsAnimId) cancelAnimationFrame(starsAnimId);
    starsAnimId = null;

    // Only start if stars should be visible right now
    if (window.HomeIslandTheme?.getStarOpacity(getDecimalHour()) > 0) {
        startStarsLoop();
    }
}

function resizeStarsCanvas() {
    if (!starsCanvas || !starsCtx) return;
    // Clamp DPR a bit to keep GPU cost predictable on very dense displays.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    starsCanvas.width = Math.floor(window.innerWidth * dpr);
    starsCanvas.height = Math.floor(window.innerHeight * dpr);
    starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startStarsLoop() {
    if (starsAnimId) return; // already running
    lastStarsTime = performance.now();
    starsAnimLoop();
}

function stopStarsLoop() {
    if (starsAnimId) {
        cancelAnimationFrame(starsAnimId);
        starsAnimId = null;
        // Clear the canvas so there's no stale frame
        if (starsCtx && starsCanvas) {
            starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
        }
    }
}

function starsAnimLoop() {
    starsAnimId = requestAnimationFrame(starsAnimLoop);
    if (!starsCtx || !starsCanvas) return;

    const now = performance.now();
    const elapsed = now - lastStarsTime;

    // Throttle to ~30 fps for performance
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
        // Sine-wave twinkle: opacity oscillates 0.3 -> 1.0
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(timeSec * (Math.PI * 2 / s.speed) + s.phase));
        const scale = 1 + 0.2 * (twinkle - 0.3) / 0.7;

        const px = s.x * w;
        const py = s.y * h;
        const r = s.radius * scale;

        // Glow (radial fill to replace expensive CSS box-shadow)
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
    let activeShootingStars = 0;
    for (let i = 0; i < shootingStarsData.length; i++) {
        const ss = shootingStarsData[i];
        const cycleTime = (timeSec - ss.delay) % ss.period;
        if (cycleTime < 0) continue;
        const visibleWindow = ss.period * ss.visibleFraction;
        if (cycleTime > visibleWindow) continue;

        const progress = cycleTime / visibleWindow;
        // Keep travel mostly constant while brightness handles the fade timing.
        const travelProgress = progress;
        // Slightly separate fade timing from travel so speed does not appear to drop at fade-out.
        const fadeProgress = Math.min(1, progress * 1.03);
        const opacity = Math.sin(fadeProgress * Math.PI);
        if (opacity <= 0) continue;
        if (activeShootingStars >= 1) continue;
        activeShootingStars++;

        const dx = Math.cos(ss.angle);
        const dy = Math.sin(ss.angle);
        const px = ss.x * w + dx * ss.travel * travelProgress;
        const py = ss.y * h + dy * ss.travel * travelProgress;
        const tailX = px - dx * ss.length;
        const tailY = py - dy * ss.length;

        ctx.globalAlpha = starsOpacity * Math.max(0, opacity) * ss.opacity;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(px, py);
        const grad = ctx.createLinearGradient(tailX, tailY, px, py);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,1)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.lineWidth;
        ctx.stroke();

        // Subtle head sparkle to make meteors readable without becoming flashy.
        ctx.globalAlpha = starsOpacity * opacity * ss.opacity * 0.55;
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
    }

    ctx.globalAlpha = 1;
}
