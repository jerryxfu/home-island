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

    // Render a greeting straight away, then re-render once the name arrives.
    initGreetingFit();
    updateGreeting();
    setInterval(updateGreeting, 60000);
    loadUserName().catch(console.error);

    initSearch();
    initKeyboardShortcuts();
    loadDemoModeSetting().catch(console.error);
    initScheduler().catch(console.error);
    loadShortcuts().catch(console.error);
    loadFocusModeSetting().catch(console.error);
    loadVersion();

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

document.addEventListener("DOMContentLoaded", init);
