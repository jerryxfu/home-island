const ICON_UP = '<svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 4L4 1L7 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_DOWN = '<svg width="8" height="5" viewBox="0 0 8 5"><path d="M1 1L4 4L7 1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const $dynamicBackground = document.getElementById("dynamic-background");
let demoHour = 0;
let demoIntervalId = null;
let realtimeThemeIntervalId = null;
const demoUpdatesPerSecond = 30;
const demoHoursPerUpdate = 0.04;

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

// Storage helper
const storage = {
    get: keys => new Promise(resolve => {
        if (chrome?.storage) chrome.storage.local.get(keys, resolve);
        else if (browser?.storage) browser.storage.local.get(keys).then(resolve);
        else {
            const result = {};
            keys.forEach(k => result[k] = localStorage.getItem(k));
            resolve(result);
        }
    }),
    set: data => new Promise(resolve => {
        if (chrome?.storage) chrome.storage.local.set(data, resolve);
        else if (browser?.storage) browser.storage.local.set(data).then(resolve);
        else {
            Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, String(v)));
            resolve();
        }
    })
};

// Load settings
async function loadSettings() {
    const result = await storage.get(["userName", "demoMode", "autoUndockDelay", "showScheduler", "schedulerId", "shortcuts"]);

    if (result.userName) document.getElementById("userName").value = result.userName;
    if (result.demoMode === true || result.demoMode === "true") document.getElementById("demoToggle").checked = true;
    if (result.autoUndockDelay) document.getElementById("autoUndock").value = result.autoUndockDelay;
    if (result.showScheduler === true || result.showScheduler === "true") {
        document.getElementById("schedulerToggle").checked = true;
        document.getElementById("schedulerIdGroup").style.display = "block";
    }
    if (result.schedulerId) document.getElementById("schedulerId").value = result.schedulerId;

    renderShortcuts(result.shortcuts ? JSON.parse(result.shortcuts) : DEFAULT_SHORTCUTS);
}

function getDecimalHourNow() {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

function getCurrentThemeHour() {
    return isDemoModeEnabled() ? demoHour : getDecimalHourNow();
}

// Used by stars.js when deciding whether stars should run
function getDecimalHour() {
    return getCurrentThemeHour();
}

function isDemoModeEnabled() {
    return document.getElementById("demoToggle").checked;
}

function applyThemeForHour(hour) {
    if (!$dynamicBackground || !window.HomeIslandTheme) return;

    const snapshot = window.HomeIslandTheme.getThemeSnapshot(hour);
    $dynamicBackground.style.background = snapshot.gradient;
    window.HomeIslandTheme.applyTextModeClass(hour);

    // Keep stars in sync with the same day/night curve used on the main page
    if (typeof starsOpacity !== "undefined") {
        starsOpacity = snapshot.starOpacity;
        if (starsOpacity > 0 && typeof startStarsLoop === "function") {
            startStarsLoop();
        } else if (typeof stopStarsLoop === "function") {
            stopStarsLoop();
        }
    }
}

function updateOptionsTheme() {
    applyThemeForHour(getCurrentThemeHour());
}

function stopDemoThemeLoop() {
    if (demoIntervalId) {
        clearInterval(demoIntervalId);
        demoIntervalId = null;
    }
}

function stopRealtimeThemeLoop() {
    if (realtimeThemeIntervalId) {
        clearInterval(realtimeThemeIntervalId);
        realtimeThemeIntervalId = null;
    }
}

function startDemoThemeLoop() {
    stopRealtimeThemeLoop();
    stopDemoThemeLoop();

    demoHour = getDecimalHourNow();
    applyThemeForHour(demoHour);

    demoIntervalId = setInterval(() => {
        if (!isDemoModeEnabled()) return;
        demoHour += demoHoursPerUpdate;
        if (demoHour >= 24) demoHour = 0;
        applyThemeForHour(demoHour);
    }, 1000 / demoUpdatesPerSecond);
}

function startRealtimeThemeLoop() {
    stopDemoThemeLoop();
    stopRealtimeThemeLoop();

    updateOptionsTheme();
    realtimeThemeIntervalId = setInterval(updateOptionsTheme, 30000);
}

function syncThemeLoopMode() {
    if (isDemoModeEnabled()) {
        startDemoThemeLoop();
    } else {
        startRealtimeThemeLoop();
    }
}

// Render shortcuts list
function renderShortcuts(shortcuts) {
    const container = document.getElementById("shortcutList");
    container.innerHTML = "";

    shortcuts.forEach((s, i) => {
        const item = document.createElement("div");
        item.className = "shortcut-item";

        // Reorder buttons
        const reorderDiv = document.createElement("div");
        reorderDiv.className = "reorder-btns";

        const btnUp = document.createElement("button");
        btnUp.type = "button";
        btnUp.className = "btn-reorder btn-up";
        btnUp.dataset.index = i;
        btnUp.title = "Move up";
        btnUp.disabled = i === 0;
        btnUp.appendChild(new DOMParser().parseFromString(ICON_UP, "image/svg+xml").documentElement);
        btnUp.addEventListener("click", () => moveShortcut(i, -1));

        const btnDown = document.createElement("button");
        btnDown.type = "button";
        btnDown.className = "btn-reorder btn-down";
        btnDown.dataset.index = i;
        btnDown.title = "Move down";
        btnDown.disabled = i === shortcuts.length - 1;
        btnDown.appendChild(new DOMParser().parseFromString(ICON_DOWN, "image/svg+xml").documentElement);
        btnDown.addEventListener("click", () => moveShortcut(i, 1));

        reorderDiv.appendChild(btnUp);
        reorderDiv.appendChild(btnDown);

        // Input fields
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "shortcut-name";
        nameInput.value = s.name;
        nameInput.placeholder = "Name";
        nameInput.maxLength = 20;
        nameInput.addEventListener("input", saveShortcuts);

        const urlInput = document.createElement("input");
        urlInput.type = "text";
        urlInput.className = "shortcut-url";
        urlInput.value = s.url;
        urlInput.placeholder = "URL";
        urlInput.addEventListener("input", saveShortcuts);

        const faviconInput = document.createElement("input");
        faviconInput.type = "text";
        faviconInput.className = "shortcut-favicon";
        faviconInput.value = s.favicon || "";
        faviconInput.placeholder = "Favicon (optional)";
        faviconInput.addEventListener("input", saveShortcuts);

        // Remove button
        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.className = "btn-remove";
        btnRemove.dataset.index = i;
        btnRemove.title = "Remove";
        btnRemove.textContent = "×";
        btnRemove.addEventListener("click", () => removeShortcut(i));

        item.appendChild(reorderDiv);
        item.appendChild(nameInput);
        item.appendChild(urlInput);
        item.appendChild(faviconInput);
        item.appendChild(btnRemove);

        container.appendChild(item);
    });
}


// Get current shortcuts from form
function getShortcutsFromForm() {
    return [...document.querySelectorAll(".shortcut-item")].map(item => ({
        name: item.querySelector(".shortcut-name").value.trim(),
        url: item.querySelector(".shortcut-url").value.trim(),
        favicon: item.querySelector(".shortcut-favicon").value.trim()
    })).filter(s => s.name && s.url);
}

// Save shortcuts
async function saveShortcuts() {
    await storage.set({shortcuts: JSON.stringify(getShortcutsFromForm())});
    showStatus("Saved!");
}

// Add new shortcut
function addShortcut() {
    const shortcuts = getShortcutsFromForm();
    shortcuts.push({name: "", url: "", favicon: ""});
    renderShortcuts(shortcuts);
    document.querySelectorAll(".shortcut-name").item(shortcuts.length - 1)?.focus();
}

// Remove shortcut
async function removeShortcut(index) {
    const shortcuts = getShortcutsFromForm();
    shortcuts.splice(index, 1);
    renderShortcuts(shortcuts);
    await storage.set({shortcuts: JSON.stringify(shortcuts)});
    showStatus("Saved!");
}

// Move shortcut up or down
async function moveShortcut(index, direction) {
    const shortcuts = getShortcutsFromForm();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= shortcuts.length) return;
    [shortcuts[index], shortcuts[newIndex]] = [shortcuts[newIndex], shortcuts[index]];
    renderShortcuts(shortcuts);
    await storage.set({shortcuts: JSON.stringify(shortcuts)});
    showStatus("Saved!");
}

