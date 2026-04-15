// content.js

(function() {
    'use strict';

    // Initialize Classes from other files
    const analyzer = new PasswordAnalyzer();
    const checker = new HIBPChecker();
    const ui = new FloatingPanel();

    // State Variables
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

    /**
     * STRICT DETECTION: Only target input fields with type="password"
     */
    function scanFields() {
        // REMOVED: input[type="text"]
        const inputs = document.querySelectorAll('input[type="password"]');
        inputs.forEach(attachListeners);
    }

    function attachListeners(input) {
        // Final Safety Check: Ensure it is definitely a password field
        if (input.type !== 'password') return;

        if (input.dataset.pwdAnalyzerAttached) return;
        input.dataset.pwdAnalyzerAttached = 'true';

        if (document.activeElement === input) {
            if (settings.enableUi) {
                activeInput = input;
                ui.position(activeInput);
                ui.show();
                if (input.value) handleInput(input.value);
            }
        }

        input.addEventListener('focus', (e) => {
            if (!settings.enableUi) return;
            activeInput = e.target;
            ui.position(activeInput);
            ui.show();
        });

        input.addEventListener('blur', () => {
            // UI stays visible until focused elsewhere or blurred
        });

        input.addEventListener('input', (e) => {
            if (!settings.enableUi) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const password = e.target.value;
                handleInput(password);
            }, 300);
        });
    }

    async function handleInput(password) {
        if (!activeInput) return;

        if (!password || password.length === 0) {
            ui.update(analyzer.emptyResult(), null);
            return;
        }

        const result = analyzer.analyze(password);
        let breachResult = null;
        
        if (settings.enableHibp && password.length >= 4) {
            try {
                breachResult = await checker.check(password);
            } catch (e) {
                console.warn("Breach check failed:", e);
            }
        }

        ui.update(result, breachResult);
        ui.position(activeInput);
    }

    /**
     * Strictly monitor only password inputs being added to the DOM
     */
    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { 
                        // 1. If the added node itself is a password input
                        if (node.tagName === 'INPUT' && node.type === 'password') {
                            attachListeners(node);
                        } else {
                            // 2. Search for password inputs inside the added node
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
