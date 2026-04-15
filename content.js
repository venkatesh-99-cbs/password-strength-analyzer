// content.js

(function() {
    'use strict';

    const analyzer = new PasswordAnalyzer();
    const checker = new HIBPChecker();
    const ui = new FloatingPanel();

    let activeInput = null;
    let debounceTimer = null;
    
    let settings = {
        enableHibp: true,
        enableUi: true,
        enableAnim: true
    };

    function loadSettingsAndInit() {
        chrome.storage.sync.get(['enableHibp', 'enableUi', 'enableAnim'], (data) => {
            settings.enableHibp = data.enableHibp !== false;
            settings.enableUi = data.enableUi !== false;
            settings.enableAnim = data.enableAnim !== false;
            
            if (settings.enableUi) {
                init();
            }
        });
    }

    function init() {
        ui.create();
        observeDOM();
        scanFields();
    }

    function scanFields() {
        const inputs = document.querySelectorAll('input[type="password"]');
        inputs.forEach(attachListeners);
    }

       function attachListeners(input) {
        if (input.dataset.pwdAnalyzerAttached) return;
        input.dataset.pwdAnalyzerAttached = 'true';

        if (document.activeElement === input) {
            if (settings.enableUi) {
                activeInput = input;
                ui.position(activeInput);
                ui.show();
                // If field is empty, show generic suggestions immediately
                if (!input.value) {
                    showDefaultSuggestions();
                } else {
                    handleInput(input.value);
                }
            }
        }

        // SHOW UI and SUGGESTIONS on focus
        input.addEventListener('focus', (e) => {
            if (!settings.enableUi) return;
            
            activeInput = e.target;
            ui.position(activeInput);
            ui.show();

            // If the user clicks into an empty field, show the best practices
            if (!activeInput.value) {
                showDefaultSuggestions();
            } else {
                // If there is already text, analyze it immediately
                handleInput(activeInput.value);
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                ui.hide();
                activeInput = null;
            }, 200);
        });

        input.addEventListener('input', (e) => {
            if (!settings.enableUi) return;
            const password = e.target.value;
            
            updateLocalUI(password);

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                updateRemoteUI(password);
            }, 400); 
        });
    }

    /**
     * New Helper: Displays a "Welcome/Guide" state in the UI
     */
    function showDefaultSuggestions() {
        const genericSuggestions = analyzer.getGenericSuggestions();
        
        // We create a "mock" result object that looks like a normal analysis
        // but has 0 score and the generic tips.
        const defaultResult = {
            length: 0,
            entropy: 0,
            score: 0,
            patterns: [],
            crackTime: 'N/A',
            suggestions: genericSuggestions
        };
        
        ui.update(defaultResult, null);
    }

    /**
     * INSTANT UPDATE: Handles Entropy, Score, and Crack Time.
     * No 'await', no network, just pure math.
     */
    function updateLocalUI(password) {
        if (!activeInput) return;

        if (!password || password.length === 0) {
            ui.update(analyzer.emptyResult(), null);
            return;
        }

        const result = analyzer.analyze(password);
        // Update UI immediately with the local result (breach data stays as it was until API returns)
        ui.update(result, null); 
    }

    /**
     * BACKGROUND UPDATE: Handles HIBP API check.
     * This runs in the background and doesn't block the UI.
     */
    async function updateRemoteUI(password) {
        if (!activeInput || !settings.enableHibp || password.length < 4) return;

        try {
            const breachResult = await checker.check(password);
            
            // Once the API returns, we re-run the local analysis 
            // to ensure the UI updates with the latest password and the new breach result.
            const currentResult = analyzer.analyze(password);
            ui.update(currentResult, breachResult);
        } catch (e) {
            console.warn("HIBP check failed:", e);
        }
    }

    // Helper to combine the logic for initial focus
    function handleInput(password) {
        updateLocalUI(password);
        updateRemoteUI(password);
    }

    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'INPUT' && node.type === 'password') {
                            attachListeners(node);
                        } else {
                            const inputs = node.querySelectorAll('input[type="password"]');
                            inputs.forEach(attachListeners);
                        }
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSettingsAndInit);
    } else {
        loadSettingsAndInit();
    }

})();
