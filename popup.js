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
            })
        });
    }
});