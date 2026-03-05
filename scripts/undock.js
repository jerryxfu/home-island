let isUndocked = false;
let autoUndockTimeout = null;
let autoUndockDelay = 0;

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

    // performance: {passive: true} tells the browser these handlers won't
    // call preventDefault(), so it can skip blocking on them.
    document.addEventListener("click", () => {
        if (isUndocked) {
            dockScreen();
        } else {
            resetAutoUndockTimer();
        }
    }, {passive: true});

    // performance throttle mousemove to fire at most once per 2s
    let lastMouseMoveReset = 0;
    document.addEventListener("mousemove", () => {
        if (isUndocked) return;
        const now = Date.now();
        if (now - lastMouseMoveReset > 2000) {
            lastMouseMoveReset = now;
            resetAutoUndockTimer();
        }
    }, {passive: true});

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

async function loadAutoUndockSetting() {
    const result = await storage.get(["autoUndockDelay"]);
    autoUndockDelay = parseInt(result.autoUndockDelay) || 0;
    if (autoUndockDelay > 0) resetAutoUndockTimer();
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
