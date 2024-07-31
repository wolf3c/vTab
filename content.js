if (chrome.runtime.getManifest().isReleased) {
    console.log = function () { };
}

// console.log('content.js loaded');

const host = document.createElement('div');
host.id = 'vtab-host';
host.className = 'vtab-host';
host.innerHTML = `
<style>
    .vtab-host {
        all: initial;
    }
</style>
`;
document.body.appendChild(host);

let settings = {
    tabsListSortUnfreezed: false,
}
chrome.storage.local.get('vtab_settings_rightSidebar', (data) => {
    console.log('vtab_settings_rightSidebar', data)
    if (data && data?.vtab_settings_rightSidebar === true) {
        settings.rightSidebar = data?.vtab_settings_rightSidebar;
        setSidebarLocal();
    }
})

function createSidebar() {
    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
<style>
    /* 重置 Shadow DOM 内部样式，避免继承外部样式 */
    :host {
        all: initial;
    }

    #vtab-sidebar {
        position: fixed;
        top: 0;
        width: 250px;
        height: 100%;
        background-color: #f7f7f7; /* Set light gray background */
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2); /* Add shadow effect */
        transition: 0.1s linear;
        z-index: 2147483647;
        overflow-y: auto; /* Ensure vertical scrolling if content overflows */
    }
    
    #operation-area {
        position: sticky;
        top: 0;
        z-index: 2147483647;
        background-color: #f7f7f7;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #ccc;
    }
    #operation-area button {
        background-color: transparent;
        border: none;
        cursor: pointer;
    }
    
    #footer {
        position: fixed;
        bottom: 0;
        z-index: 2147483647;
        background-color: #f7f7f7;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-top: 1px solid #ccc;
        width: 230px;
    }
    #footer button {
        background-color: transparent;
        border: none;
        cursor: pointer;
    }

    #search-input {
        width: calc(100% - 14px);
        padding: 5px;
    }

    #vtab-list {
        list-style: none;
        padding: 0;
        margin: 0;
        margin-bottom: 50px;
        textAlign: left;
    }
    
    .vtab-list-item {
        position: relative;
        display: flex;
        align-items: center;
        padding: 10px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 5px 10px;
        font-size: 16px;
        background-color: #f7f7f7;
        border-radius: 5px;
        line-height: 28px;
    }

    .vtab-list-item.active {
        background-color: #e0e0e0;
    }

    .vtab-list-item:hover {
        background-color: #e0e0e0;
    }

    .vtab-list-item.discarded {
        img, span {
            opacity: 0.3;
        }
    }

    .vtab-list-item img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
    }

    .vtab-list-item span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .vtab-list-item button {
        position: absolute;
        width: 20px;
        height: 20px;
        cursor: pointer;
        background-color: black;
        color: white;
        border: none;
        border-radius: 50%;
        top: 50%;
        transform: translateY(-50%);
        display: none;
    }

    .vtab-list-item:hover button {
        display: block;
    }

    .close-button {
        right: 8px;
    }
    .discard-button {
        left: 8px;
    }

    @media (prefers-color-scheme: dark) {
        #vtab-sidebar {
            background-color: #333; /* Dark background color */
            color: #f7f7f7; /* Light text color */
        }

        #operation-area, #footer {
            background-color: #333;
            border-color: #444; /* Dark border color */
        }

        #operation-area button, #footer button {
            color: #f7f7f7; /* Light text color for buttons */
        }

        #search-input {
            background-color: #666; /* Dark background color for search input */
            color: #f7f7f7; /* Light text color */
        }

        .vtab-list-item {
            background-color: #444; /* Darker background for list items */
            color: #f7f7f7; /* Light text color */

        }

        .vtab-list-item.active {
            background: #666; /* Darker background for active list items */
        }

        .vtab-list-item:hover {
            background-color: #555; /* Even darker background on hover */
        }

        .vtab-list-item button {
            background-color: white; /* Button background color */
            color: black; /* Button text color */
        }
        .vtab-list-item.discarded {
            img, span {
                opacity: 0.6;
            }
        }
    }
