<script>
    function openGithub() {
        window.open("https://github.com/wolf3c/vTab", "_blank");
        chrome.runtime.sendMessage({
            action: "ga",
            event: "github",
            label: "link",
        });
    }

    // TODO: 待优化
    function openArchivedManager() {
        chrome.runtime.sendMessage({ action: "openArchivedManager" });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "archived",
            label: "link",
        });
    }

    // TODO: 待优化
    function openSettings() {
        chrome.runtime.sendMessage({ action: "openOptionsPage" });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "options",
            label: "link",
        });
    }
</script>

<div id="footer">
    <button on:click={openGithub}><span inert aria-hidden='true'>🏚️ Github</span></button>
    <button on:click={openArchivedManager}><span inert aria-hidden='true'>🗄️ Archived</span></button>
    <button on:click={openSettings}><span inert aria-hidden='true'>⚙️ Settings</span></button>
</div>
