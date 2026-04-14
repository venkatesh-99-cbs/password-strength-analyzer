// content.js

(function() {
    'use strict';

    // Initialize Classes from other files (analyzer.js, hibp.js, dom.js)
    const analyzer = new PasswordAnalyzer();
    const checker = new HIBPChecker();
    const ui = new FloatingPanel();

    // State Variables
    let activeInput = null;
    let debounceTimer = null;
    
    // Default Settings (will be overwritten by chrome.storage)
    let settings = {
        enableHibp: true,   // Breach detection toggle
        enableUi: true,     // Floating UI toggle
        enableAnim: true     // Animations toggle
    };

    /**
     * Load user settings from Chrome Storage before initializing.
     * This ensures we respect user preferences immediately on page load.
     */
    function loadSettingsAndInit() {
        chrome.storage.sync.get(['enableHibp', 'enableUi', 'enableAnim'], (data) => {
            // Update local settings, defaulting to true if undefined
            settings.enableHibp = data.enableHibp !== false;
            settings.enableUi = data.enableUi !== false;
            settings.enableAnim = data.enableAnim !== false;
            
            // Initialize the UI engine
            if (settings.enableUi) {
                init();
            }
        });
    }

    /**
     * Main Initialization Function
     */
    function init() {
        ui.create();       // Create the floating panel
        observeDOM();      // Watch for dynamically added inputs
        scanFields();      // Scan existing inputs on the page
    }

    /**
     * Attach event listeners to password fields
     */
    function scanFields() {
        const inputs = document.querySelectorAll('input[type="password"], input[type="text"]');
        inputs.forEach(attachListeners);
    }

    /**
     * Add Focus, Blur, and Input listeners to a specific field
     */
    function attachListeners(input) {
        // Prevent duplicate listeners
        if (input.dataset.pwdAnalyzerAttached) return;
        input.dataset.pwdAnalyzerAttached = 'true';

        // HANDLE: Input already focused when script loads
        if (document.activeElement === input) {
            // Only process if UI is enabled in settings
            if (settings.enableUi) {
                activeInput = input;
                ui.position(activeInput);
                ui.show();
                if (input.value) handleInput(input.value);
            }
        }

        // EVENT: Focus
        input.addEventListener('focus', (e) => {
            if (!settings.enableUi) return;
            
            activeInput = e.target;
            ui.position(activeInput);
            ui.show();
        });

        // EVENT: Blur
        input.addEventListener('blur', () => {
            // Note: We don't strictly need to hide on blur if we want the user 
            // to interact with the UI, but for strict security UX we can hide it.
            // Currently keeping it simple.
        });

        // EVENT: Input (Typing)
        input.addEventListener('input', (e) => {
            if (!settings.enableUi) return;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const password = e.target.value;
                handleInput(password);
            }, 300); // Debounce to prevent lag on fast typing
        });
    }

    /**
     * Core Analysis Logic
     */
    async function handleInput(password) {
        // SAFETY CHECK: Ensure we have a valid active input
        if (!activeInput) return;

        // If field is empty, reset UI
        if (!password || password.length === 0) {
            ui.update(analyzer.emptyResult(), null);
            return;
        }

        // 1. Run Local Analysis (Entropy, Patterns, Crack Time)
        const result = analyzer.analyze(password);
        
        // 2. Run Remote HIBP Check (if enabled)
        let breachResult = null;
        
        // Only query API if setting is enabled and password is reasonable length
        if (settings.enableHibp && password.length >= 4) {
            try {
                breachResult = await checker.check(password);
            } catch (e) {
                console.warn("Breach check failed (Network or API error):", e);
                // Graceful fallback: We just don't show breach data
            }
        }

        // 3. Update Floating UI
        ui.update(result, breachResult);
        ui.position(activeInput);
    }

    /**
     * Observe DOM for dynamically added fields (React/AJAX support)
     */
    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'INPUT') {
                            attachListeners(node);
                        } else {
                            // Check children of added nodes
                            const inputs = node.querySelectorAll('input');
                            inputs.forEach(attachListeners);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- START EXECUTION ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSettingsAndInit);
    } else {
        loadSettingsAndInit();
    }

})();
