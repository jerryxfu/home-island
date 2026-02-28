const SCHEDULER_URL_PREFIX = "https://jerryxf.net";
// const SCHEDULER_URL_PREFIX = "http://localhost:5173";

/** @type {any} */
let chrome;
/** @type {any} */
let browser;

// Default shortcuts
const DEFAULT_SHORTCUTS = [
    {name: "Outlook", url: "https://outlook.live.com", favicon: ""},
    {name: "OneDrive", url: "https://onedrive.live.com", favicon: "https://onedrive.live.com/_layouts/15/images/odbfavicon.ico"},
    {name: "Word", url: "https://word.cloud.microsoft", favicon: ""},
    {name: "Excel", url: "https://excel.cloud.microsoft", favicon: ""},
    {name: "PowerPoint", url: "https://powerpoint.cloud.microsoft", favicon: ""},
    {name: "Gmail", url: "https://mail.google.com", favicon: ""},
    {name: "YouTube", url: "https://youtube.com", favicon: ""},
    {name: "GitHub", url: "https://github.com", favicon: ""},
    {name: "Spotify", url: "https://spotify.com", favicon: ""}
];

// Interpolate colors based on time of day
const TIME_COLORS = [
    {hour: 0, colors: ["#050508", "#08080d", "#0b0b12", "#0e0e15", "#101018", "#12121a"]},
    {hour: 4, colors: ["#0f0f18", "#13131d", "#191923", "#1c1c28", "#1f1f2e", "#222230"]},
    {hour: 5, colors: ["#141828", "#1c2038", "#242848", "#2c3058", "#343868", "#3c4078"]},
    {hour: 6, colors: ["#3c3860", "#584878", "#785890", "#9870a8", "#b888c0", "#d8a0d0"]},
    {hour: 7, colors: ["#9080a8", "#b090b8", "#d0a8c8", "#e8c0d0", "#f0d0d8", "#f8e0e8"]},
    {hour: 9, colors: ["#a8d0c8", "#b8dcd0", "#c8e4d8", "#d8ece0", "#e8f4ec", "#f0f8f4"]},
    {hour: 11, colors: ["#c8e0c8", "#d8e8d0", "#e4eed8", "#f0f4e4", "#f6f8ec", "#fafcf4"]},
    {hour: 13, colors: ["#e8e4c0", "#f0ecc8", "#f4f0d0", "#f8f4d8", "#faf8e4", "#fcfaec"]},
    {hour: 15, colors: ["#e8dcc0", "#f0e4c8", "#f4ead0", "#f8f0d8", "#faf4e4", "#fcf8ec"]},
    {hour: 17, colors: ["#d8c8b0", "#e4d4b8", "#f0dcc0", "#f6e4c8", "#faecd0", "#fcf2dc"]},
    {hour: 18, colors: ["#a0b8c8", "#c8b8a8", "#e0c0a0", "#ecd0b0", "#f4dcc0", "#f8e8d0"]},
    {hour: 19, colors: ["#607888", "#888078", "#a89080", "#c8a898", "#e0c0b0", "#f0d8c8"]},
    {hour: 20, colors: ["#384860", "#484058", "#584860", "#685070", "#786080", "#887090"]},
    {hour: 21, colors: ["#202838", "#282840", "#303048", "#383850", "#404058", "#484860"]},
    {hour: 22, colors: ["#0f0f18", "#13131d", "#191923", "#1c1c28", "#1f1f2e", "#222230"]},
    {hour: 24, colors: ["#050508", "#08080d", "#0b0b12", "#0e0e15", "#101018", "#12121a"]},
];

// ================================
// Cached DOM references (avoid getElementById on every tick)
// ================================
let $background = null;
let $clock = null;
let $date = null;
let $greeting = null;

