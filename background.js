chrome.runtime.onInstalled.addListener(() => {
    console.log("vtab extension installed.");
    updateTabsInStorage();
});

function updateTabsInStorage() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        chrome.storage.local.set({ tabs: tabs }, () => {
            console.log('Tabs updated in storage:', tabs);
        });
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateTabsInStorage();
    }
});

chrome.tabs.onCreated.addListener((tab) => {
    updateTabsInStorage();
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    updateTabsInStorage();
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    updateTabsInStorage();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'activateTab') {
        console.log('Received activateTab message for tabId:', request.tabId);
        chrome.tabs.update(request.tabId, { active: true });
    }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    console.log(`Newly focused window: ${windowId}`);
    updateTabsInStorage();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'closeTab') {
        chrome.tabs.remove(request.tabId, () => {
            console.log('Tab closed:', request.tabId);
        });
    }
});
