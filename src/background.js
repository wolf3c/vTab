import Analytics from './google-analytics.js';

// 禁用掉 console
if (chrome.runtime.getManifest().isReleased) {
    console.log = function () { };
};


console.log('Background service worker starting...');

const initializeExtension = async () => {
    console.log('initializeExtension');
    try {
        // 获取所有正常窗口
        const windows = await chrome.windows.getAll({
            populate: true,
            windowTypes: ['normal']
        });

        console.log('initializeExtension - windows: ', windows);

        for (const window of windows) {
            const activeTabs = window.tabs.filter(tab => {
                return tab.status === 'complete' &&
                    !tab.discarded &&
                    tab.url &&
                    (tab.url.startsWith('http://') || tab.url.startsWith('https://'));
            });

            console.log('initializeExtension - activeTabs: ', activeTabs);

            for (const tab of activeTabs) {
                try {
                    console.log('Injecting script into tab:', tab?.url);

                    // 首先清理旧的内容
                    await chrome.scripting.executeScript({
                        target: { tabId: tab?.id },
                        func: cleanupOldContent
                    });

                    // 注入新的脚本
                    console.log('chrome.runtime.getManifest().content_scripts[0].js: ',tab.id, chrome.runtime.getManifest().content_scripts[0].js);
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id, allFrames : true },
                        files: chrome.runtime.getManifest().content_scripts[0].js
                    });

                    console.log(`Script injected successfully in tab ${tab.id}`);
                } catch (error) {
                    console.error(`Failed to inject script in tab ${tab.id}:`, error);
                }
            }
        }

        // 记录安装统计
        await Analytics.fireEvent('install&update', { value: windows.length });

        // 设置安装时间
        const data = await chrome.storage.local.get('vtab_installed_at');
        console.log('vtab_installed_at', data);
        if (!data?.vtab_installed_at) {
            await chrome.storage.local.set({ vtab_installed_at: Date.now() });
        }

        return data?.vtab_installed_at;
    } catch (error) {
        console.error('Error during extension installation/update:', error);
    }
};

const installListener = async (details) => {
    console.log("Extension event detected:", details);

    if (details.reason !== 'install' && details.reason !== 'update') {
        return;
    }

    console.log('Performing delayed initialization');

    try {
        await initializeExtension();
    } catch (error) {
        console.error('Error during extension installation/update:', error);
    }
};


chrome.runtime.onInstalled.addListener(installListener);

async function checkInstallSetup() {
    console.log('checkInstallSetup');

    let data = await chrome.storage.local.get('vtab_installed_at');
    if (!data?.vtab_installed_at) {
        console.log('Performing delayed initialization');
        return await initializeExtension('install');
    } else {
        return data?.vtab_installed_at;
    }
}

// 清理旧内容的函数
function cleanupOldContent() {
    console.log('cleanupOldContent');
    const vtabHosts = document.getElementsByClassName('vtab-host');
    for (let host of Array.from(vtabHosts)) {
        host.parentNode?.removeChild(host);
    }
}


let settings = {};

function loadSettings() {
    chrome.storage.local.get(
        [
            "vtab_settings_sortUnfreezed",
            "vtab_settings_sortByHost",
            "vtab_settings_rightSidebar",
            "vtab_settings_pinned_windows",
        ],
        (data) => {
            console.log(data);
            settings.sortUnfreezed =
                data?.vtab_settings_sortUnfreezed || false;
            settings.sortByHost = data?.vtab_settings_sortByHost || false;
            settings.rightSidebar =
                data?.vtab_settings_rightSidebar || false;
        },
    );
};

try {
    loadSettings();
} catch (error) {
    console.error("loadSettings error", error);
}

function updateTabsInStorage() {
    console.log('updateTabsInStorage');
    chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
        windows.forEach((window) => {
            // chrome.storage.local.set({ ['tabs_' + window.id]: window.tabs });
            // console.log('Tabs updated in storage:', window.id, window.tabs);
            // chrome.storage.local.get('tabs_' + window.id, data => console.log(data))
            const key = 'tabs_' + window.id;
            let value = sortTabs(window.tabs);
            chrome.storage.local.get(key, (data) => {
                const storedTabs = data[key];
                if (JSON.stringify(storedTabs) !== JSON.stringify(value)) {
                    chrome.storage.local.set({ [key]: value });
                    console.log('Tabs updated in storage:', window.id, value);
                }
            });
        });
    });

    function sortTabs(tabs) {
        let activeTabs = [];
        let freezedTabs = [];
        if (settings?.sortUnfreezed) {
            activeTabs = tabs.filter(tab => tab.discarded === false && tab.status !== "unloaded");
            freezedTabs = tabs.filter(tab => tab.discarded === true || tab.status === "unloaded");
        } else {
            activeTabs = tabs;
        }

        if (settings?.sortByHost) {
            activeTabs = sortTabsByHost(activeTabs);
            freezedTabs = sortTabsByHost(freezedTabs);
        }
        return activeTabs.concat(freezedTabs);
    }

    function sortTabsByHost(tabs) {
        const hosts = tabs.map(tab => new URL(tab.url).host);
        const uniqueHosts = [...new Set(hosts)];
        return tabs.sort((a, b) => uniqueHosts.indexOf(new URL(a.url).host) - uniqueHosts.indexOf(new URL(b.url).host));
    }
}


