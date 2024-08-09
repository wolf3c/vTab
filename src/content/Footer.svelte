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
    <button on:click={openGithub}>🏚️ Github</button>
    <button on:click={openArchivedManager}>🗄️ Archived</button>
    <button on:click={openSettings}>⚙️ Settings</button>
</div>
