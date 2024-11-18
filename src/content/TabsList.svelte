<script>
    import { onMount } from "svelte";
    import TabItem from "./TabItem.svelte";

    let tabs = [];
    export let windowId = null;
    export let searchTerm = "";
    export let tabGroupSelectedId = -1;

    let tabsFilterResult = [];
    $: tabsFilterResult = tabs
        ?.filter((tab) =>
            tab?.title?.toLowerCase()?.includes(searchTerm.toLowerCase()),
        )
        ?.filter( t => tabGroupSelectedId > 0 ? t.groupId === tabGroupSelectedId : true);

    onMount(() => {
        try {
            updateTabList();
            chrome.storage.local.onChanged.addListener(handleStorageChanges);
        } catch (error) {
            console.error("onMount error", error);
        }
    });

    function updateTabList() {
        console.log("updateTabList", windowId);
        chrome.storage.local.get(`tabs_${windowId}`, (data) => {
            tabs = data[`tabs_${windowId}`];
        });
    }

    function handleStorageChanges(changes, namespace) {
        console.log("TabsList handleStorageChanges", changes, namespace);

        if (changes?.[`tabs_${windowId}`]) {
            tabs = changes[`tabs_${windowId}`].newValue;
        }
    }
</script>

<ul id="vtab-list">
    {#if tabs?.length > 0}
        {#each tabsFilterResult as tab (tab.id)}
            <TabItem {tab} />
        {/each}
    {/if}
</ul>
