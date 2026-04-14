// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const breachToggle = document.getElementById('breach-toggle');
    
    // Load saved settings
    chrome.storage.sync.get(['enableBreachCheck'], (result) => {
        breachToggle.checked = result.enableBreachCheck !== false; // Default true
    });

    breachToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        chrome.storage.sync.set({ enableBreachCheck: checked }, () => {
            console.log('Settings saved:', checked);
        });
    });
});


// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const dashboardBtn = document.getElementById('btn-open-dashboard');

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            // Open the full options page in a new tab
            chrome.runtime.openOptionsPage();
        });
    }
});
