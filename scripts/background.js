const theme = window.HomeIslandTheme;

function updateBackground() {
    if (!theme) return;
    const hour = getDecimalHour();
    const snapshot = theme.getThemeSnapshot(hour);

    $background.style.background = snapshot.gradient;

    // star opacity and toggle the rAF loop accordingly.
    // performance: Fully pauses the rAF during daytime (profiler shows idle ticks when the loop was always running)
    starsOpacity = snapshot.starOpacity;
    if (starsOpacity > 0) {
        startStarsLoop();
    } else {
        stopStarsLoop();
    }

    theme.applyTextModeClass(hour);
}