let isRemovingTabs = false;
chrome.tabs.onUpdated.addListener(updateTabsInStorage);
chrome.tabs.onRemoved.addListener(() => {
    updateTabsInStorage();
    autoFreezeTabs();
    if (!isRemovingTabs) {
        autoArchiveTabs();
    }
});
chrome.tabs.onCreated.addListener(updateTabsInStorage);
chrome.tabs.onActivated.addListener(updateTabsInStorage);
chrome.tabs.onDetached.addListener(updateTabsInStorage);
chrome.tabs.onAttached.addListener(updateTabsInStorage);
chrome.windows.onFocusChanged.addListener(updateTabsInStorage);
chrome.windows.onRemoved.addListener(updateTabsInStorage);
chrome.windows.onCreated.addListener(updateTabsInStorage);

// // 不能运行content scripts的URL模式列表
// const restrictedUrlPatterns = [
//     '^chrome://',
//     '^chrome-extension://',
//     '^file://',
//     '^https?://chrome\.google\.com/webstore',
//     '^view-source:',
//     '^about:'
// ];

// // 检查URL是否匹配受限模式
// function isRestrictedUrl(url) {
//     return restrictedUrlPatterns.some(pattern => new RegExp(pattern).test(url));
// }

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete' && isRestrictedUrl(tab.url)) {
//         // 尝试打开弹出窗口
//         chrome.action.openPopup().catch(error => {
//             console.log('无法自动打开弹出窗口:', error);
//             // 如果无法打开弹出窗口,设置badge提醒用户
//             chrome.action.setBadgeText({ text: "!", tabId: tabId });
//             chrome.action.setBadgeBackgroundColor({ color: "#FF0000", tabId: tabId });
//         });
//     }
// });

// // 当标签页激活时,检查是否需要显示badge
// chrome.tabs.onActivated.addListener((activeInfo) => {
//     chrome.tabs.get(activeInfo.tabId, (tab) => {
//         if (isRestrictedUrl(tab.url)) {
//             chrome.action.setBadgeText({ text: "!", tabId: activeInfo.tabId });
//             chrome.action.setBadgeBackgroundColor({ color: "#FF0000", tabId: activeInfo.tabId });
//         } else {
//             chrome.action.setBadgeText({ text: "", tabId: activeInfo.tabId });
//         }
//     });
// });


const autoArchiveDDL = 7 * 24 * 60 * 60 * 1000;
const autoFreezeDDL = 36 * 60 * 60 * 1000;

function autoFreezeTabs() {
    chrome.storage.local.get('vtab_settings_autoFreeze', (data) => {
        if (data && data?.vtab_settings_autoFreeze === true) {
            chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
                windows.forEach((window) => {
                    window.tabs.filter(tab => tab.pinned === false && tab.discarded === false && tab.status === 'complete' && tab.active === false && tab.lastAccessed < Date.now() - autoFreezeDDL).forEach((tab) => {
                        chrome.tabs.discard(tab.id);
                    });
                });
                updateTabsInStorage();
            });
        }
    })
}

