// Time, date, and greeting
// Cached DOM references (set by init)
let $background = null;
let $clock = null;
let $date = null;
let $greeting = null;

// e.g. 21.5 for 9:30 PM, null to disable
const FIXED_TEST_DECIMAL_HOUR = null; // does not work

// Greeting state. The message is rolled once and held until the phase changes,
// so the text does not flicker on the 60s refresh tick.
let currentGreetingPhase = null;
let currentGreetingText = "";

// userName is read once and cached. Demo mode re-renders the greeting 30x ish per
// second, and hitting chrome.storage that often is pure waste.
let cachedUserName = "";

// Smallest the greeting is allowed to shrink to before it just clips.
const GREETING_MIN_FONT_PX = 20;
// Aim a couple of pixels inside the box. Glyph advances are rounded per size,
// so aiming at the exact edge lands a fraction over often enough to matter.
const GREETING_FIT_SLACK_PX = 2;
const GREETING_FIT_MAX_PASSES = 4;
let lastFittedGreeting = null;
let greetingRefitPending = false;

// Get current time as decimal hours (0-24)
function getDecimalHour() {
    if (FIXED_TEST_DECIMAL_HOUR !== null) return FIXED_TEST_DECIMAL_HOUR;
    if (demoMode) return demoHour;

    const now = new Date();
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

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

    if (isFocusMode) {
        $greeting.textContent = `${hours}:${minutesStr}:${secondsStr}`;
        fitGreeting();
    }

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    $date.textContent = now.toLocaleDateString("en-US", options);
}

/** Find the phase covering `hour`, handling the phase that wraps past midnight. */
function getGreetingPhase(hour) {
    return GREETINGS.find(phase => phase.from <= phase.to
        ? hour >= phase.from && hour < phase.to
        : hour >= phase.from || hour < phase.to
    ) ?? null;
}

/**
 * Pick one message from a phase, weighted. Weights are relative, so they are
 * summed and the roll is taken against that total: no need for them to add up to 1.0.
 * Non-positive weights are treated as 0 (never picked).
 */
function pickWeightedMessage(messages) {
    if (!messages || messages.length === 0) return "";

    let total = 0;
    for (const message of messages) {
        total += Math.max(0, message.weight ?? 0);
    }
    // Every weight was 0 or missing: fall back to an even pick.
    if (total <= 0) return messages[Math.floor(Math.random() * messages.length)].text;

    let roll = Math.random() * total;
    for (const message of messages) {
        roll -= Math.max(0, message.weight ?? 0);
        if (roll < 0) return message.text;
    }
    return messages[messages.length - 1].text;
}

/** Drop a {name} placeholder and any punctuation left hanging around it. */
function stripNamePlaceholder(text) {
    return text
    .replace(/\s*,\s*\{name\}/g, "")
    .replace(/\{name\}\s*,\s*/g, "")
    .replace(/\{name\}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Substitute the name at {name}. A message without the placeholder never shows
 * a name, so whether a line is personal is decided in the GREETINGS table rather than here.
 */
function applyGreetingName(text, name) {
    if (!name) return stripNamePlaceholder(text);
    return text.replace(/\{name\}/g, name);
}

function updateGreeting() {
    if (isFocusMode) return;

    const hour = demoMode ? demoHour : getDecimalHour();
    const phase = getGreetingPhase(hour);
    if (!phase) return;

    // Re-roll only on a phase change, so an open tab keeps its message until the time of day actually moves on.
    if (phase !== currentGreetingPhase) {
        currentGreetingPhase = phase;
        currentGreetingText = pickWeightedMessage(phase.messages);
    }

    $greeting.textContent = applyGreetingName(currentGreetingText, cachedUserName);
    fitGreeting();
}

/**
 * Scale the greeting down to fit on one line.
 *
 * The stylesheet's font-size is treated as a maximum: a long phrase plus a long
 * name would otherwise wrap onto a second line and shove the clock down the page.
 *
 * Text width is very nearly linear in font-size, so the ratio of what the text
 * needs to the room it has gets within about a percent immediately. It is not
 * exactly linear (advance widths are rounded at each size), so the result is
 * re-measured and corrected instead of trusted. In practice that is one pass,
 * occasionally three, and it only runs at all when the text actually overflows.
 */
function fitGreeting() {
    if (!$greeting) return;

    const text = $greeting.textContent;
    // updateClock() rewrites this every second in focus mode and demo mode
    // re-renders ~30x/second, so skip the layout read when nothing moved.
    if (!greetingRefitPending && text === lastFittedGreeting) return;
    greetingRefitPending = false;
    lastFittedGreeting = text;

    // Measure at whatever size the live breakpoint asks for, not a hardcoded one.
    $greeting.style.fontSize = "";
    const available = $greeting.clientWidth;
    if (available <= 0 || $greeting.scrollWidth <= available) return;

    const target = available - GREETING_FIT_SLACK_PX;
    let size = parseFloat(getComputedStyle($greeting).fontSize);

    for (let pass = 0; pass < GREETING_FIT_MAX_PASSES; pass++) {
        const needed = $greeting.scrollWidth;
        if (needed <= target) break;

        size = Math.max(GREETING_MIN_FONT_PX, size * (target / needed));
        $greeting.style.fontSize = `${size}px`;
        if (size <= GREETING_MIN_FONT_PX) break;
    }
}

function initGreetingFit() {
    // Debounced to match the stars canvas handler; resizing changes the
    // available width and usually the breakpoint's base size too.
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            greetingRefitPending = true;
            fitGreeting();
        }, 150);
    }, {passive: true});

    // Outfit loads after first paint and is wider than the fallback, so the first measurement is taken against the wrong font.
    document.fonts?.ready.then(() => {
        greetingRefitPending = true;
        fitGreeting();
    }).catch(() => {
    });
}

async function loadUserName() {
    const result = await storage.get(["userName"]);
    cachedUserName = result.userName || "";
    updateGreeting();
}
