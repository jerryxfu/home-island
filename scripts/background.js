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

    // star opacity and toggle the rAF loop accordingly.
    // performance: Fully pauses the rAF during daytime (profiler shows idle ticks when the loop was always running)
    starsOpacity = getStarOpacity(hour);
    if (starsOpacity > 0) {
        startStarsLoop();
    } else {
        stopStarsLoop();
    }

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
