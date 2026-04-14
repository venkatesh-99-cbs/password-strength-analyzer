// utils/analyzer.js

class PasswordAnalyzer {
  constructor() {
    this.commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome'];
  }

  /**
   * Main analysis function.
   * @param {string} password
   * @returns {object} analysis result
   */
  analyze(password) {
    if (!password) return this.emptyResult();

    const length = password.length;
    const entropy = this.calculateEntropy(password);
    const patterns = this.detectPatterns(password);
    const score = this.calculateScore(password, patterns, entropy);
    const crackTime = this.estimateCrackTime(entropy);

    return {
      length,
      entropy,
      score, // 0-4
      patterns,
      crackTime,
      suggestions: this.generateSuggestions(score, patterns)
    };
  }

  emptyResult() {
    return { length: 0, entropy: 0, score: 0, patterns: [], crackTime: 'N/A', suggestions: [] };
  }

  /**
   * Shannon Entropy Calculation (approximated by character pool)
   */
  calculateEntropy(pwd) {
    if (!pwd) return 0;
    
    let poolSize = 0;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigits = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigits) poolSize += 10;
    if (hasSpecial) poolSize += 32; // Approx for common symbols

    // Basic entropy formula: length * log2(poolSize)
    if (poolSize === 0) return 0;
    return pwd.length * Math.log2(poolSize);
  }

  detectPatterns(pwd) {
    const found = [];
    const lowerPwd = pwd.toLowerCase();

    // 1. Common passwords
    if (this.commonPasswords.includes(lowerPwd)) {
      found.push({ type: 'common', severity: 'high' });
    }

    // 2. Repeated characters (e.g., 'aaaa')
    if (/(.)\1{2,}/.test(pwd)) {
      found.push({ type: 'repeated', severity: 'medium' });
    }

    // 3. Sequential characters (e.g., '123', 'abc')
    if (/abc|bcd|cde|123|234|345|456|567|678|789|890/.test(lowerPwd)) {
      found.push({ type: 'sequential', severity: 'medium' });
    }

    // 4. Keyboard patterns
    if (/qwerty|asdf|zxcv|qaz|wsx|edc/.test(lowerPwd)) {
      found.push({ type: 'keyboard_pattern', severity: 'high' });
    }

    // 5. Dates (YYYYMMDD, MMDDYYYY, etc.)
    // FIXED: Added parentheses around the regex test
    if (/(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(pwd)) {
      found.push({ type: 'date', severity: 'medium' });
    }

    return found;
  }

  calculateScore(pwd, patterns, entropy) {
    let score = 0;

    // Base score from entropy
    if (entropy > 10) score = 1;
    if (entropy > 25) score = 2;
    if (entropy > 40) score = 3;
    if (entropy > 60) score = 4;

    // Penalties for patterns
    patterns.forEach(p => {
      if (p.severity === 'high') score = Math.max(0, score - 2);
      if (p.severity === 'medium') score = Math.max(0, score - 1);
    });

    // Length bonus
    if (pwd.length >= 8) score = Math.min(4, score + 1);
    if (pwd.length >= 12) score = Math.min(4, score + 1);

    return Math.max(0, Math.min(4, score));
  }

  estimateCrackTime(entropy) {
    // Assumption: 10 billion guesses per second (modern GPU offline attack)
    const guessesPerSecond = 10e9;
    const combinations = Math.pow(2, entropy);
    const seconds = combinations / guessesPerSecond;

    if (seconds < 1) return "Instantly";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`;
    return "Centuries+";
  }

  generateSuggestions(score, patterns) {
    const suggestions = [];
    if (score < 3) {
      if (!patterns.find(p => p.type === 'length')) suggestions.push("Use at least 12 characters.");
      suggestions.push("Add uppercase letters, numbers, and symbols.");
    }
    if (patterns.find(p => p.type === 'common')) suggestions.push("Avoid common passwords.");
    if (patterns.find(p => p.type === 'sequential')) suggestions.push("Avoid sequential characters.");
    
    return suggestions;
  }
}

// Export for usage in content.js
window.PasswordAnalyzer = PasswordAnalyzer;
