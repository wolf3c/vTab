<script>
    /* global chrome */
    import { onMount } from "svelte";
    import TabsList from "./TabsList.svelte";
    import OperationArea from "./OperationArea.svelte";
    import Footer from "./Footer.svelte";

    if (chrome.runtime.getManifest().isReleased) {
        console.log = function () {};
    }

    let settings = {};
    let isMouseOver = false;
    let isPinned = false;
    let searchTerm = "";
    let tabs = [];
    let sidebar;

    $: sidebarStyle = {
        [settings?.rightSidebar ? "right" : "left"]: isPinned ? "0" : "-240px",
    };

    $: setPinned(isPinned);

    onMount(() => {
        createHost();
        loadSettings();
        updateTabList();
        // togglePin();
        setTimeout(scrollSidebar, 300);

        chrome.storage.onChanged.addListener(handleStorageChanges);
        chrome.runtime.onMessage.addListener(handleRuntimeMessages);
    });

    function createHost() {
        const host = document.createElement("div");
        host.id = "vtab-host";
        host.className = "vtab-host";
        host.innerHTML = `
<style>
    .vtab-host {
    all: initial;
    }
</style>
`;
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: "open" });
        shadow.innerHTML = `
<style>
    /* 重置 Shadow DOM 内部样式，避免继承外部样式 */
    :host {
        all: initial;
    }

    #sidebar {
        position: fixed;
        top: 0;
        width: 250px;
        height: 100%;
        background-color: #f7f7f7; /* Set light gray background */
        box-shadow: 0px 0 5px 2px rgba(0, 0, 0, 0.2);
        transition: 0.1s linear;
        z-index: 2147483647;
        overflow-y: auto; /* Ensure vertical scrolling if content overflows */
    }
    
    #operation-area {
        position: sticky;
        top: 0;
        z-index: 2147483647;
        background-color: #f7f7f7;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #ccc;
    }
    #operation-area button {
        background-color: transparent;
        border: none;
        cursor: pointer;
    }
    
    #footer {
        position: fixed;
        bottom: 0;
        z-index: 2147483647;
        background-color: #f7f7f7;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-top: 1px solid #ccc;
        width: 230px;
    }
    #footer button {
        background-color: transparent;
        border: none;
        cursor: pointer;
    }

    #search-input {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
    }

    #vtab-list {
        list-style: none;
        padding: 0;
        margin: 0;
        margin-bottom: 50px;
        text-align: left;
    }
    
    .vtab-list-item {
        position: relative;
        display: flex;
        align-items: center;
        padding: 10px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
        margin: 5px 10px;
        font-size: 16px;
        background-color: #f7f7f7;
        border-radius: 5px;
        line-height: 28px;
        border: none;
        width: calc(100% - 20px);
    }

    .vtab-list-item.active {
        background-color: #e0e0e0;
    }

    .vtab-list-item:hover {
        background-color: #e0e0e0;
    }

    .vtab-list-item.discarded {
        img, span {
            opacity: 0.3;
        }
    }

    .vtab-list-item img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
    }

    .vtab-list-item span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .vtab-list-item button {
        position: absolute;
        width: 20px;
        height: 20px;
        cursor: pointer;
        background-color: black;
        color: white;
        border: none;
        border-radius: 50%;
        top: 50%;
        transform: translateY(-50%);
        display: none;
    }

    .vtab-list-item:hover button {
        display: block;
    }

    .close-button {
        right: 8px;
    }
    .discard-button {
        left: 8px;
    }

    @media (prefers-color-scheme: dark) {
        #vtab-sidebar {
            background-color: #333; /* Dark background color */
            color: #f7f7f7; /* Light text color */
        }

        #operation-area, #footer {
            background-color: #333;
            border-color: #444; /* Dark border color */
        }

        #operation-area button, #footer button {
            color: #f7f7f7; /* Light text color for buttons */
        }

        #search-input {
            background-color: #666; /* Dark background color for search input */
            color: #f7f7f7; /* Light text color */
        }

        .vtab-list-item {
            background-color: #444; /* Darker background for list items */
            color: #f7f7f7; /* Light text color */

        }

        .vtab-list-item.active {
            background: #666; /* Darker background for active list items */
        }

        .vtab-list-item:hover {
            background-color: #555; /* Even darker background on hover */
        }

        .vtab-list-item button {
            background-color: white; /* Button background color */
            color: black; /* Button text color */
        }
        .vtab-list-item.discarded {
            img, span {
                opacity: 0.6;
            }
        }
    }
</style>
`;

        const sidebar = document.getElementById("sidebar");
        shadow.appendChild(sidebar);
    }

    function loadSettings() {
        chrome.storage.local.get(
            [
                "vtab_settings_sortUnfreezed",
                "vtab_settings_sortByHost",
                "vtab_settings_rightSidebar",
                "vtab_settings_pinned_windows",
            ],
            (data) => {
                console.log(data);
                settings.sortUnfreezed =
                    data?.vtab_settings_sortUnfreezed || false;
                settings.sortByHost = data?.vtab_settings_sortByHost || false;
                settings.rightSidebar =
                    data?.vtab_settings_rightSidebar || false;
                // if (settings.rightSidebar) setSidebarLocal();
                setSidebarLocal();

                chrome.runtime.sendMessage(
                    { action: "GET_WINDOW_ID" },
                    (response) => {
                        if (response && response.windowId !== undefined) {
                            isPinned =
                                data?.vtab_settings_pinned_windows?.includes(
                                    response.windowId,
                                ) || false;
                        }
                    },
                );
            },
        );
    }

    function handleMouseEnter() {
        isMouseOver = true;
        if (!isPinned) {
            sidebarStyle[settings?.rightSidebar ? "right" : "left"] = "0";
            chrome.runtime.sendMessage({
                action: "ga",
                event: "mouseenter",
                label: "sidebar_operation",
            });
        }
    }

    function handleMouseLeave() {
        isMouseOver = false;
        if (!isPinned) {
            sidebarStyle[settings?.rightSidebar ? "right" : "left"] = "-240px";
            chrome.runtime.sendMessage({
                action: "ga",
                event: "mouseleave",
                label: "sidebar_operation",
            });
        }
    }

    function handleScroll() {
        console.log("handleScroll", isMouseOver, sidebar.scrollTop);
        if (isMouseOver) {
            chrome.runtime.sendMessage({
                action: "scrollSidebar",
                scrollTop: sidebar.scrollTop,
            });
        }
    }

    function updateTabList() {
        chrome.runtime.sendMessage({ action: "GET_WINDOW_ID" }, (response) => {
            if (response && response.windowId !== undefined) {
                chrome.storage.local.get(
                    `tabs_${response.windowId}`,
                    (data) => {
                        tabs = sortTabs(data[`tabs_${response.windowId}`], tabs);
                    },
                );
            } else {
                console.error("无法获取窗口ID");
            }
        });
    }

    function sortTabs(tabs) {
        let activeTabs = [];
        let freezedTabs = [];
        if (settings?.sortUnfreezed) {
            activeTabs = tabs.filter(tab => tab.discarded === false && tab.status !== "unloaded");
            freezedTabs = tabs.filter(tab => tab.discarded === true || tab.status === "unloaded");
        } else {
            activeTabs = tabs;
        }

        if (settings?.sortByHost) {
            activeTabs = sortTabsByHost(activeTabs);
            freezedTabs = sortTabsByHost(freezedTabs);
        }
        return activeTabs.concat(freezedTabs);
    }

    function sortTabsByHost(tabs) {
        const hosts = tabs.map(tab => new URL(tab.url).host);
        const uniqueHosts = [...new Set(hosts)];
        return tabs.sort((a, b) => uniqueHosts.indexOf(new URL(a.url).host) - uniqueHosts.indexOf(new URL(b.url).host));
    }

    function setSidebarLocal() {
        // 设置侧边栏位置的逻辑...
        console.log("setSidebarLocal right");
        const sidebar = host.shadowRoot.getElementById("vtab-sidebar");
        // sidebar.style.removeProperty(settings?.rightSidebar ? "left" : "right");
        sidebar.style[settings?.rightSidebar ? "right" : "left"] = "-240px";
        // sidebar.style.removeProperty("boxShadow");
        sidebar.style.boxShadow = `${settings?.rightSidebar ? "-" : ""}2px 0 5px rgba(0, 0, 0, 0.2)`;
    }

    function setPinned(isPinned) {
        if (isPinned) {
            if (settings?.rightSidebar) {
                document.body.style.width = "calc(100% - 250px)";
            } else {
                document.body.style.marginLeft = "250px"; // Adjust body margin to make room for sidebar
            }
        } else {
            if (settings?.rightSidebar) {
                document.body.style.width = "100%";
            } else {
                document.body.style.marginLeft = "0"; // Adjust body margin to make room for sidebar
            }
        }
    }

    function scrollSidebar(scrollTop = null) {
        // 滚动侧边栏的逻辑...
        console.log("scrollSidebar", scrollTop);
        if (!scrollTop) {
            chrome.runtime.sendMessage(
                { action: "returnScrollTopValue" },
                (response) => {
                    if (response.scrollTop) scrollSidebar(response.scrollTop);
                },
            );
        } else {
            sidebar.scrollTo(0, scrollTop);
        }
    }

    function handleStorageChanges(changes, namespace) {
        // 处理存储变化的逻辑...
        // 向后台脚本发送消息以获取当前窗口 ID
        console.log("chrome.storage.onChanged: ", changes);

        if (changes.vtab_settings_sortUnfreezed) {
            settings.sortUnfreezed =
                changes.vtab_settings_sortUnfreezed.newValue;
            updateTabList();
        }
        if (changes.vtab_settings_sortByHost) {
            settings.sortByHost = changes.vtab_settings_sortByHost.newValue;
            updateTabList();
        }
        if (changes.vtab_settings_rightSidebar) {
            settings.rightSidebar = changes.vtab_settings_rightSidebar.newValue;
            console.log(
                "vtab_settings_rightSidebar changed",
                settings.rightSidebar,
            );
            setSidebarLocal();
        }
        chrome.runtime.sendMessage({ action: "GET_WINDOW_ID" }, (response) => {
            if (response && response.windowId !== undefined) {
                console.log("当前窗口的ID是：", response.windowId);
                // 你可以在这里执行其他操作
                if (changes["tabs_" + response.windowId]) {
                    updateTabList();
                }
                if (changes.vtab_settings_pinned_windows) {
                    // console.log('isSidebarPinned changed');
                    isPinned =
                        changes.vtab_settings_pinned_windows.newValue.includes(
                            response.windowId,
                        )
                            ? true
                            : false;
                }
                if (changes.vtab_settings_scrollSidebar) {
                    const scroll =
                        changes.vtab_settings_scrollSidebar.newValue?.find(
                            (scroll) => scroll?.windowId === response.windowId,
                        );

                    if (scroll?.tabId !== response.tabId) {
                        console.log("scrollSidebar changed", scroll?.scrollTop);
                        scrollSidebar(scroll?.scrollTop);
                    }
                }
            } else {
                console.error("无法获取窗口ID");
            }
        });
    }

    function handleRuntimeMessages(request, sender, sendResponse) {
        // 处理运行时消息的逻辑...
        console.log("Received message:", request);
        if (request.action === "scrollSidebar") {
            console.log("Received scrollSidebar message:", request);
            chrome.runtime.sendMessage(
                { action: "GET_WINDOW_ID" },
                (response) => {
                    // console.log('Received GET_WINDOW_ID response:', response);
                    if (response && response.windowId !== undefined) {
                        if (sender.tab.windowId === response.windowId) {
                            const sidebar =
                                host.shadowRoot.getElementById("vtab-sidebar");
                            if (sidebar) {
                                sidebar.scrollTo(0, request.scrollTop);
                            }
                        }
                    }
                },
            );
        }
    }
</script>

<div
    id="sidebar"
    bind:this={sidebar}
    style={Object.entries(sidebarStyle)
        .map(([key, value]) => `${key}: ${value}`)
        .join(";")}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:scroll={handleScroll}
    role="navigation"
    data-pinned={isPinned}
>
    <OperationArea bind:isPinned />

    <input
        id="search-input"
        type="text"
        placeholder="Search tabs..."
        bind:value={searchTerm}
        on:focus={() =>
            chrome.runtime.sendMessage({
                action: "ga",
                event: "search",
                label: "sidebar_operation",
            })}
    />

    <TabsList {tabs} {searchTerm} />

    <Footer />
</div>
