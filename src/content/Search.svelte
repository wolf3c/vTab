<script>
    import { onMount } from "svelte";

    export let windowId;
    export let searchTerm;
    export let tabGroupSelectedId;

    let isSearchFocused = false;
    let isComponentFocused = false;

    let tabGroups = [];
    onMount(async () => {
        console.log("search svelte", windowId);
        chrome.storage.local.get("tabGroups", (data) => {
            console.log("tabGroups data:", data);
            if (data.tabGroups) {
                tabGroups = data.tabGroups;
                console.log("tabGroups:", tabGroups);
            }
        });

        chrome.storage.onChanged.addListener((changes) => {
            if (changes?.tabGroups) {
                tabGroups = changes?.tabGroups.newValue;
                console.log("tabGroups onchanged:", tabGroups);
            }
        });
    });

    function groupSelect(id) {
        tabGroupSelectedId = tabGroupSelectedId === id ? -1 : id;
        chrome.runtime.sendMessage({
            action: "ga",
            event: "tabGroupsFilterClick",
            label: "",
        });
    }
</script>

<div
    id="search-input"
    on:mouseenter={() => (isComponentFocused = true)}
    on:mouseleave={() => (isComponentFocused = false)}
>
    <input
        type="text"
        placeholder="Search tabs..."
        bind:value={searchTerm}
        on:focus={() => {
            isSearchFocused = true;
            chrome.runtime.sendMessage({
                action: "ga",
                event: "search",
                label: "sidebar_operation",
            });
        }}
        on:blur={() => {
            isSearchFocused = false;
        }}
    />

    {#if isComponentFocused || isSearchFocused || searchTerm?.length || tabGroupSelectedId > 0}
        <div>
            {#each tabGroups.filter((g) => g.windowId === windowId) as g (g.id)}
                <button
                    class="search-tabGroups-filters {tabGroupSelectedId === g.id
                        ? 'active'
                        : ''}"
                    style="border-color: {g.color};"
                    on:click={() => groupSelect(g.id)}>{g.title}</button
                >
            {/each}
        </div>
    {/if}
</div>
