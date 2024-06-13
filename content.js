console.log('content.js loaded');

// const host = document.body.appendChild(document.createElement('div'));
const host = document.createElement('div');
host.id = 'vtab-host';
document.body.appendChild(host);

function createSidebar() {
    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
<style>
    /* 重置 Shadow DOM 内部样式，避免继承外部样式 */
    :host {
        all: initial;
    }
</style>
`;

    const sidebar = document.createElement('div');
    sidebar.id = 'vtab-sidebar';
    sidebar.style.position = 'fixed';
    sidebar.style.left = '-240px';
    sidebar.style.top = '0';
    sidebar.style.width = '250px';
    sidebar.style.height = '100%';
    sidebar.style.backgroundColor = '#f7f7f7'; // Set light gray background
    sidebar.style.boxShadow = '2px 0 5px rgba(0,0,0,0.2)'; // Add shadow effect
    sidebar.style.transition = 'width 0.3s, box-shadow 0.3s';
    sidebar.style.zIndex = '2147483647';
    sidebar.style.overflowY = 'auto'; // Ensure vertical scrolling if content overflows

    sidebar.addEventListener('mouseenter', () => {
        const isPinned = sidebar.getAttribute('data-pinned') === 'true';
        if (!isPinned) {
            // sidebar.style.width = '250px';
            // sidebar.style.boxShadow = '2px 0 5px rgba(0,0,0,0.2)'; // Add shadow effect
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
    operationArea.style.display = 'flex';
    operationArea.style.justifyContent = 'space-between';
    operationArea.style.alignItems = 'center';
    operationArea.style.padding = '10px';
    operationArea.style.borderBottom = '1px solid #ccc';

    // Create '❤️ Support Me' button
    const supportButton = document.createElement('button');
    supportButton.textContent = '❤️ Support';
    supportButton.style.cursor = 'pointer';
    supportButton.addEventListener('click', () => {
        window.open('https://www.buymeacoffee.com/wolf3cg', '_blank');
    });
    operationArea.appendChild(supportButton);
    sidebar.appendChild(operationArea);

    // Create 'github' button
    const githubButton = document.createElement('button');
    githubButton.textContent = '🏚️ Github';
    githubButton.style.cursor = 'pointer';
    githubButton.addEventListener('click', () => {
        window.open('https://github.com/wolf3c/vTab', '_blank');
    });
    operationArea.appendChild(githubButton);
    sidebar.appendChild(operationArea);

    // Create the pin button
    const pinButton = document.createElement('button');
    pinButton.id = 'pin-toggle';
    pinButton.textContent = '📌Pin';
    pinButton.style.cursor = 'pointer';
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
    searchInput.type = 'text';
    searchInput.placeholder = 'Search tabs...';
    searchInput.style.width = 'calc(100% - 14px)';
    searchInput.style.padding = '5px';
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
    tabList.style.listStyle = 'none'; // Remove bullet points
    tabList.style.padding = '10px 0'; // Add padding for list
    tabList.style.margin = '0'; // Remove default margin
    tabList.style.textAlign = 'left'; // Ensure left alignment
    sidebar.appendChild(tabList);

    // document.body.appendChild(sidebar);

    shadow.appendChild(sidebar);
    console.log('Sidebar created');
}


function updateTabList() {
    chrome.storage.local.get('tabs', (data) => {
        const tabs = data.tabs || [];
        const tabList = host.shadowRoot.getElementById('vtab-list');
        tabList.innerHTML = '';

        tabs.forEach(tab => {
            const listItem = document.createElement('li');
            listItem.style.display = 'flex'; // Use flexbox for alignment
            listItem.style.alignItems = 'center'; // Align items vertically

            const favicon = tab.favIconUrl; // Get favicon URL from tab data
            if (favicon) {
                const faviconImg = document.createElement('img');
                faviconImg.src = favicon;
                faviconImg.style.width = '16px'; // Set width of favicon image
                faviconImg.style.height = '16px'; // Set height of favicon image
                faviconImg.style.marginRight = '8px'; // Add right margin for spacing
                listItem.appendChild(faviconImg); // Add favicon image to list item
            }

            const titleSpan = document.createElement('span');
            titleSpan.textContent = tab.title;
            titleSpan.style.flex = '1'; // Allow title to grow and take up remaining space
            titleSpan.style.overflow = 'hidden'; // Hide overflow text
            titleSpan.style.textOverflow = 'ellipsis'; // Add ellipsis for long titles
            listItem.appendChild(titleSpan);

            listItem.style.padding = '10px'; // Add padding for list item
            listItem.style.cursor = 'pointer';
            listItem.style.whiteSpace = 'nowrap';
            listItem.style.overflow = 'hidden';
            listItem.style.textOverflow = 'ellipsis';
            listItem.style.margin = '5px 10px'; // Add margin between list items, ensure left alignment with margin
            listItem.style.fontSize = '16px'; // Increase font size
            listItem.style.backgroundColor = '#f7f7f7'; // Set background color for list item
            listItem.style.borderRadius = '5px'; // Add slight border radius for list items
            listItem.style.lineHeight = '28px'; // Set line height for list items
            listItem.dataset.tabId = tab.id;

            if (tab.active) {
                listItem.style.backgroundColor = '#ddd';
            }

            listItem.addEventListener('click', () => {
                console.log('Tab item clicked', listItem.dataset.tabId);
                chrome.runtime.sendMessage({ action: 'activateTab', tabId: parseInt(listItem.dataset.tabId) });
            });

            addCloseButton(listItem); // Add close button to each tab item

            tabList.appendChild(listItem);
        });
    });

    function addCloseButton(listItem) {
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '5px'; // 调整关闭按钮到右侧
        closeButton.style.width = '20px';
        closeButton.style.height = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.backgroundColor = 'black';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';

        closeButton.style.top = '50%'; // 垂直居中
        closeButton.style.transform = 'translateY(-50%)'; // 通过transform垂直居中
        closeButton.style.display = 'none'; // 初始隐藏关闭按钮

        closeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 防止点击关闭按钮时激活标签
            const tabId = parseInt(listItem.dataset.tabId);
            chrome.runtime.sendMessage({ action: 'closeTab', tabId: tabId });
        });

        listItem.style.position = 'relative'; // 设置父级列表项的位置为相对定位
        listItem.appendChild(closeButton);

        listItem.addEventListener('mouseenter', () => {
            closeButton.style.display = 'block';
        });

        listItem.addEventListener('mouseleave', () => {
            closeButton.style.display = 'none';
        });
    }
}


// Initialize sidebar on page load
createSidebar();
updateTabList();

// Update tab list when tabs change
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.tabs) {
        updateTabList();
    }
});