// Get current time as decimal hours (0-24)
function getDecimalHour() {
    if (demoMode) return demoHour;

    const now = new Date();
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

// Interpolate between two hex colors
function lerpColor(hex1, hex2, t) {
    const r1 = parseInt(hex1.slice(1, 3), 16), g1 = parseInt(hex1.slice(3, 5), 16), b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16), g2 = parseInt(hex2.slice(3, 5), 16), b2 = parseInt(hex2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Get interpolated colors for current time
function getColorsForTime(hour) {
    let before = TIME_COLORS[0], after = TIME_COLORS[1];
    for (let i = 0; i < TIME_COLORS.length - 1; i++) {
        if (hour >= TIME_COLORS[i].hour && hour < TIME_COLORS[i + 1].hour) {
            before = TIME_COLORS[i];
            after = TIME_COLORS[i + 1];
            break;
        }
    }

    const t = (hour - before.hour) / (after.hour - before.hour);
    return before.colors.map((color, i) => lerpColor(color, after.colors[i], t));
}

// Get star opacity based on time
function getStarOpacity(hour) {
    if (hour >= 21 || hour < 5) return 1;
    if (hour >= 20 && hour < 21) return hour - 20;
    if (hour >= 5 && hour < 6) return 6 - hour;
    return 0;
}

function updateBackground() {
    const hour = getDecimalHour();

    const colors = getColorsForTime(hour);
    $background.style.background = `linear-gradient(135deg, ${colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(", ")})`;
    $background.style.backgroundSize = "150% 150%";

    // Update star opacity — the canvas render loop reads this each frame
    starsOpacity = getStarOpacity(hour);

    updateTextColor(hour);
}

// Toggle text between light and dark based on time
function updateTextColor(hour) {
    const isDarkTime = hour >= 19 || hour < 5;

    if (isDarkTime) {
        document.documentElement.classList.add("dark-mode");
        document.documentElement.classList.remove("light-mode");
    } else {
        document.documentElement.classList.add("light-mode");
        document.documentElement.classList.remove("dark-mode");
    }
}

// ================================
// Stars — Canvas-based (replaces 135 animated DOM elements with 1 canvas)
//
// WHY: Each DOM star had its own CSS animation running `opacity` + `transform`
// + `box-shadow` repaints. The profiler showed 124+ "twinkle" animation tracks
// all competing for compositor time. A single <canvas> with rAF is dramatically
// cheaper and also skips rendering entirely during daytime (zero CPU).
// ================================
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

// ================================
// Time and date
// ================================
function updateClock() {
    const now = new Date();

    let hours, minutes, seconds;
    if (demoMode) {
        hours = Math.floor(demoHour);
        minutes = Math.floor((demoHour % 1) * 60);
        seconds = Math.floor(((demoHour % 1) * 60 % 1) * 60);
    } else {
        hours = now.getHours();
        minutes = now.getMinutes();
        seconds = now.getSeconds();
    }

    const minutesStr = minutes.toString().padStart(2, "0");
    const secondsStr = seconds.toString().padStart(2, "0");

    $clock.textContent = `${hours}:${minutesStr}:${secondsStr}`;

    // In focus mode, show time in the greeting/title position
    if (isFocusMode) {
        $greeting.textContent = `${hours}:${minutesStr}:${secondsStr}`;
    }

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    $date.textContent = now.toLocaleDateString("en-US", options);
}

// ================================
// Greeting
// ================================
function updateGreeting() {
    // In focus mode, the greeting element shows the time — skip greeting updates
    if (isFocusMode) return;

    const hour = demoMode ? Math.floor(demoHour) : new Date().getHours();

    let greeting;

    if (hour >= 5 && hour < 7) {
        greeting = "Early Bird";
    } else if (hour >= 7 && hour < 12) {
        greeting = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening";
    } else {
        greeting = "Good Night";
    }

    if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(["userName"], (result) => {
            $greeting.textContent = result.userName ? `${greeting}, ${result.userName}` : greeting;
        });
    } else if (typeof browser !== "undefined" && browser.storage) {
        browser.storage.local.get(["userName"]).then((result) => {
            $greeting.textContent = result.userName ? `${greeting}, ${result.userName}` : greeting;
        });
    } else {
        const userName = localStorage.getItem("userName");
        $greeting.textContent = userName ? `${greeting}, ${userName}` : greeting;
    }
}

// ================================
// Search
// ================================
function initSearch() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("q");

    if (searchInput) {
        searchInput.focus();
    }

    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const query = searchInput?.value?.trim();
            if (!query) return;

            if (typeof chrome !== "undefined" && chrome.search && chrome.search.query) {
                chrome.search.query({text: query, disposition: "CURRENT_TAB"});
            } else if (typeof browser !== "undefined" && browser.search && browser.search.query) {
                browser.search.query({text: query, disposition: "CURRENT_TAB"});
            } else {
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            }
        });
    }
}

