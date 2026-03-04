// Set text color immediately to prevent flash on load
(function () {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    const isDarkTime = hour >= 19 || hour < 6;
    document.documentElement.classList.add(isDarkTime ? 'dark-mode' : 'light-mode');
})();