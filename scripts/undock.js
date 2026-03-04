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
