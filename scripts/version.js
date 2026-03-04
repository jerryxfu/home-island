// Show the version number in the footer
function loadVersion() {
    const versionSpan = document.getElementById("version");
    if (!versionSpan) return;

    if (chrome?.runtime?.getManifest) {
        const manifest = chrome.runtime.getManifest();
        versionSpan.textContent = `v${manifest.version}`;
    } else if (typeof browser !== "undefined" && browser?.runtime?.getManifest) {
        const manifest = browser.runtime.getManifest();
        versionSpan.textContent = `v${manifest.version}`;
    } else {
        fetch("manifest.json")
            .then(res => res.json())
            .then(manifest => {
                versionSpan.textContent = `v${manifest.version}`;
            })
            .catch(() => {
                versionSpan.textContent = "";
            });
    }
}
