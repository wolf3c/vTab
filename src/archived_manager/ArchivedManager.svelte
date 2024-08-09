<script>
    import { onMount } from "svelte";
    // import { chrome } from "$lib/chrome";

    let tabs = [];
    let searchQuery = "";
    let title = "Archived Tabs Manager";

    onMount(() => {
        loadTabs();
        chrome.runtime.sendMessage({
            action: "ga",
            event: "show",
            label: "archived_manager",
        });
        chrome.storage.onChanged.addListener(handleStorageChange);
        // return () => {
        //     chrome.storage.onChanged.removeListener(handleStorageChange);
        // };
    });

    async function loadTabs() {
        const data = await chrome.storage.local.get("vtab_archivedTabs");
        chrome.storage.local.get("vtab_archivedTabs", (data) => {
            console.log("data", data);
        });
        tabs = data?.vtab_archivedTabs || [];
        tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
        updateTitle();
    }

    function updateTitle() {
        title = `Archived Tabs Manager (${tabs.length})`;
    }

    function handleStorageChange(changes, namespace) {
        console.log("changes", changes);
        if (changes["vtab_archivedTabs"]) {
            tabs = changes["vtab_archivedTabs"].newValue;
            updateTitle();
        }
    }

    function openTab(url) {
        window.open(url, "_blank");
        chrome.runtime.sendMessage({
            action: "ga",
            event: "open_tab",
            label: "archived_manager",
        });
        chrome.runtime.sendMessage({ action: "removeArchivedTab", tabId });
    }

    function removeTab(tabId) {
        if (confirm("确定要移除吗?")) {
            chrome.runtime.sendMessage({ action: "removeArchivedTab", tabId });
            console.log("已移除归档标签:", tabId);
            chrome.runtime.sendMessage({
                action: "ga",
                event: "remove_tab",
                label: "archived_manager",
            });
        }
    }

    $: filteredTabs = tabs.filter((tab) =>
        tab.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
</script>

<h1>{title}</h1>
<input id="searchBox" type="text" bind:value={searchQuery} placeholder="搜索..." />
<ul>
    {#each filteredTabs as tab (tab.id)}
        <li data-tab-id={tab.id}>
            <img src={tab.favIconUrl} alt="favicon" width="16" height="16" />
            <button class="title" on:click={() => openTab(tab.url)}
                >{tab.title}</button
            >
            <button class="close-button" on:click={() => removeTab(tab.id)}
                >X</button
            >
        </li>
    {/each}
</ul>

<style>
    #searchBox {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        box-sizing: border-box;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        position: relative;
        padding: 10px;
        border-bottom: 1px solid #ddd;
        display: flex;
        align-items: center;
    }

    li img {
        margin-right: 10px;
    }

    .title {
        font-weight: bold;
        color: blue;
        cursor: pointer;
        font-size: 1.2em;
        background: none;
        border: none;
        padding: 0;
        text-align: left;
    }

    li:hover button {
        display: block;
    }
    button {
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

    .close-button {
        right: 8px;
    }
</style>