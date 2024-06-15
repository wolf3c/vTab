chrome.runtime.onInstalled.addListener(() => {
    console.log("vtab extension installed.");
    updateTabsInStorage();
});

function updateTabsInStorage() {
    chrome.windows.getAll({ populate: true }, (windows) => {
        windows.forEach((window) => {
            chrome.storage.local.set({ ['tabs_' + window.id]: window.tabs });
            console.log('Tabs updated in storage:', window.id, window.tabs);
            chrome.storage.local.get('tabs_' + window.id, data => console.log(data))
        });
    });
}

chrome.tabs.onRemoved.addListener(updateTabsInStorage);
chrome.tabs.onCreated.addListener(updateTabsInStorage);
chrome.tabs.onActivated.addListener(updateTabsInStorage);
chrome.windows.onFocusChanged.addListener(updateTabsInStorage);
chrome.windows.onRemoved.addListener(updateTabsInStorage);
chrome.windows.onCreated.addListener(updateTabsInStorage);


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateTabsInStorage();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'activateTab') {
        console.log('Received activateTab message for tabId:', request.tabId);
        chrome.tabs.update(request.tabId, { active: true });
    } else if (request.action === 'closeTab') {
        chrome.tabs.remove(request.tabId, () => {
            console.log('Tab closed:', request.tabId);
        });
    } else if (request.action === 'GET_WINDOW_ID') {
        // 获取当前活动的窗口，参考  https://stackoverflow.com/questions/38556602/get-window-id-from-javascript-with-help-of-chrome-extension
        sendResponse({ windowId: sender.tab.windowId })
        // 需要返回 true 以表示我们将异步发送响应
        return true;
    }
});