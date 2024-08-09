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

    // TODO: 待优化
    function togglePin() {
        isPinned = !isPinned;
        // check if the sidebar is pinned
        chrome.runtime.sendMessage(
            { action: "checkSidebarPin" },
            (response) => {
                if (response && response.isSidebarPinned !== undefined) {
                    // console.log('isSidebarPinned response', response)
                    const isPinned = response.isSidebarPinned;
                    // console.log('isPinned: ', isPinned)

                    const pinButton =
                        host.shadowRoot.getElementById("pin-toggle");
                    pinButton.textContent = isPinned ? "📌 Unpin" : "📌 Pin";

                    const sidebar =
                        host.shadowRoot.getElementById("vtab-sidebar");

                    if (isPinned) {
                        sidebar.setAttribute("data-pinned", "true");
                        sidebar.style[
                            settings?.rightSidebar ? "right" : "left"
                        ] = "0";
                        if (settings?.rightSidebar) {
                            document.body.style.width = "calc(100% - 250px)";
                        } else {
                            document.body.style.marginLeft = "250px"; // Adjust body margin to make room for sidebar
                        }
                    } else {
                        sidebar.setAttribute("data-pinned", "false");
                        sidebar.style[
                            settings?.rightSidebar ? "right" : "left"
                        ] = "-240px";
                        if (settings?.rightSidebar) {
                            document.body.style.width = "100%";
                        } else {
                            document.body.style.marginLeft = "0"; // Adjust body margin to make room for sidebar
                        }
                    }
                }
            },
        );
        chrome.runtime.sendMessage({ action: "toggleSidebarPin" });
        chrome.runtime.sendMessage({
            action: "ga",
            event: `toggle_${isPinned ? "Pin" : "Unpin"}`,
            label: "sidebar_operation",
        });
    }
</script>

<div id="operation-area">
    <button on:click={freezeAllTabs}>❅ Freeze All</button>
    <button on:click={addNewTab} style="font-weight: bolder; border: solid;"
        >+</button
    >
    <button id="pin-toggle" on:click={togglePin}>
        📌 {isPinned ? "Unpin" : "Pin"}
    </button>
</div>
