<script>
    import { onMount } from "svelte";
    import TabItem from "./TabItem.svelte";

    let tabs = [];
    export let windowId = null;
    export let searchTerm = "";

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

        if (changes[`tabs_${windowId}`]) {
            tabs = changes[`tabs_${windowId}`].newValue;
        }
    }
</script>

<ul id="vtab-list">
    {#each tabs.filter((tab) => tab.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) as tab (tab.id)}
        <TabItem {tab} />
    {/each}
</ul>
