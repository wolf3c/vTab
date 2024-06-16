if (chrome.runtime.getManifest().isReleased) {
    console.log = function () { };
}

chrome.runtime.onInstalled.addListener(function (details) {
    console.log("vtab extension installed.");

    updateTabsInStorage();

    // register content script when extension is updated
    if (details.reason === 'update') {
        chrome.windows.getAll({ populate: true }, (windows) => {
            windows.filter(window => window.type === 'normal').forEach((window) => {
                console.log('window: ', window)
                window.tabs.filter(tab => tab.status != 'unloaded' && tab.discarded === false).forEach((tab) => {
                    console.log('chrome.scripting.executeScript - tab: ', tab)
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            // remove the old content script
                            let vtabHosts = document.getElementsByClassName('vtab-host')
                            console.log(vtabHosts)
                            while (vtabHosts.length > 0) {
                                vtabHosts[0].parentNode.removeChild(vtabHosts[0]);
                            }
                        }
                    }).then(() => console.log("injected a function"))

                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                })
            });
        });

    }
});


function updateTabsInStorage() {
    chrome.windows.getAll({ populate: true }, (windows) => {
        windows.filter(window => window.type === 'normal').forEach((window) => {
            chrome.storage.local.set({ ['tabs_' + window.id]: window.tabs });
            console.log('Tabs updated in storage:', window.id, window.tabs);
            chrome.storage.local.get('tabs_' + window.id, data => console.log(data))
        });
    });
}

chrome.tabs.onRemoved.addListener(updateTabsInStorage);
chrome.tabs.onCreated.addListener(updateTabsInStorage);
chrome.tabs.onActivated.addListener(updateTabsInStorage);
chrome.tabs.onDetached.addListener(updateTabsInStorage);
chrome.tabs.onAttached.addListener(updateTabsInStorage);
chrome.windows.onFocusChanged.addListener(updateTabsInStorage);
chrome.windows.onRemoved.addListener(updateTabsInStorage);
chrome.windows.onCreated.addListener(updateTabsInStorage);


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateTabsInStorage();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'activateTab':
            console.log('Received activateTab message for tabId:', request.tabId);
            chrome.tabs.update(request.tabId, { active: true });
            break;
        case 'closeTab':
            chrome.tabs.remove(request.tabId, () => {
                console.log('Tab closed:', request.tabId);
            });
            break;
        case 'discardTab':
            chrome.tabs.discard(request.tabId, () => {
                console.log('Tab discarded:', request.tabId);
                updateTabsInStorage();
            });
            break;
        case 'GET_WINDOW_ID':
            // 获取当前活动的窗口，参考  https://stackoverflow.com/questions/38556602/get-window-id-from-javascript-with-help-of-chrome-extension
            sendResponse({ windowId: sender.tab.windowId })
            // 需要返回 true 以表示我们将异步发送响应
            return true;
            break;
        case 'freezeWindowAllTabs':
            chrome.storage.local.get('tabs_' + sender.tab.windowId, (data) => {
                const tabs = data['tabs_' + sender.tab.windowId] || [];
                tabs.filter(tab => tab.active != true && tab.status != 'unloaded' && tab.discarded === false).forEach((tab) => {
                    chrome.tabs.discard(tab.id, () => {
                        console.log('Tab discarded:', tab.id);
                    })
                })
                updateTabsInStorage();
            });
            break;
        case 'addNewTab':
            chrome.tabs.create({}, () => {
                console.log('New tab created');
            });
            break;
        default:
            break;
    }
});