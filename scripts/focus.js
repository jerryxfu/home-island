let isFocusMode = false;

function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    document.body.classList.toggle("focus-mode", isFocusMode);

    if (isFocusMode) {
        updateClock();
    } else {
        updateGreeting();
    }

    storage.set({focusMode: isFocusMode});
}

async function loadFocusModeSetting() {
    const result = await storage.get(["focusMode"]);
    if (result.focusMode === true || result.focusMode === "true") {
        isFocusMode = true;
        document.body.classList.add("focus-mode");
        updateClock();
    }
}
