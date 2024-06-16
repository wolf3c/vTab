if (chrome.runtime.getManifest().isReleased) {
    console.log = function () { };
}

console.log('content.js loaded');

const host = document.createElement('div');
host.id = 'vtab-host';
host.className = 'vtab-host';
document.body.appendChild(host);

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
        left: -240px;
        width: 250px;
        height: 100%;
        background-color: #f7f7f7; /* Set light gray background */
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2); /* Add shadow effect */
        transition: left 0.1s linear;
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
        position: sticky;
        bottom: 0;
        z-index: 2147483647;
        background-color: #f7f7f7;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-top: 1px solid #ccc;
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
    .vtab-list-item:hover {
        background-color: #e0e0e0;
    }

    .vtab-list-item.discarded {
        filter: grayscale(100%);
        opacity: 0.3;
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
        right: 6px;
    }
    .discard-button {
        left: 6px;
    }
</style>
`;

    const sidebar = document.createElement('div');
    sidebar.id = 'vtab-sidebar';

    sidebar.addEventListener('mouseenter', () => {
        const isPinned = sidebar.getAttribute('data-pinned') === 'true';
        if (!isPinned) {
            sidebar.style.left = '0';
        }
    });
    sidebar.addEventListener('mouseleave', () => {
        const isPinned = sidebar.getAttribute('data-pinned') === 'true';
        if (!isPinned) {
            sidebar.style.left = '-240px';
        }
    });

    // Create the operation area at the top
    const operationArea = document.createElement('div');
    operationArea.id = 'operation-area';

    // Create '❅ Freeze All' button
    const freezeAllButton = document.createElement('button');
    freezeAllButton.textContent = '❅ Freeze All';
    freezeAllButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'freezeWindowAllTabs' });
    });
    operationArea.appendChild(freezeAllButton);
    sidebar.appendChild(operationArea);

    // Create '+' button to add new tab
    const addButton = document.createElement('button');
    addButton.textContent = '+';
    addButton.style.fontWeight='bolder';
    addButton.style.border='solid';
    addButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'addNewTab', url: '' });
    });
    operationArea.appendChild(addButton);

    // Create the pin button
    const pinButton = document.createElement('button');
    pinButton.id = 'pin-toggle';
    pinButton.textContent = '📌 Pin';
    pinButton.addEventListener('click', () => {
        const isPinned = sidebar.getAttribute('data-pinned') === 'true';
        pinButton.textContent = isPinned ? '📌 Pin' : '📌 Unpin';

        if (isPinned) {
            sidebar.setAttribute('data-pinned', 'false');
            document.body.style.marginLeft = '0'; // Reset body margin
        } else {
            sidebar.setAttribute('data-pinned', 'true');
            document.body.style.marginLeft = '250px'; // Adjust body margin to make room for sidebar
        }
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
    });
    footer.appendChild(githubButton);

    // Create '❤️ Support Me' button
    const supportButton = document.createElement('button');
    supportButton.textContent = '❤️ Support Me';
    supportButton.addEventListener('click', () => {
        window.open('https://www.buymeacoffee.com/wolf3cg', '_blank');
    });
    footer.appendChild(supportButton);

    sidebar.appendChild(footer);

    // document.body.appendChild(sidebar);

    shadow.appendChild(sidebar);
    console.log('Sidebar created');
}


function updateTabList() {
    // 向后台脚本发送消息以获取当前窗口 ID
    chrome.runtime.sendMessage({ action: 'GET_WINDOW_ID' }, (response) => {
        if (response && response.windowId !== undefined) {
            console.log('当前窗口的ID是：', response.windowId);
            // 你可以在这里执行其他操作
            chrome.storage.local.get('tabs_' + response.windowId, (data) => {
                console.log(data)
                const tabs = data['tabs_' + response.windowId] || [];
                const tabList = host.shadowRoot.getElementById('vtab-list');
                tabList.innerHTML = '';

                tabs.forEach(tab => {
                    console.log('Tab:', tab);
                    const listItem = document.createElement('li');
                    listItem.className = 'vtab-list-item';
                    listItem.className += tab.discarded ? ' discarded' : '';

                    const favicon = tab.favIconUrl; // Get favicon URL from tab data
                    console.log('favicon: ', favicon)
                    if (favicon) {
                        const faviconImg = document.createElement('img');
                        faviconImg.src = favicon;
                        listItem.appendChild(faviconImg); // Add favicon image to list item
                    }

                    const titleSpan = document.createElement('span');
                    titleSpan.textContent = tab.title;
                    listItem.appendChild(titleSpan);

                    listItem.dataset.tabId = tab.id;

                    if (tab.active) {
                        listItem.style.backgroundColor = '#ddd';
                    }

                    listItem.addEventListener('click', () => {
                        console.log('Tab item clicked', listItem.dataset.tabId);
                        chrome.runtime.sendMessage({ action: 'activateTab', tabId: parseInt(listItem.dataset.tabId) });
                    });

                    addCloseButton(listItem); // Add close button to each tab item
                    if (!tab.discarded) addDiscardButton(listItem); 
                    console.log(listItem)

                    tabList.appendChild(listItem);
                });
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
        });

        listItem.appendChild(discardButton);
    }
}


// Initialize sidebar on page load
createSidebar();
updateTabList();

// Update tab list when tabs change
chrome.storage.onChanged.addListener((changes, namespace) => {
    // 向后台脚本发送消息以获取当前窗口 ID
    chrome.runtime.sendMessage({ action: 'GET_WINDOW_ID' }, (response) => {
        if (response && response.windowId !== undefined) {
            console.log('当前窗口的ID是：', response.windowId);
            // 你可以在这里执行其他操作
            if (changes['tabs_' + response.windowId]) {
                updateTabList();
            }
        } else {
            console.error('无法获取窗口ID');
        }
    })
});