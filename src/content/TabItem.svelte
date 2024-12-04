<script>
    export let tab = {};
    let title = "";
    $: title = tab.title.length === 0 ? tab.pendingUrl : tab.title;

    console.log("TabItem", tab);

    function handleTabClick(tabId) {
        chrome.runtime.sendMessage({ action: "activateTab", tabId });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "tab_click",
            label: "tab_operation",
        });
    }

    function closeTab(tabId, event) {
        event.stopPropagation();
        chrome.runtime.sendMessage({ action: "closeTab", tabId });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "tab_close",
            label: "tab_operation",
        });
    }

    function discardTab(tabId, event) {
        event.stopPropagation();
        chrome.runtime.sendMessage({ action: "discardTab", tabId });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "tab_discard",
            label: "tab_operation",
        });
    }
</script>

<li>
    <button
        type="button"
        class="vtab-list-item {tab.discarded || tab.status === 'unloaded'
            ? 'discarded'
            : ''} {tab.active ? 'active' : ''}"
        data-tab-id={tab.id}
        on:click={() => handleTabClick(tab.id)}
        title={title + '\n\n' + tab?.url?.split("?")[0]}
    >
        <img src={tab.favIconUrl} alt="Favicon" />
        <span inert aria-hidden='true'>{title}</span>
        <button class="close-button" on:click={(e) => closeTab(tab.id, e)}
            >X</button
        >
        {#if !tab.discarded && !tab.active && tab.status !== "unloaded"}
            <button
                class="discard-button"
                on:click={(e) => discardTab(tab.id, e)}>❅</button
            >
        {/if}
    </button>
</li>