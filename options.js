// options.js

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    // --- Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Get the target section ID from the data attribute
            const targetId = item.getAttribute('data-section');

            // Update active nav link
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show correct section
            sections.forEach(sec => {
                // Remove active class from all
                sec.classList.remove('active-section');
                
                // Add active class to the matching section
                if(sec.id === targetId) {
                    sec.classList.add('active-section');
                }
            });
        });
    });

    // --- Settings Logic ---
    const toggleHibp = document.getElementById('toggle-hibp');
    const toggleUi = document.getElementById('toggle-ui');
    const toggleAnim = document.getElementById('toggle-anim');

    // Load saved settings
    chrome.storage.sync.get(['enableHibp', 'enableUi', 'enableAnim'], (data) => {
        toggleHibp.checked = data.enableHibp !== false;
        toggleUi.checked = data.enableUi !== false;
        toggleAnim.checked = data.enableAnim !== false;
    });

    // Save on change
    const saveSettings = () => {
        chrome.storage.sync.set({
            enableHibp: toggleHibp.checked,
            enableUi: toggleUi.checked,
            enableAnim: toggleAnim.checked
        });
    };

    toggleHibp.addEventListener('change', saveSettings);
    toggleUi.addEventListener('change', saveSettings);
    toggleAnim.addEventListener('change', saveSettings);
});
