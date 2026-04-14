// utils/hibp.js

class HIBPChecker {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache for session
  }

  /**
   * Checks password against HIBP database.
   * Returns: { found: boolean, count: number }
   */
  async check(password) {
    if (!password) return { found: false, count: 0 };

    // 1. Hash password locally (SHA-1)
    const hash = await this.SHA1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Check cache first
    if (this.cache.has(hash)) {
      return this.cache.get(hash);
    }

    // 2. Ask background script to fetch HIBP data
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "checkBreach", hashPrefix: prefix }, (response) => {
        if (response.error) {
          console.warn("HIBP check failed", response.error);
          resolve({ found: false, count: 0, error: true });
          return;
        }

        // 3. Parse response to find our suffix
        const result = this.parseHIBPResponse(response.count, suffix);
        this.cache.set(hash, result);
        resolve(result);
      });
    });
  }

  async SHA1(str) {
    const buffer = new TextEncoder("utf-8").encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join('').toUpperCase();
  }

  parseHIBPResponse(text, suffix) {
    // Response format: SUFFIX:COUNT
    const lines = text.split('\n');
    for (let line of lines) {
      const parts = line.split(':');
      if (parts[0] === suffix) {
        return { found: true, count: parseInt(parts[1], 10) };
      }
    }
    return { found: false, count: 0 };
  }
}

window.HIBPChecker = HIBPChecker;
