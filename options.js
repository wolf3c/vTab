console.log('popup.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup DOM fully loaded and parsed');
    const sortUnfreezed = document.getElementById('sort-unfreezed');
    if (sortUnfreezed) {
        chrome.storage.local.get('vtab_settings', (data) => {
            if (data && data?.vtab_settings?.sortUnfreezed !== undefined) {
                sortUnfreezed.checked = data?.vtab_settings?.sortUnfreezed;
            }
        })

        sortUnfreezed.addEventListener('change', (event) => {
            chrome.storage.local.set({ vtab_settings: { sortUnfreezed: event.target.checked } }, () => {
                console.log('sortUnfreezed changed:', event.target.checked);
                chrome.runtime.sendMessage({ action: 'ga', event: 'settings', action: 'sortUnfreezed', value: event.target.checked });
            })
        });
    }

    const rightSidebar = document.getElementById('right-sidebar');
    if (rightSidebar) {
        chrome.storage.local.get('vtab_settings_rightSidebar', (data) => {
            if (data && data?.vtab_settings_rightSidebar !== undefined) {
                rightSidebar.checked = data?.vtab_settings_rightSidebar;
            }
        })

        rightSidebar.addEventListener('change', (event) => {
            chrome.storage.local.set({ vtab_settings_rightSidebar: event.target.checked }, () => {
                console.log('rightSidebar changed:', event.target.checked);
                chrome.runtime.sendMessage({ action: 'ga', event: 'settings', action: 'rightSidebar', value: event.target.checked });
            })
        });
    }

    const autoFreezeSetting = document.getElementById('auto-freeze');
    if (autoFreezeSetting) {
        chrome.storage.local.get('vtab_settings_autoFreeze', (data) => {
            if (data && data?.vtab_settings_autoFreeze !== undefined) {
                autoFreezeSetting.checked = data?.vtab_settings_autoFreeze;
            }
        })

        autoFreezeSetting.addEventListener('change', (event) => {
            chrome.storage.local.set({ vtab_settings_autoFreeze: event.target.checked }, () => {
                chrome.runtime.sendMessage({ action: 'ga', event: 'settings', action: 'autoFreeze', value: event.target.checked });
            })
        });
    }

    const autoArchiveSetting = document.getElementById('auto-archive');
    if (autoArchiveSetting) {
        chrome.storage.local.get('vtab_settings_autoArchive', (data) => {
            if (data && data?.vtab_settings_autoArchive !== undefined) {
                autoArchiveSetting.checked = data?.vtab_settings_autoArchive;
            }
        })

        autoArchiveSetting.addEventListener('change', (event) => {
            chrome.storage.local.set({ vtab_settings_autoArchive: event.target.checked }, () => {
                chrome.runtime.sendMessage({ action: 'ga', event: 'settings', action: 'autoArchive', value: event.target.checked });
            })
        });
    }

    const okButton = document.getElementById('ok-button');
    if (okButton) {
        okButton.addEventListener('click', () => {
            window.close();
        });
    }

    const archivedManagerButton = document.getElementById('archived-manager-button');
    if (archivedManagerButton) {
        archivedManagerButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openArchivedManager' });
        });
    }
});