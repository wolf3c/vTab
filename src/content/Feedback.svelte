<script>

    function openFeedback() {
        chrome.runtime.sendMessage({ action: "openOptionsPage" });
        chrome.runtime.sendMessage({
            action: "ga",
            event: "feedback_alert_opened",
            label: "link",
        });
    }

    function closeFeedback() {
        chrome.runtime.sendMessage({ action: 'closeFeedbackAlert' });
        chrome.runtime.sendMessage({ action: 'ga', event: 'feedback_alert_closed' });
    }
</script>

<div id="vtab-feedback">
    <button id="vtab-feedback-button" on:click={openFeedback}>Feedback & Suggestions</button>
    <button id="vtab-feedback-close" on:click={closeFeedback}>X</button>
</div>