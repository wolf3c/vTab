<script>
    import TabItem from "./TabItem.svelte";

    export let tabs = [];
    export let searchTerm = "";
</script>

<ul id="vtab-list">
    {#each tabs.filter((tab) => tab.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) as tab (tab.id)}
        <TabItem {tab} />
    {/each}
</ul>