// ================================
// Keyboard Shortcuts & Undock
// ================================
let isUndocked = false;
let autoUndockTimeout = null;
let autoUndockDelay = 0;
let isFocusMode = false;

function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        const modifierKeys = ["Control", "Alt", "Meta", "Tab"];

        if (e.key === "Escape") {
            e.preventDefault();
            if (!isUndocked) {
                undockScreen();
            } else {
                dockScreen();
            }
            return;
        }

        if (isUndocked && !modifierKeys.includes(e.key)) {
            e.preventDefault();
            dockScreen();
            return;
        }

        if (!modifierKeys.includes(e.key)) {
            resetAutoUndockTimer();
        }

        if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
            e.preventDefault();
            document.getElementById("q").focus();
        }
    });

    document.addEventListener("click", () => {
        if (isUndocked) {
            dockScreen();
        } else {
            resetAutoUndockTimer();
        }
    });

    document.addEventListener("mousemove", () => {
        if (!isUndocked) {
            resetAutoUndockTimer();
        }
    });

    loadAutoUndockSetting();
}

function resetAutoUndockTimer() {
    if (autoUndockDelay <= 0) return;

    clearTimeout(autoUndockTimeout);
    autoUndockTimeout = setTimeout(() => {
        if (!isUndocked) {
            undockScreen();
        }
    }, autoUndockDelay);
}

function loadAutoUndockSetting() {
    if (chrome?.storage) {
        chrome.storage.local.get(["autoUndockDelay"], (result) => {
            autoUndockDelay = parseInt(result.autoUndockDelay) || 0;
            if (autoUndockDelay > 0) resetAutoUndockTimer();
        });
    } else if (browser?.storage) {
        browser.storage.local.get(["autoUndockDelay"]).then((result) => {
            autoUndockDelay = parseInt(result.autoUndockDelay) || 0;
            if (autoUndockDelay > 0) resetAutoUndockTimer();
        });
    } else {
        autoUndockDelay = parseInt(localStorage.getItem("autoUndockDelay")) || 0;
        if (autoUndockDelay > 0) resetAutoUndockTimer();
    }
}

function undockScreen() {
    isUndocked = true;
    document.body.classList.add("undocked");
    document.getElementById("q")?.blur();
    clearTimeout(autoUndockTimeout);
}

function dockScreen() {
    isUndocked = false;
    document.body.classList.remove("undocked");
    resetAutoUndockTimer();
}

// ================================
// Demo Mode
// ================================
let demoMode = false;
let demoHour = 0;
let demoUpdatesPerSecond = 30;
let demoHoursPerUpdate = 0.04;
let demoIntervalId = null; // Track interval to prevent leaks

