<script>
    /* global chrome */
    import { onMount } from "svelte";
    import TabsList from "./TabsList.svelte";
    import OperationArea from "./OperationArea.svelte";
    import Footer from "./Footer.svelte";
    import Feedback from "./Feedback.svelte";

    if (chrome.runtime.getManifest().isReleased) {
        console.log = function () {};
    }

    let settings = {};
    let isMouseOver = false;
    let isPinned = false;
    let searchTerm = "";
    let sidebar;
    let windowId = null;
    let isFeedbackAlert = false;

    $: sidebarStyle = {
        [settings?.rightSidebar ? "right" : "left"]: isPinned ? "0" : "-240px",
    };

    $: setPinned(isPinned);

    onMount(async () => {
        try {
            getWindowId();
            createHost();
            loadSettings();
            setTimeout(() => {
                scrollSidebar();
            }, 300);

            chrome.storage.onChanged.addListener(handleStorageChanges);
        } catch (error) {
            console.error("onMount error", error);
        }
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
    #vtab-sidebar {
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
    
    #vtab-feedback {
        background-color: black;
        border: none;
        padding: 5px;
    }
    #vtab-feedback-button {
        background-color: transparent;
        color: white;
        padding: 5px;
        border: none;
        font-weight: bold;
        text-decoration: underline;
        width: calc(100% - 31px);
        cursor: pointer;
    }
    #vtab-feedback-close {
        width: 22px;
        height: 22px;
        font-size: 10px;
        cursor: pointer;
        background-color: transparent;
        color: white;
        font-weight: 900;
        border-color: white;
        border-radius: 50%;
        border-style: solid;
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

        shadow.appendChild(sidebar);
    }

    function getWindowId() {
        chrome.runtime.sendMessage({ action: "GET_WINDOW_ID" }, (response) => {
            if (response && response.windowId !== undefined) {
                windowId = response.windowId;
                console.log("windowId", windowId);
            } else {
                setTimeout(() => {
                    getWindowId();
                }, 200);
            }
        });
    }

    function loadSettings() {
        chrome.storage.local.get(
            [
                "vtab_settings_sortUnfreezed",
                "vtab_settings_sortByHost",
                "vtab_settings_rightSidebar",
                "vtab_settings_pinned_windows",
                "vtab_installed_at",
                "vtab_feedback_alerted_times",
            ],
            (data) => {
                console.log(data);
                settings.sortUnfreezed =
                    data?.vtab_settings_sortUnfreezed || false;
                settings.sortByHost = data?.vtab_settings_sortByHost || false;
                settings.rightSidebar =
                    data?.vtab_settings_rightSidebar || false;
                settings.feedbackAlertedTimes =
                    data?.vtab_feedback_alerted_times || 0;
                settings.installedAt = data?.vtab_installed_at || null;

                try {
                    setSidebarLocal();
                } catch (error) {
                    console.error("setSidebarLocal error", error);
                }

                try {
                    setFeedbackAlert(
                        settings.feedbackAlertedTimes,
                        settings.installedAt,
                    );
                } catch (error) {
                    console.error("setPinned error", error);
                }

                console.log("settings", settings);
                // isPinned = data?.vtab_settings_pinned_windows?.includes(windowId);

                chrome.runtime.sendMessage(
                    { action: "GET_WINDOW_ID" },
                    (response) => {
                        console.log("response", response);
                        if (response && response.windowId !== undefined) {
                            isPinned =
                                data?.vtab_settings_pinned_windows?.includes(
                                    response.windowId,
                                );
                            console.log("isPinned", isPinned);
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

    function setSidebarLocal() {
        // 设置侧边栏位置的逻辑...
        console.log("setSidebarLocal right");
        sidebar.style[settings?.rightSidebar ? "right" : "left"] = "-240px";
        sidebar.style.boxShadow = `${settings?.rightSidebar ? "-" : ""}2px 0 5px rgba(0, 0, 0, 0.2)`;

        try {
            setPinned(isPinned);
        } catch (error) {
            console.error("setPinned error", error);
        }
    }

    function setPinned(isPinned) {
        if (isPinned) {
            document.body.style.width = "calc(100% - 250px)";

            if (settings?.rightSidebar) {
                document.body.style.marginLeft = "0";
            } else {
                document.body.style.marginLeft = "250px"; // Adjust body margin to make room for sidebar
            }
        } else {
            document.body.style.width = "100%";
            document.body.style.marginLeft = "0"; // Adjust body margin to make room for sidebar
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
        return;
    }

    function setFeedbackAlert(alertTimes, installedAt) {
        const ONE_DAY = 1000 * 60 * 60 * 24;
        if (
            installedAt &&
            Date.now() - installedAt > ONE_DAY * (2 ** alertTimes - 1)
        ) {
            isFeedbackAlert = true;
        } else {
            isFeedbackAlert = false;
        }
    }
    function handleStorageChanges(changes, namespace) {
        // 处理存储变化的逻辑...
        // 向后台脚本发送消息以获取当前窗口 ID
        console.log("chrome.storage.onChanged: ", changes);

        if (changes?.vtab_settings_sortUnfreezed) {
            settings.sortUnfreezed =
                changes.vtab_settings_sortUnfreezed.newValue;
        }
        if (changes?.vtab_settings_sortByHost) {
            settings.sortByHost = changes.vtab_settings_sortByHost.newValue;
        }
        if (changes?.vtab_settings_rightSidebar) {
            settings.rightSidebar = changes.vtab_settings_rightSidebar.newValue;
            try {
                setSidebarLocal();
            } catch (error) {
                console.error("setSidebarLocal error", error);
            }
        }

        if (changes?.vtab_settings_pinned_windows) {
            isPinned =
                changes.vtab_settings_pinned_windows.newValue.includes(
                    windowId,
                );
        }
        if (changes?.vtab_settings_scrollSidebar) {
            const scroll = changes.vtab_settings_scrollSidebar.newValue?.find(
                (scroll) => scroll?.windowId === windowId,
            );
        }
        if (changes?.vtab_feedback_alerted_times) {
            settings.feedbackAlertedTimes =
                changes.vtab_feedback_alerted_times.newValue;
            setFeedbackAlert(
                settings.feedbackAlertedTimes,
                settings.installedAt,
            );
        }

        chrome.runtime.sendMessage({ action: "GET_WINDOW_ID" }, (response) => {
            if (response && response.windowId !== undefined) {
                console.log("当前窗口的ID是：", response.windowId);
                // 你可以在这里执行其他操作
                // if (changes.vtab_settings_pinned_windows) {
                //     // console.log('isSidebarPinned changed');
                //     isPinned =
                //         changes.vtab_settings_pinned_windows.newValue.includes(
                //             response.windowId,
                //         );
                //     console.log("isPinned changed", isPinned);
                // }
                if (changes?.vtab_settings_scrollSidebar) {
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
</script>

<div
    id="vtab-sidebar"
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

    {#if isFeedbackAlert}
        <Feedback />
    {/if}

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

    {#if windowId}
        <TabsList {searchTerm} {windowId} />
    {/if}

    <Footer />
</div>