</style>
`;

    const sidebar = document.createElement('div');
    sidebar.id = 'vtab-sidebar';
    sidebar.style[settings?.rightSidebar ? 'right' : 'left'] = '-240px';

    let isMouseOver = false
    sidebar.addEventListener('mouseenter', () => {
        isMouseOver = true;
        const isPinned = sidebar.getAttribute('data-pinned') === 'true';
        if (!isPinned) {
            sidebar.style[settings?.rightSidebar ? 'right' : 'left'] = '0';
            chrome.runtime.sendMessage({ action: 'ga', event: 'mouseenter', label: 'sidebar_operation' });
        }
    });
    sidebar.addEventListener('mouseleave', () => {
        isMouseOver = false;
        const isPinned = sidebar.getAttribute('data-pinned') === 'true';
        if (!isPinned) {
            sidebar.style[settings?.rightSidebar ? 'right' : 'left'] = '-240px';
            chrome.runtime.sendMessage({ action: 'ga', event: 'mouseleave', label: 'sidebar_operation' });
        }
    });
    sidebar.addEventListener('scroll', () => {
    // sidebar.addEventListener('scrollend', () => {
        if (isMouseOver) {
            // console.log('sidebar scroll: ', sidebar.scrollTop);
            chrome.runtime.sendMessage({ action: 'scrollSidebar', scrollTop: sidebar.scrollTop });
        }
    })

    // Create the operation area at the top
    const operationArea = document.createElement('div');
    operationArea.id = 'operation-area';

    // Create '❅ Freeze All' button
    const freezeAllButton = document.createElement('button');
    freezeAllButton.textContent = '❅ Freeze All';
    freezeAllButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'freezeWindowAllTabs' });
        chrome.runtime.sendMessage({ action: 'ga', event: 'freezeAll', label: 'tab_operation' });
    });
    operationArea.appendChild(freezeAllButton);
    sidebar.appendChild(operationArea);

    // Create '+' button to add new tab
    const addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.style.fontWeight = 'bolder';
    addButton.style.border = 'solid';
    addButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'addNewTab', url: '' });
        chrome.runtime.sendMessage({ action: 'ga', event: 'tab_new', label: 'tab_operation' });
    });
    operationArea.appendChild(addButton);

    // Create the pin button
    const pinButton = document.createElement('button');
    pinButton.id = 'pin-toggle';
    pinButton.textContent = '📌 Pin';
    pinButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'toggleSidebarPin' });
        chrome.runtime.sendMessage({ action: 'ga', event: 'toggle_' + pinButton.textContent, label: 'sidebar_operation' });
    });

    operationArea.appendChild(pinButton);

    sidebar.appendChild(operationArea);

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.id = 'search-input';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search tabs...';
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const tabItems = Array.from(tabList.children);
        tabItems.forEach(item => {
            const tabTitle = item.textContent.toLowerCase();
            if (tabTitle.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
    searchInput.addEventListener('focus', () => {
        chrome.runtime.sendMessage({ action: 'ga', event: 'search', label: 'sidebar_operation' });
    })

    sidebar.appendChild(searchInput);

    // Create tab list
    const tabList = document.createElement('ul');
    tabList.id = 'vtab-list';
    sidebar.appendChild(tabList);

    // Create the footer
    const footer = document.createElement('div');
    footer.id = 'footer';

    // Create 'github' button
    const githubButton = document.createElement('button');
    githubButton.textContent = '🏚️ Github';
    githubButton.addEventListener('click', () => {
        window.open('https://github.com/wolf3c/vTab', '_blank');
        chrome.runtime.sendMessage({ action: 'ga', event: 'github', label: 'link' });
    });
    footer.appendChild(githubButton);

    // Create '❤️ Support Me' button
    // const supportButton = document.createElement('button');
    // supportButton.textContent = '❤️ Support';
    // supportButton.addEventListener('click', () => {
    //     window.open('https://www.buymeacoffee.com/wolf3cg', '_blank');
    //     chrome.runtime.sendMessage({ action: 'ga', event: 'support', label: 'link' });
    // });
    // footer.appendChild(supportButton);

    // Create '❤️ Archived Manager' button
    const archivedButton = document.createElement('button');
    archivedButton.textContent = '🗄️ Archived';
    archivedButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openArchivedManager' });
        chrome.runtime.sendMessage({ action: 'ga', event: 'archived', label: 'link' });
    });
    footer.appendChild(archivedButton);

    // Create 'settings' button
    const settingsButton = document.createElement('button');
    settingsButton.textContent = '⚙️ Settings';
    settingsButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openOptionsPage' });
        chrome.runtime.sendMessage({ action: 'ga', event: 'options', label: 'link' });
    });
    footer.appendChild(settingsButton);

    sidebar.appendChild(footer);

    // document.body.appendChild(sidebar);

    shadow.appendChild(sidebar);
    // console.log('Sidebar created');
}


function updateTabList() {
    // 向后台脚本发送消息以获取当前窗口 ID
    console.log('updateTabList');
    chrome.runtime.sendMessage({ action: 'GET_WINDOW_ID' }, (response) => {
        if (response && response.windowId !== undefined) {
            // 你可以在这里执行其他操作
            chrome.storage.local.get('tabs_' + response.windowId, (data) => {
                const tabs = data['tabs_' + response.windowId] || [];
                const tabList = host.shadowRoot.getElementById('vtab-list');
                tabList.innerHTML = '';
                console.log('time: ', Date.now());
                tabs
                    .sort((a, b) => {
                        // 首先比较 discarded
                        if (settings.tabsListSortUnfreezed) {
                            if (a.discarded !== b.discarded) {
                                return a.discarded - b.discarded;
                            }
    
                            // 如果 discarded 相同，比较 status
                            if (a.status === 'unloaded' && b.status !== 'unloaded') {
                                return 1;
                            }
                            if (a.status !== 'unloaded' && b.status === 'unloaded') {
                                return -1;
                            }
    
                            // 如果 discarded 和 status 都相同，保持原有顺序
                            return a.originalIndex - b.originalIndex;
                        } else {
                            return 0
                        }
                    })
                    .forEach(tab => {
                        const listItem = document.createElement('li');
                        listItem.className = 'vtab-list-item';
                        listItem.className += tab.discarded || tab.status === 'unloaded' ? ' discarded' : '';

                        const favicon = tab.favIconUrl; // Get favicon URL from tab data
                        if (favicon) {
                            const faviconImg = document.createElement('img');
                            faviconImg.src = favicon;
                            listItem.appendChild(faviconImg); // Add favicon image to list item
                        }

                        const titleSpan = document.createElement('span');
                        titleSpan.textContent = tab.title.length === 0 ? tab.pendingUrl : tab.title;
                        listItem.appendChild(titleSpan);

                        listItem.dataset.tabId = tab.id;

                        if (tab.active) {
                            listItem.className += ' active';
                        }

                        listItem.addEventListener('click', () => {
                            // console.log('Tab item clicked', listItem.dataset.tabId);
                            chrome.runtime.sendMessage({ action: 'activateTab', tabId: parseInt(listItem.dataset.tabId) });
                            chrome.runtime.sendMessage({ action: 'ga', event: 'tab_click', label: 'tab_operation' });
                        });

                        addCloseButton(listItem); // Add close button to each tab item
                        if (!tab.discarded && tab.active === false && tab.status !== 'unloaded') addDiscardButton(listItem);

                        tabList.appendChild(listItem);
                    });
                console.log('time: ', Date.now());
            });
        } else {
            console.error('无法获取窗口ID');
        }
    })


    function addCloseButton(listItem) {
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = 'X';

        closeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 防止点击关闭按钮时激活标签
            const tabId = parseInt(listItem.dataset.tabId);
            chrome.runtime.sendMessage({ action: 'closeTab', tabId: tabId });
            chrome.runtime.sendMessage({ action: 'ga', event: 'tab_close', label: 'tab_operation' });
        });

        listItem.appendChild(closeButton);
    }

    function addDiscardButton(listItem) {
        const discardButton = document.createElement('button');
        discardButton.className = 'discard-button';
        discardButton.textContent = '️❅';

        discardButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 防止点击关闭按钮时激活标签
            const tabId = parseInt(listItem.dataset.tabId);
            chrome.runtime.sendMessage({ action: 'discardTab', tabId: tabId });
            chrome.runtime.sendMessage({ action: 'ga', event: 'tab_discard', label: 'tab_operation' });
        });

        listItem.appendChild(discardButton);
    }
}

function togglePin() {
    // console.log('togglePin')
    // check if the sidebar is pinned
    chrome.runtime.sendMessage({ action: 'checkSidebarPin' }, (response) => {
        if (response && response.isSidebarPinned !== undefined) {
            // console.log('isSidebarPinned response', response)
            const isPinned = response.isSidebarPinned;
            // console.log('isPinned: ', isPinned)

            const pinButton = host.shadowRoot.getElementById('pin-toggle');
            pinButton.textContent = isPinned ? '📌 Unpin' : '📌 Pin';

            const sidebar = host.shadowRoot.getElementById('vtab-sidebar');

            if (isPinned) {
                sidebar.setAttribute('data-pinned', 'true');
                sidebar.style[settings?.rightSidebar ? 'right' : 'left'] = '0';
                if (settings?.rightSidebar) {
                    document.body.style.width = 'calc(100% - 250px)';
                } else {
                    document.body.style.marginLeft = '250px'; // Adjust body margin to make room for sidebar
                }
            } else {
                sidebar.setAttribute('data-pinned', 'false');
                sidebar.style[settings?.rightSidebar ? 'right' : 'left'] = '-240px';
                if (settings?.rightSidebar) {
                    document.body.style.width = '100%';
                } else {
                    document.body.style.marginLeft = '0'; // Adjust body margin to make room for sidebar
                }
            }
        }
    });
}

function scrollSidebar(scrollTop = null) {
    console.log('scrollSidebar', scrollTop)
    if (!scrollTop) {
        chrome.runtime.sendMessage({ action: 'returnScrollTopValue' }, (response) => {
            if (response.scrollTop) scrollSidebar(response.scrollTop);
        })
    } else {
        const sidebar = host.shadowRoot.getElementById('vtab-sidebar');
        sidebar.scrollTo(0, scrollTop);
    }
}

function sortUnfreezed() {
    chrome.storage.local.get('vtab_settings', (data) => {
        // console.log('vtab_settings', data)
        if (data && data?.vtab_settings?.sortUnfreezed !== undefined) {
            settings.tabsListSortUnfreezed = data?.vtab_settings?.sortUnfreezed;
            updateTabList();
        }
    })
}

function setSidebarLocal() {
    const sidebar = host.shadowRoot.getElementById('vtab-sidebar');
    sidebar.style.removeProperty(settings?.rightSidebar ? 'left' : 'right');
    sidebar.style[settings?.rightSidebar ? 'right' : 'left'] = '-240px';
    sidebar.style.removeProperty('boxShadow');
    sidebar.style.boxShadow = `${settings?.rightSidebar ? '-' : ''}2px 0 5px rgba(0, 0, 0, 0.2)`;
}

// Initialize sidebar on page load
createSidebar();
sortUnfreezed();
// updateTabList();
togglePin();
// 暂停100ms后再执行
setTimeout(() => {
    scrollSidebar();
}, 300)

// Update tab list when tabs change
chrome.storage.onChanged.addListener((changes, namespace) => {
    // 向后台脚本发送消息以获取当前窗口 ID
    console.log('chrome.storage.onChanged: ', changes)
    if (changes.vtab_settings) {
        // console.log('vtab_settings changed');
        sortUnfreezed()
    }
    if (changes.vtab_settings_rightSidebar) {
        settings.rightSidebar = changes.vtab_settings_rightSidebar.newValue;
        console.log('vtab_settings_rightSidebar changed', settings.rightSidebar);
        setSidebarLocal();
    }
    chrome.runtime.sendMessage({ action: 'GET_WINDOW_ID' }, (response) => {
        if (response && response.windowId !== undefined) {
            console.log('当前窗口的ID是：', response.windowId);
            // 你可以在这里执行其他操作
            if (changes['tabs_' + response.windowId]) {
                updateTabList();
            }
            if (changes.vtab_settings_pinned_windows) {
                // console.log('isSidebarPinned changed');
                togglePin();
            }
            if (changes.vtab_settings_scrollSidebar) {
                if (changes.vtab_settings_scrollSidebar.newValue?.find(scroll => scroll?.windowId === response.windowId)?.tabId !== response.tabId) {
                    // console.log('scrollSidebar changed');
                    scrollSidebar(changes.vtab_settings_scrollSidebar.newValue.find(scroll => scroll?.windowId === response.windowId).scrollTop);
                }
            }
        } else {
            console.error('无法获取窗口ID');
        }
    })
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === 'scrollSidebar') {
        console.log('Received scrollSidebar message:', request);
        chrome.runtime.sendMessage({ action: 'GET_WINDOW_ID' }, (response) => {
            // console.log('Received GET_WINDOW_ID response:', response);
            if (response && response.windowId !== undefined) {
                if (sender.tab.windowId === response.windowId) {
                    const sidebar = host.shadowRoot.getElementById('vtab-sidebar');
                    if (sidebar) {
                        sidebar.scrollTo(0, request.scrollTop);
                    }
                }
            }
        })
    }
})