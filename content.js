console.log('content.js loaded');

function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.id = 'vtab-sidebar';
  sidebar.style.position = 'fixed';
  sidebar.style.left = '0';
  sidebar.style.top = '0';
  sidebar.style.width = '10px';
  sidebar.style.height = '100%';
  sidebar.style.backgroundColor = '#f7f7f7'; // Set light gray background
  sidebar.style.transition = 'width 0.3s, box-shadow 0.3s';
  sidebar.style.zIndex = '1000';
  sidebar.style.overflowY = 'auto'; // Ensure vertical scrolling if content overflows

  sidebar.addEventListener('mouseenter', () => {
    sidebar.style.width = '250px';
    sidebar.style.boxShadow = '2px 0 5px rgba(0,0,0,0.2)'; // Add shadow effect
  });
  sidebar.addEventListener('mouseleave', handleMouseLeave);

  // Create the operation area at the top
  const operationArea = document.createElement('div');
  operationArea.style.display = 'flex';
  operationArea.style.justifyContent = 'space-between';
  operationArea.style.alignItems = 'center';
  operationArea.style.padding = '10px';
  operationArea.style.borderBottom = '1px solid #ccc';

  // Create the pin button
  const pinButton = document.createElement('button');
  pinButton.id = 'pin-toggle';
  pinButton.textContent = 'Pin';
  pinButton.style.cursor = 'pointer';
  pinButton.addEventListener('click', togglePin);

  operationArea.appendChild(pinButton);
  sidebar.appendChild(operationArea);

  const tabList = document.createElement('ul');
  tabList.id = 'vtab-list';
  tabList.style.listStyle = 'none'; // Remove bullet points
  tabList.style.padding = '10px 0'; // Add padding for list
  tabList.style.margin = '0'; // Remove default margin
  tabList.style.textAlign = 'left'; // Ensure left alignment
  sidebar.appendChild(tabList);

  document.body.appendChild(sidebar);
  console.log('Sidebar created');
}

function handleMouseLeave() {
  const sidebar = document.getElementById('vtab-sidebar');
  if (sidebar) {
    const isPinned = sidebar.getAttribute('data-pinned') === 'true';
    if (!isPinned) {
      sidebar.style.width = '10px';
      sidebar.style.boxShadow = 'none'; // Remove shadow effect
    }
  }
}

function updateTabList() {
  chrome.storage.local.get('tabs', (data) => {
    const tabs = data.tabs || [];
    const tabList = document.getElementById('vtab-list');
    tabList.innerHTML = '';

    tabs.forEach(tab => {
      const listItem = document.createElement('li');
      listItem.textContent = tab.title;
      listItem.style.padding = '10px'; // Add padding for list item
      listItem.style.cursor = 'pointer';
      listItem.style.whiteSpace = 'nowrap';
      listItem.style.overflow = 'hidden';
      listItem.style.textOverflow = 'ellipsis';
      listItem.style.margin = '5px 10px'; // Add margin between list items, ensure left alignment with margin
      listItem.style.fontSize = '16px'; // Increase font size
      listItem.style.backgroundColor = '#f7f7f7'; // Set background color for list item
      listItem.style.borderRadius = '5px'; // Add slight border radius for list items
      listItem.dataset.tabId = tab.id;

      if (tab.active) {
        listItem.style.backgroundColor = '#ddd';
      }

      listItem.addEventListener('click', () => {
        console.log('Tab item clicked', listItem.dataset.tabId);
        chrome.runtime.sendMessage({action: 'activateTab', tabId: parseInt(listItem.dataset.tabId)});
      });

      tabList.appendChild(listItem);
    });
  });
}

function togglePin() {
  const sidebar = document.getElementById('vtab-sidebar');
  const isPinned = sidebar.getAttribute('data-pinned') === 'true';

  if (isPinned) {
    sidebar.setAttribute('data-pinned', 'false');
    sidebar.style.width = '10px';
    sidebar.style.boxShadow = 'none'; // Remove shadow effect
  } else {
    sidebar.setAttribute('data-pinned', 'true');
    sidebar.style.width = '250px';
    sidebar.style.boxShadow = '2px 0 5px rgba(0,0,0,0.2)'; // Add shadow effect
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
