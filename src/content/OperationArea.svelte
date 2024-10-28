<script>
    export let isPinned = false;

    function freezeAllTabs() {
        chrome.runtime.sendMessage({ action: "freezeWindowAllTabs" });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "freezeAll",
            label: "tab_operation",
        });
    }

    function addNewTab() {
        chrome.runtime.sendMessage({ action: "addNewTab", url: "" });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "tab_new",
            label: "tab_operation",
        });
    }

    function togglePin() {
        isPinned = !isPinned;
        chrome.runtime.sendMessage({ action: "toggleSidebarPin" });
        chrome.runtime.sendMessage({
            action: "ga",
            event: `toggle_${isPinned ? "Pin" : "Unpin"}`,
            label: "sidebar_operation",
        });
    }
</script>

<div id="operation-area">
    <button on:click={freezeAllTabs}><span inert aria-hidden='true'>❅ Freeze All</span></button>
    <button on:click={addNewTab} style="font-weight: bolder; border: solid;"
        ><span inert aria-hidden='true'>+</span></button
    >
    <button id="pin-toggle" on:click={togglePin}>
        <span inert aria-hidden='true'>📌 {isPinned ? "Unpin" : "Pin"}</span>
    </button>
</div>
