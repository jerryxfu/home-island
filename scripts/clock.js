// Time, date, and greeting
// Cached DOM references (set by init)
let $background = null;
let $clock = null;
let $date = null;
let $greeting = null;

// Get current time as decimal hours (0-24)
function getDecimalHour() {
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
    }

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    $date.textContent = now.toLocaleDateString("en-US", options);
}

async function updateGreeting() {
    if (isFocusMode) return;

    const hour = demoMode ? Math.floor(demoHour) : new Date().getHours();

    let greeting;

    if (hour >= 5 && hour < 7) {
        greeting = "Early Bird";
    } else if (hour >= 7 && hour < 12) {
        greeting = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening";
    } else {
        greeting = "Good Night";
    }

    const result = await storage.get(["userName"]);
    $greeting.textContent = result.userName ? `${greeting}, ${result.userName}` : greeting;
}
