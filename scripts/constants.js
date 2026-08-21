const SCHEDULER_URL_PREFIX = "https://jerryxf.net";
// const SCHEDULER_URL_PREFIX = "http://localhost:5173";

// Greeting messages grouped by time-of-day phase.
// Each phase covers [from, to) in local 24h time. A phase where `to` is less
// than `from` wraps past midnight (the night phase below).
//
// Weights are relative, not percentages, and do not need to add up to 1.0:
// they are normalised at pick time. Think of 1 as "the usual line" and 0.1 as "turns up now and then".
//
// Use {name} to place the user's name inside a message.
// When no name is set, the placeholder and its surrounding punctuation are stripped,
// so every message must still read correctly without it ("Still up, {name}?" -> "Still up?").
const GREETINGS = [
    {
        from: 5, to: 7,
        messages: [
            {text: "Early bird, {name}", weight: 1},
            {text: "Up before the sun", weight: 0.2},
            {text: "You're up early, {name}", weight: 0.15},
        ]
    },
    {
        from: 7, to: 12,
        messages: [
            {text: "Good morning, {name}", weight: 1},
            {text: "Morning, {name}", weight: 0.15},
            {text: "Rise and shine", weight: 0.1},
        ]
    },
    {
        from: 12, to: 17,
        messages: [
            {text: "Good afternoon, {name}", weight: 1},
            {text: "Afternoon, {name}", weight: 0.15},
            {text: "Halfway there, {name}", weight: 0.1},
        ]
    },
    {
        from: 17, to: 22,
        messages: [
            {text: "Good evening, {name}", weight: 1},
            {text: "Evening, {name}", weight: 0.15},
            {text: "Winding down", weight: 0.1},
        ]
    },
    {
        // Wraps past midnight
        from: 22, to: 5,
        messages: [
            {text: "Good night, {name}", weight: 1},
            {text: "Still up, {name}?", weight: 0.15},
            {text: "Burning the midnight oil", weight: 0.1},
        ]
    },
];

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