// Reset shortcuts to default
async function resetShortcuts() {
    renderShortcuts(DEFAULT_SHORTCUTS);
    await storage.set({shortcuts: JSON.stringify(DEFAULT_SHORTCUTS)});
    showStatus("Reset to defaults!");
}

// Save settings
async function saveSettings() {
    const userName = document.getElementById("userName").value.trim();
    const demoMode = document.getElementById("demoToggle").checked;
    const autoUndockDelay = document.getElementById("autoUndock").value;
    const showScheduler = document.getElementById("schedulerToggle").checked;
    const schedulerId = document.getElementById("schedulerId").value.trim();

    // Show/hide scheduler ID field based on toggle
    document.getElementById("schedulerIdGroup").style.display = showScheduler ? "block" : "none";

    await storage.set({userName, demoMode, autoUndockDelay, showScheduler, schedulerId});
    showStatus("Saved!");
}

// Show status message
function showStatus(message) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.classList.add("show", "success");
    setTimeout(() => status.classList.remove("show"), 2000);
}

// Event listeners - auto save on change
document.getElementById("userName").addEventListener("input", saveSettings);
document.getElementById("demoToggle").addEventListener("change", saveSettings);
document.getElementById("demoToggle").addEventListener("change", syncThemeLoopMode);
document.getElementById("autoUndock").addEventListener("change", saveSettings);
document.getElementById("schedulerToggle").addEventListener("change", saveSettings);
document.getElementById("schedulerId").addEventListener("input", saveSettings);
document.getElementById("addShortcut").addEventListener("click", addShortcut);
document.getElementById("resetShortcuts").addEventListener("click", resetShortcuts);

// Load on page load
if (typeof createStars === "function") {
    createStars();
}

requestAnimationFrame(() => {
    document.body.classList.add("transitions-ready");
});

loadSettings()
.then(syncThemeLoopMode)
.catch(error => console.error("Error loading settings:", error));

// Show Chrome footer notice only on Chrome (not Firefox or other browsers)
if (typeof browser === "undefined" && typeof chrome !== "undefined" && chrome.storage) {
    document.getElementById("chromeNotice").classList.add("visible");
}
