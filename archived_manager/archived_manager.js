document.addEventListener('DOMContentLoaded', function () {
    // 假设你有一个函数 getArchivedTabs 返回归档的标签数组
    let tabs = [];
    chrome.storage.local.get('vtab_archivedTabs', (data) => {
        tabs = data?.vtab_archivedTabs || [];
        // 按时间倒序排序标签
        console.log('tabs: ', tabs)
        tabs.sort((a, b) => b.lastAccessed - a.lastAccessed);

        let archiveList = document.getElementById('archiveList');
        renderList(tabs, archiveList);

        let searchBox = document.getElementById('searchBox');
        searchBox.addEventListener('input', function () {
            let query = searchBox.value.toLowerCase();
            let filteredTabs = tabs.filter(tab => tab.title.toLowerCase().includes(query));
            renderList(filteredTabs, archiveList);
        });
    })
});

// 渲染标签列表的函数
function renderList(tabs, archiveList) {
    archiveList.innerHTML = '';
    tabs.forEach(tab => {
        let listItem = document.createElement('li');
        let favicon = document.createElement('img');
        favicon.src = tab.favIconUrl;
        favicon.width = 16;
        favicon.height = 16;
        let title = document.createElement('span');
        title.className = 'title';
        title.innerText = tab.title;
        title.addEventListener('click', () => {
            window.open(tab.url, '_blank');
        });
        listItem.dataset.tabId = tab.id
        listItem.appendChild(favicon);
        listItem.appendChild(title);
        addCloseButton(listItem);
        archiveList.appendChild(listItem);
    });

    function addCloseButton(listItem) {
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = 'X';

        closeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // 防止点击关闭按钮时激活标签
            const tabId = parseInt(listItem.dataset.tabId);
            if (confirm('Sure remove?')) {
                chrome.runtime.sendMessage({ action: 'removeArchivedTab', tabId: tabId });
                console.log('Removed archived tab:', tabId);
            }
            // chrome.runtime.sendMessage({ action: 'ga', event: 'tab_operation', action: 'tab_close' });
        });

        listItem.appendChild(closeButton);
    }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    // 向后台脚本发送消息以获取当前窗口 ID
    if (changes['vtab_archivedTabs']) {
        // console.log('vtab_archivedTabs changed');
        renderList(changes['vtab_archivedTabs'].newValue, document.getElementById('archiveList'));
    }
})