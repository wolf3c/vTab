<script>
    import { onMount } from "svelte";

    let sortUnfreezed = false;
    let sortByHost = false;
    let rightSidebar = false;
    let autoFreezeSetting = false;
    let autoArchiveSetting = false;
    let feedback = "";


    onMount(() => {
        loadSettings();

    });

    function loadSettings() {
        chrome.storage.local.get("vtab_settings_sortUnfreezed", (data) => {
            sortUnfreezed = data?.vtab_settings_sortUnfreezed || false;
        });

        chrome.storage.local.get("vtab_settings_sortByHost", (data) => {
            sortByHost = data?.vtab_settings_sortByHost || false;
        });

        chrome.storage.local.get("vtab_settings_rightSidebar", (data) => {
            rightSidebar = data?.vtab_settings_rightSidebar || false;
        });

        chrome.storage.local.get("vtab_settings_autoFreeze", (data) => {
            autoFreezeSetting = data?.vtab_settings_autoFreeze || false;
        });

        chrome.storage.local.get("vtab_settings_autoArchive", (data) => {
            autoArchiveSetting = data?.vtab_settings_autoArchive || false;
        });
    }

    function handleSettingChange(settingName, value) {
        chrome.storage.local.set(
            { [`vtab_settings_${settingName}`]: value },
            () => {
                chrome.runtime.sendMessage({
                    action: "ga",
                    label: "settings",
                    event: settingName,
                    value: value,
                });
            },
        );
    }

    function closeWindow() {
        window.close();
    }

    function openArchivedManager() {
        chrome.runtime.sendMessage({ action: "openArchivedManager" });
    }

    function sendFeedback() {
        console.log(feedback);
        chrome.runtime.sendMessage({
                    action: "ga",
                    event: "feedback",
                    value: feedback,
                });

        if (confirm("Feedback sent!")) {
            feedback = "";
        }
    }
</script>


<h1>vTab Extension</h1>
<div class="settings">
    <h3>Tabs Sorting</h3>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={sortUnfreezed}
                on:change={() =>
                    handleSettingChange("sortUnfreezed", sortUnfreezed)}
            />
            sort unfreezed tabs together
        </label>
    </li>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={sortByHost}
                on:change={() => handleSettingChange("sortByHost", sortByHost)}
            />
            sort by URL/host
        </label>
    </li>
    <h3>Layout</h3>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={rightSidebar}
                on:change={() =>
                    handleSettingChange("rightSidebar", rightSidebar)}
            />
            show vTab on right
        </label>
    </li>
    <!-- <h3>Interaction</h3>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={toggleSidebarByKey}
                on:change={() =>
                    handleSettingChange("toggleSidebarByKey", toggleSidebarByKey)}
            />
            show/hide vTab by <code>shift</code> or <code>Command</code> key
        </label>
    </li>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={openTabsByArrowKey}
                on:change={() =>
                    handleSettingChange("openTabsByArrowKey", openTabsByArrowKey)}
            />
            open tabs by keyboard <code>↑ ↓</code> and <code>Enter</code>
        </label>
    </li>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={openTabsByVimKey}
                on:change={() =>
                    handleSettingChange("openTabsByVimKey", openTabsByVimKey)}
            />
            open tabs by VIM mode keyboard: <code>j</code>is ↓, <code>k</code>is ↑, <code>o</code>is new tab, and <code>Enter</code> is open
        </label>
    </li>
    <br> -->
    <h3>Automation</h3>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={autoFreezeSetting}
                on:change={() =>
                    handleSettingChange("autoFreeze", autoFreezeSetting)}
            />
            Freeze tabs that inactive for 36 hours automatically
            <sup style="color: green;">[Beta]</sup>
        </label>
    </li>
    <li>
        <label>
            <input
                type="checkbox"
                bind:checked={autoArchiveSetting}
                on:change={() =>
                    handleSettingChange("autoArchive", autoArchiveSetting)}
            />
            Archive tabs that inactive for 7 days automatically
            <sup style="color: green;">[Beta]</sup>
        </label>
    </li>
    <li>
        <button on:click={openArchivedManager}>Archived Tabs Manager</button>
    </li>
    <hr />
    <div class="contact-info">
        <h3>Contact & Feedback</h3>
        <li>
            <a href="https://t.me/+QQLV4RqH4940NjNl" target="_blank"
                >Telegram Group</a
            >
        </li>
        <li>
            <a href="https://github.com/wolf3c/vTab" target="_blank">Github</a>
        </li>
        <li>
            <a href="mailto:wolf3c@gmail.com" target="_blank">Email</a>
        </li>
        <b>Write your feedback here:</b>
        <textarea name="" id="" style="width: 100%;" rows="10" bind:value={feedback}></textarea>
        <br>
        <button class="btn" on:click={sendFeedback}>Send Feedback</button>
    </div>
</div>

<div class="footer-btn">
    <button class="btn" on:click={closeWindow}>Okay</button>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
    }

    h1 {
        margin: 0;
        padding: 10px;
        background-color: #f1f1f1;
        border-bottom: 1px solid #ccc;
    }

    .settings {
        padding: 10px;
        margin-left: 2rem;
        margin-right: 2rem;
        margin: 0 2rem 5rem 2rem;
        font-size: large;
    }

    .settings li {
        padding: 10px 0;
        list-style: none;
        font-size: 1.2rem;
    }

    .contact-info {
        padding: 10px;
        font-size: large;
    }

    .contact-info li {
        margin-bottom: 10px;
    }

    .contact-info a {
        color: #007bff;
        text-decoration: none;
    }

    .contact-info a:hover {
        text-decoration: underline;
    }

    .footer-btn {
        position: fixed;
        left: 0;
        bottom: 0;
        width: 100%;
        padding: 10px;
        background-color: #f1f1f1;
        border-top: 1px solid #ccc;
    }

    .btn {
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
</style>