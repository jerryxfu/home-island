function getFaviconUrl(url, customFavicon) {
    if (customFavicon && customFavicon.trim()) {
        return customFavicon.trim();
    }
    try {
        const urlObj = new URL(url);
        return `https://favicon.im/${urlObj.host}`;
    } catch {
        return `https://favicon.im/${url}`;
    }
}

function renderShortcuts(shortcuts) {
    const container = document.getElementById("quick-links");
    if (!container) return;

    const fragment = document.createDocumentFragment();

    shortcuts.forEach(shortcut => {
        if (!shortcut.name || !shortcut.url) return;

        const link = document.createElement("a");
        link.href = shortcut.url;
        link.className = "quick-link";

        const faviconUrl = getFaviconUrl(shortcut.url, shortcut.favicon);

        const iconSpan = document.createElement("span");
        iconSpan.className = "quick-link-icon";
        const img = document.createElement("img");
        img.src = faviconUrl;
        img.alt = `${shortcut.name} icon`;
        img.className = "quick-link-favicon";
        img.loading = "lazy";
        iconSpan.appendChild(img);

        const textSpan = document.createElement("span");
        textSpan.className = "quick-link-text";
        textSpan.textContent = shortcut.name;

        link.appendChild(iconSpan);
        link.appendChild(textSpan);
        fragment.appendChild(link);
    });

    container.innerHTML = "";
    container.appendChild(fragment);
}

async function loadShortcuts() {
    const result = await storage.get(["shortcuts"]);
    const shortcuts = result.shortcuts ? JSON.parse(result.shortcuts) : DEFAULT_SHORTCUTS;
    renderShortcuts(shortcuts);
}
