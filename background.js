if (chrome.runtime.getManifest().isReleased) {
    console.log = function () { };
}

chrome.runtime.onInstalled.addListener(function (details) {
    console.log("vtab extension installed.");

    // updateTabsInStorage();

    // register content script when extension is updated
    if (details.reason === 'update' || details.reason === 'install') {
        chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
            console.log('windows: ', windows)
            windows.forEach((window) => {
                // console.log('window: ', window)
                window.tabs.filter(tab => tab.status != 'unloaded' && tab.discarded === false).forEach((tab) => {
                    // console.log('chrome.scripting.executeScript - tab: ', tab)
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            // remove the old content script
                            let vtabHosts = document.getElementsByClassName('vtab-host')
                            // console.log(vtabHosts)
                            while (vtabHosts.length > 0) {
                                vtabHosts[0].parentNode.removeChild(vtabHosts[0]);
                            }
                        }
                    }).then(() => {
                        console.log("injected a function")
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        });
                    })

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
    console.log('updateTabsInStorage');
    chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
        windows.forEach((window) => {
            // chrome.storage.local.set({ ['tabs_' + window.id]: window.tabs });
            // console.log('Tabs updated in storage:', window.id, window.tabs);
            // chrome.storage.local.get('tabs_' + window.id, data => console.log(data))
            const key = 'tabs_' + window.id;
            chrome.storage.local.get(key, (data) => {
                const storedTabs = data[key];
                if (JSON.stringify(storedTabs) !== JSON.stringify(window.tabs)) {
                    chrome.storage.local.set({ [key]: window.tabs });
                    console.log('Tabs updated in storage:', window.id, window.tabs);
                }
            });
        });
    });
}

chrome.tabs.onUpdated.addListener(updateTabsInStorage);
chrome.tabs.onRemoved.addListener(updateTabsInStorage);
chrome.tabs.onCreated.addListener(updateTabsInStorage);
chrome.tabs.onActivated.addListener(updateTabsInStorage);
chrome.tabs.onDetached.addListener(updateTabsInStorage);
chrome.tabs.onAttached.addListener(updateTabsInStorage);
chrome.windows.onFocusChanged.addListener(updateTabsInStorage);
chrome.windows.onRemoved.addListener(updateTabsInStorage);
chrome.windows.onCreated.addListener(updateTabsInStorage);


// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete') {
//         updateTabsInStorage();
//     }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request, sender, sendResponse);
    switch (request.action) {
        case 'activateTab':
            // console.log('Received activateTab message for tabId:', request.tabId);
            chrome.tabs.update(request.tabId, { active: true });
            break;
        case 'closeTab':
            chrome.tabs.remove(request.tabId, () => {
                // console.log('Tab closed:', request.tabId);
            });
            break;
        case 'discardTab':
            chrome.tabs.discard(request.tabId, () => {
                // console.log('Tab discarded:', request.tabId);
                updateTabsInStorage();
            });
            break;
        case 'GET_WINDOW_ID':
            // 获取当前活动的窗口，参考  https://stackoverflow.com/questions/38556602/get-window-id-from-javascript-with-help-of-chrome-extension
            sendResponse({ windowId: sender.tab.windowId, tabId: sender.tab.id });
            // 需要返回 true 以表示我们将异步发送响应
            return true;
        case 'freezeWindowAllTabs':
            chrome.storage.local.get('tabs_' + sender.tab.windowId, (data) => {
                const tabs = data['tabs_' + sender.tab.windowId] || [];
                tabs.filter(tab => tab.active != true && tab.pinned === false && tab.audible === false && tab.status != 'unloaded' && tab.discarded === false).forEach((tab) => {
                    chrome.tabs.discard(tab.id, () => {
                        // console.log('Tab discarded:', tab.id);
                    })
                })
                updateTabsInStorage();
            });
            break;
        case 'addNewTab':
            chrome.tabs.create({}, () => {
                // console.log('New tab created');
            });
            break;
        case 'toggleSidebarPin':
            chrome.storage.local.get('isSidebarPinned', (data) => {
                const isPinned = !data?.isSidebarPinned?.['window_' + sender.tab.windowId];
                chrome.storage.local.set({ isSidebarPinned: { ['window_' + sender.tab.windowId]: isPinned } }, () => {
                    // console.log('Pin state set to', isPinned);
                });
            });
            break;
        case 'checkSidebarPin':
            // console.log('checkSidebarPin')
            chrome.storage.local.get('isSidebarPinned', (data) => {
                sendResponse({ isSidebarPinned: data?.isSidebarPinned?.['window_' + sender.tab.windowId] });
            });
            return true;
        case 'scrollSidebar':
            // console.log('scrollSidebar tab id', sender.tab.id)
            chrome.storage.local.set({
                scrollSidebar: {
                    ['window_' + sender.tab.windowId]: {
                        scrollTop: request.scrollTop,
                        tabId: sender.tab.id
                    }
                }
            }, () => {
                // console.log('scrollSidebar set to', request.scrollTop);
            });
            break;
        case 'returnScrollTopValue':
            console.log('returnScrollTopValue tab id', sender)
            chrome.storage.local.get('scrollSidebar', (data) => {
                if (data?.scrollSidebar?.['window_' + sender.tab.windowId]?.tabId !== sender.tab.id) {
                    sendResponse({ scrollTop: data?.scrollSidebar?.['window_' + sender.tab.windowId]?.scrollTop || 0 });
                } else {
                    sendResponse({ scrollTop: false });
                }
            });
            return true;
        case 'openOptionsPage':
            chrome.runtime.openOptionsPage();
            break;
        default:
            break;
    }
});