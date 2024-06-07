console.log('popup.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM fully loaded and parsed');

  const toggleButton = document.getElementById('pin-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      console.log('Toggle Pin button clicked');
      chrome.storage.local.get('isPinned', (data) => {
        const isPinned = !data.isPinned;
        chrome.storage.local.set({isPinned: isPinned}, () => {
          console.log('Pin state set to', isPinned);
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
              const tabId = tabs[0].id;
              chrome.scripting.executeScript({
                target: {tabId: tabId},
                func: togglePin,
                args: [isPinned]
              }, (results) => {
                if (chrome.runtime.lastError) {
                  console.error('Error executing script:', chrome.runtime.lastError);
                } else {
                  console.log('Script executed', results);
                }
              });
            } else {
              console.error('No active tab found');
            }
          });
        });
      });
    });
  } else {
    console.error('Toggle Pin button not found');
  }
});

function togglePin(isPinned) {
  console.log('togglePin function called with isPinned:', isPinned);
  const sidebar = document.getElementById('vtab-sidebar');
  if (sidebar) {
    if (isPinned) {
      sidebar.style.width = '250px';
      sidebar.style.transition = 'none';
      sidebar.removeEventListener('mouseleave', handleMouseLeave);
    } else {
      sidebar.style.width = '10px';
      sidebar.style.transition = 'width 0.3s';
      sidebar.addEventListener('mouseleave', handleMouseLeave);
    }
  } else {
    console.error('Sidebar not found');
  }
}
