// Applies the correct day/night class BEFORE first paint to prevent a
// light -> dark flash on load. Runs synchronously from <head>, so it must be
// self-contained (cannot depend on theme.js, which loads later).
//
// NOTE: the dark-time threshold here MUST stay in sync with theme.js
// (applyTextModeClass / getThemeSnapshot). If you change it in one place,
// change it in both.
(function () {
    var now = new Date();
    var hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    var isDarkTime = hour >= 19 || hour < 5;
    var root = document.documentElement;
    root.classList.toggle("dark-mode", isDarkTime);
    root.classList.toggle("light-mode", !isDarkTime);
})();