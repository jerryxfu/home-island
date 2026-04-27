let demoMode = false;
let demoHour = 0;
let demoUpdatesPerSecond = 30;
let demoHoursPerUpdate = 0.04;
let demoIntervalId = null;

function toggleDemoMode() {
    demoMode = !demoMode;
    if (demoMode) {
        demoHour = getDecimalHour();
        console.log(`Demo mode ON - ${demoUpdatesPerSecond} updates/sec, ${demoHoursPerUpdate} hours/update`);
        console.log(`   (${(demoHoursPerUpdate * demoUpdatesPerSecond * 60).toFixed(1)} simulated minutes per real second)`);
        startDemoMode();
    } else {
        console.log("Demo mode OFF, using real time");
        if (demoIntervalId) {
            clearInterval(demoIntervalId);
            demoIntervalId = null;
        }
    }
}

function startDemoMode() {
    if (!demoMode) return;

    if (demoIntervalId) {
        clearInterval(demoIntervalId);
    }

    const intervalMs = 1000 / demoUpdatesPerSecond;

    demoIntervalId = setInterval(() => {
        if (!demoMode) return;

        demoHour += demoHoursPerUpdate;
        if (demoHour >= 24) demoHour = 0;

        const snapshot = window.HomeIslandTheme?.getThemeSnapshot(demoHour);
        if (!snapshot) return;

        $background.style.background = snapshot.gradient;
        starsOpacity = snapshot.starOpacity;
        if (starsOpacity > 0) {
            startStarsLoop();
        } else {
            stopStarsLoop();
        }
        window.HomeIslandTheme.applyTextModeClass(demoHour);

        updateClock();
        updateGreeting();
    }, intervalMs);
}

async function loadDemoModeSetting() {
    const result = await storage.get(["demoMode"]);
    if (result.demoMode === true || result.demoMode === "true") {
        toggleDemoMode();
    }
}
