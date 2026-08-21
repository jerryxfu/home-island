async function initScheduler() {
    const container = document.getElementById("scheduler-container");
    if (!container) return;

    const iframe = container.querySelector("iframe");
    const result = await storage.get(["showScheduler", "schedulerId"]);

    const enabled = result.showScheduler === true || result.showScheduler === "true";
    const schedulerId = (result.schedulerId || "").trim();

    // Without an ID the viewer renders nothing, so showing the panel would just leave an empty glass rectangle on the page.
    if (!enabled || !schedulerId) return;

    iframe.src = `${SCHEDULER_URL_PREFIX}/scheduler?homeisland=true&id=${encodeURIComponent(schedulerId)}`;
    container.classList.remove("hidden");
}
