async function initScheduler() {
    const container = document.getElementById("scheduler-container");
    if (!container) return;

    const iframe = container.querySelector("iframe");
    const result = await storage.get(["showScheduler", "schedulerId"]);

    if (result.showScheduler === true || result.showScheduler === "true") {
        const schedulerId = result.schedulerId || "";
        iframe.src = `${SCHEDULER_URL_PREFIX}/scheduler?homeisland=true&id=${encodeURIComponent(schedulerId)}`;
        container.classList.remove("hidden");
    }
}
