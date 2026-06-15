// Search bar
function initSearch() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("q");

    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const query = searchInput?.value?.trim();
            if (!query) return;

            // Chrome & Firefox expose the search API, which respects the
            // user's real default engine. Safari does NOT implement
            // browser.search, so it falls through to the URL fallback below.
            if (typeof chrome !== "undefined" && chrome.search?.query) {
                chrome.search.query({text: query, disposition: "CURRENT_TAB"});
            } else if (typeof browser !== "undefined" && browser.search?.query) {
                browser.search.query({text: query, disposition: "CURRENT_TAB"});
            } else {
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            }
        });
    }
}