// ================================
// Scheduler
// ================================
function initScheduler() {
    const container = document.getElementById("scheduler-container");
    if (!container) return;

    const iframe = container.querySelector("iframe");

    if (chrome?.storage) {
        chrome.storage.local.get(["showScheduler", "schedulerId"], (result) => {
            if (result.showScheduler === true || result.showScheduler === "true") {
                const schedulerId = result.schedulerId || "";
                iframe.src = `${SCHEDULER_URL_PREFIX}/scheduler?homeisland=true&id=${encodeURIComponent(schedulerId)}`;
                container.classList.remove("hidden");
            }
        });
    } else if (browser?.storage) {
        browser.storage.local.get(["showScheduler", "schedulerId"]).then((result) => {
            if (result.showScheduler === true || result.showScheduler === "true") {
                const schedulerId = result.schedulerId || "";
                iframe.src = `${SCHEDULER_URL_PREFIX}/scheduler?homeisland=true&id=${encodeURIComponent(schedulerId)}`;
                container.classList.remove("hidden");
            }
        });
    } else {
        const showScheduler = localStorage.getItem("showScheduler");
        const schedulerId = localStorage.getItem("schedulerId") || "";
        if (showScheduler === "true") {
            iframe.src = `${SCHEDULER_URL_PREFIX}/scheduler?homeisland=true&id=${encodeURIComponent(schedulerId)}`;
            container.classList.remove("hidden");
        }
    }
}

function toggleDemoMode() {
    demoMode = !demoMode;
    if (demoMode) {
        demoHour = getDecimalHour();
        console.log(`🎬 Demo mode ON - ${demoUpdatesPerSecond} updates/sec, ${demoHoursPerUpdate} hours/update`);
        console.log(`   (${(demoHoursPerUpdate * demoUpdatesPerSecond * 60).toFixed(1)} simulated minutes per real second)`);
        startDemoMode();
    } else {
        console.log("⏸️ Demo mode OFF - Using real time");
        if (demoIntervalId) {
            clearInterval(demoIntervalId);
            demoIntervalId = null;
        }
    }
}

function startDemoMode() {
    if (!demoMode) return;

    // Clear any existing interval first (prevents stacking)
    if (demoIntervalId) {
        clearInterval(demoIntervalId);
    }

    const intervalMs = 1000 / demoUpdatesPerSecond;

    demoIntervalId = setInterval(() => {
        if (!demoMode) return;

        demoHour += demoHoursPerUpdate;
        if (demoHour >= 24) demoHour = 0;

        const colors = getColorsForTime(demoHour);

        $background.style.background = `linear-gradient(135deg, ${colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(", ")})`;
        starsOpacity = getStarOpacity(demoHour);
        updateTextColor(demoHour);

        updateClock();
        updateGreeting();

        console.log(`⏰ Demo time: ${Math.floor(demoHour)}:${Math.floor((demoHour % 1) * 60).toString().padStart(2, "0")}`);
    }, intervalMs);
}

// ================================
// Quick Links / Shortcuts
// ================================
function getFaviconUrl(url, customFavicon) {
    if (customFavicon && customFavicon.trim()) {
        return customFavicon.trim();
    }
    try {
        const urlObj = new URL(url);
        return `https://favicon.im/${urlObj.host}`;
    } catch {
        return `https://favicon.im/${url}`;
    }
}

function renderShortcuts(shortcuts) {
    const container = document.getElementById("quick-links");
    if (!container) return;

    // Build in a DocumentFragment - single DOM reflow instead of N
    const fragment = document.createDocumentFragment();

    shortcuts.forEach(shortcut => {
        if (!shortcut.name || !shortcut.url) return;

        const link = document.createElement("a");
        link.href = shortcut.url;
        link.className = "quick-link";

        const faviconUrl = getFaviconUrl(shortcut.url, shortcut.favicon);

        const iconSpan = document.createElement("span");
        iconSpan.className = "quick-link-icon";
        const img = document.createElement("img");
        img.src = faviconUrl;
        img.alt = `${shortcut.name} icon`;
        img.className = "quick-link-favicon";
        img.loading = "lazy";
        iconSpan.appendChild(img);

        const textSpan = document.createElement("span");
        textSpan.className = "quick-link-text";
        textSpan.textContent = shortcut.name;

        link.appendChild(iconSpan);
        link.appendChild(textSpan);
        fragment.appendChild(link);
    });

    container.innerHTML = "";
    container.appendChild(fragment);
}

