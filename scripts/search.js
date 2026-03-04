// Search bar
function initSearch() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("q");

    if (searchInput) {
        searchInput.focus();
    }

    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const query = searchInput?.value?.trim();
            if (!query) return;

            if (chrome?.search?.query) {
                chrome.search.query({text: query, disposition: "CURRENT_TAB"});
            } else if (typeof browser !== "undefined" && browser?.search?.query) {
                browser.search.query({text: query, disposition: "CURRENT_TAB"});
            } else {
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            }
        });
    }
}