function autoArchiveTabs() {
    console.log('autoArchiveTabs');
    isRemovingTabs = true;
    chrome.storage.local.get('vtab_settings_autoArchive', (data) => {
        if (data && data?.vtab_settings_autoArchive === true) {
            let archivedTabs = [];
            chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
                windows.forEach((window) => {
                    console.log('autoArchiveTabs - window: ', window)
                    window.tabs.filter(tab => tab.pinned === false && tab.active === false && tab.lastAccessed < Date.now() - autoArchiveDDL).forEach((tab) => {
                        archivedTabs.push(tab);
                    });
                });

                chrome.storage.local.get('vtab_archivedTabs', (data) => {
                    let vtab_archivedTabs = data?.vtab_archivedTabs || [];
                    archivedTabs = archivedTabs.filter(tab => !vtab_archivedTabs.find(t => t.id === tab.id));
                    vtab_archivedTabs = vtab_archivedTabs.concat(archivedTabs);

                    chrome.storage.local.set({ vtab_archivedTabs }, () => {
                        archivedTabs.forEach(tab => chrome.tabs.remove(tab.id));

                        updateTabsInStorage();
                        isRemovingTabs = false;
                    })
                })
            });
        }
    })
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
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
            chrome.storage.local.get('vtab_settings_pinned_windows', (data) => {
                console.log('toggleSidebarPin', data);

                let pinnedWindows = data?.vtab_settings_pinned_windows || [];
                if (!pinnedWindows.includes(sender.tab.windowId)) {
                    pinnedWindows.push(sender.tab.windowId);
                } else {
                    pinnedWindows = pinnedWindows.filter(windowId => windowId !== sender.tab.windowId);
                }

                chrome.storage.local.set({ vtab_settings_pinned_windows: pinnedWindows }, () => {
                    console.log('Pin state set to', pinnedWindows);
                });
            });
            break;
        case 'scrollSidebar':
            // console.log('scrollSidebar tab id', sender.tab.id)
            chrome.storage.local.get('vtab_settings_scrollSidebar', (data) => {
                console.log('scrollSidebar listener', data)
                const scroll = {
                    windowId: sender.tab.windowId,
                    tabId: sender.tab.id,
                    scrollTop: request.scrollTop
                }
                let allScroll = data?.vtab_settings_scrollSidebar?.filter(scroll => scroll?.windowId !== sender.tab.windowId) || [];
                allScroll.push(scroll);

                chrome.storage.local.set({ vtab_settings_scrollSidebar: allScroll }, () => {
                    // console.log('scrollSidebar set to', request.scrollTop);
                });
            });
            // chrome.storage.local.set({
            //     vtab_settings_scrollSidebar: {
            //         ['window_' + sender.tab.windowId]: {
            //             scrollTop: request.scrollTop,
            //             tabId: sender.tab.id
            //         }
            //     }
            // }, () => {
            //     // console.log('scrollSidebar set to', request.scrollTop);
            // });
            break;
        case 'returnScrollTopValue':
            console.log('returnScrollTopValue tab id', sender)
            chrome.storage.local.get('vtab_settings_scrollSidebar', (data) => {
                let scroll = data?.vtab_settings_scrollSidebar?.find(scroll => scroll?.windowId === sender.tab.windowId)
                if (scroll?.tabId !== sender.tab.id) {
                    sendResponse({ scrollTop: scroll?.scrollTop || false });
                } else {
                    sendResponse({ scrollTop: false });
                }
                // if (data?.scrollSidebar?.['window_' + sender.tab.windowId]?.tabId !== sender.tab.id) {
                //     sendResponse({ scrollTop: data?.scrollSidebar?.['window_' + sender.tab.windowId]?.scrollTop || 0 });
                // } else {
                //     sendResponse({ scrollTop: false });
                // }
            });
            return true;
        case 'openOptionsPage':
            chrome.runtime.openOptionsPage();
            break;
        case 'openArchivedManager':
            chrome.tabs.create({ url: chrome.runtime.getURL('/src/popup/popup.html') });
            // chrome.tabs.create({ url: chrome.runtime.getURL('/src/archived_manager/archived_manager.html') });
            break;
        case 'removeArchivedTab':
            chrome.storage.local.get('vtab_archivedTabs', (data) => {
                let vtab_archivedTabs = data?.vtab_archivedTabs || [];
                vtab_archivedTabs = vtab_archivedTabs.filter(tab => tab?.id !== request.tabId);

                chrome.storage.local.set({ vtab_archivedTabs }, () => {
                    console.log('Archived tab removed:', request.tabId);
                });
            })
            break;
        case 'closeFeedbackAlert':
            chrome.storage.local.get('vtab_feedback_alerted_times', (data) => {
                const times = data?.vtab_feedback_alerted_times || 0;
                chrome.storage.local.set({ vtab_feedback_alerted_times: times + 1 });
            });
            break;
        case 'ga':
            console.log('GA:', request?.event, request?.category, request?.action, request?.label, request?.value);
            Analytics.fireEvent(request.event, {
                category: request?.category,
                label: request?.label,
                value: request?.value
            });
            break;
        default:
            console.log('messages default')
            break;
    }
});

chrome.storage.onChanged.addListener(async (changes, namespace) => {
    console.log('storage onChanged', changes, namespace)
    if (changes.vtab_settings_sortUnfreezed) {
        settings.sortUnfreezed =
            changes.vtab_settings_sortUnfreezed.newValue;
    }
    if (changes.vtab_settings_sortByHost) {
        settings.sortByHost = changes.vtab_settings_sortByHost.newValue;
    }
    if (changes.vtab_settings_rightSidebar) {
        settings.rightSidebar = changes.vtab_settings_rightSidebar.newValue;
    }
});