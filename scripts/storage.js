// Storage helper, unified API for Chrome, Firefox, and fallback
const storage = {
    get: keys => new Promise(resolve => {
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.get(keys, resolve);
        } else if (typeof browser !== "undefined" && browser.storage) {
            browser.storage.local.get(keys).then(resolve);
        } else {
            const result = {};
            keys.forEach(k => {
                const v = localStorage.getItem(k);
                if (v === "true") result[k] = true;
                else if (v === "false") result[k] = false;
                else result[k] = v;
            });
            resolve(result);
        }
    }),
    set: data => new Promise(resolve => {
        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.local.set(data, resolve);
        } else if (typeof browser !== "undefined" && browser.storage) {
            browser.storage.local.set(data).then(resolve);
        } else {
            Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, String(v)));
            resolve();
        }
    })
};