function loadShortcuts() {
    if (chrome?.storage) {
        chrome.storage.local.get(["shortcuts"], (result) => {
            const shortcuts = result.shortcuts ? JSON.parse(result.shortcuts) : DEFAULT_SHORTCUTS;
            renderShortcuts(shortcuts);
        });
    } else if (browser?.storage) {
        browser.storage.local.get(["shortcuts"]).then((result) => {
            const shortcuts = result.shortcuts ? JSON.parse(result.shortcuts) : DEFAULT_SHORTCUTS;
            renderShortcuts(shortcuts);
        });
    } else {
        const shortcutsStr = localStorage.getItem("shortcuts");
        const shortcuts = shortcutsStr ? JSON.parse(shortcutsStr) : DEFAULT_SHORTCUTS;
        renderShortcuts(shortcuts);
    }
}


// ================================
// Focus Mode
// ================================
function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    document.body.classList.toggle("focus-mode", isFocusMode);

    if (isFocusMode) {
        // Show time in the greeting position
        updateClock();
    } else {
        // Restore the greeting text
        updateGreeting();
    }

    // Persist focus mode state
    if (chrome?.storage) {
        chrome.storage.local.set({focusMode: isFocusMode});
    } else if (browser?.storage) {
        browser.storage.local.set({focusMode: isFocusMode});
    } else {
        localStorage.setItem("focusMode", String(isFocusMode));
    }
}

function loadFocusModeSetting() {
    if (chrome?.storage) {
        chrome.storage.local.get(["focusMode"], (result) => {
            if (result.focusMode === true || result.focusMode === "true") {
                isFocusMode = true;
                document.body.classList.add("focus-mode");
                updateClock();
            }
        });
    } else if (browser?.storage) {
        browser.storage.local.get(["focusMode"]).then((result) => {
            if (result.focusMode === true || result.focusMode === "true") {
                isFocusMode = true;
                document.body.classList.add("focus-mode");
                updateClock();
            }
        });
    } else {
        if (localStorage.getItem("focusMode") === "true") {
            isFocusMode = true;
            document.body.classList.add("focus-mode");
            updateClock();
        }
    }
}

// ================================
// Init
// ================================
function init() {
    // Cache DOM references once at startup
    $background = document.getElementById("dynamic-background");
    $clock = document.getElementById("clock");
    $date = document.getElementById("date");
    $greeting = document.getElementById("greeting");

    createStars();
    updateBackground();

    setInterval(updateBackground, 30000);

    updateClock();
    setInterval(updateClock, 1000);

    updateGreeting();
    setInterval(updateGreeting, 60000);

    initSearch();
    initKeyboardShortcuts();
    loadDemoModeSetting();
    initScheduler();
    loadShortcuts();
    loadFocusModeSetting();

    // Focus mode toggle button
    const focusToggle = document.getElementById("focus-toggle");
    if (focusToggle) {
        focusToggle.addEventListener("click", toggleFocusMode);
    }

    requestAnimationFrame(() => {
        document.body.classList.add("transitions-ready");
    });

    console.log("🏝️ Home Island loaded successfully!");
}

function loadDemoModeSetting() {
    if (chrome?.storage) {
        chrome.storage.local.get(["demoMode"], (result) => {
            if (result.demoMode === true || result.demoMode === "true") {
                toggleDemoMode();
            }
        });
    } else if (browser?.storage) {
        browser.storage.local.get(["demoMode"]).then((result) => {
            if (result.demoMode === true || result.demoMode === "true") {
                toggleDemoMode();
            }
        });
    } else {
        const demoSetting = localStorage.getItem("demoMode");
        if (demoSetting === "true") {
            toggleDemoMode();
        }
    }
}

document.addEventListener("DOMContentLoaded", init);