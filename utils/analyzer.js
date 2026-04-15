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
   * Shannon Entropy Calculation
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
    if (hasSpecial) poolSize += 32;

    if (poolSize === 0) return 0;
    return pwd.length * Math.log2(poolSize);
  }

  detectPatterns(pwd) {
    const found = [];
    const lowerPwd = pwd.toLowerCase();

    if (this.commonPasswords.includes(lowerPwd)) {
      found.push({ type: 'common', severity: 'high' });
    }

    if (/(.)\1{2,}/.test(pwd)) {
      found.push({ type: 'repeated', severity: 'medium' });
    }

    if (/abc|bcd|cde|123|234|345|456|567|678|789|890/.test(lowerPwd)) {
      found.push({ type: 'sequential', severity: 'medium' });
    }

    if (/qwerty|asdf|zxcv|qaz|wsx|edc/.test(lowerPwd)) {
      found.push({ type: 'keyboard_pattern', severity: 'high' });
    }

    if (/(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(pwd)) {
      found.push({ type: 'date', severity: 'medium' });
    }

    return found;
  }

  calculateScore(pwd, patterns, entropy) {
    let score = 0;

    if (entropy > 10) score = 1;
    if (entropy > 25) score = 2;
    if (entropy > 40) score = 3;
    if (entropy > 60) score = 4;

    patterns.forEach(p => {
      if (p.severity === 'high') score = Math.max(0, score - 2);
      if (p.severity === 'medium') score = Math.max(0, score - 1);
    });

    if (pwd.length >= 8) score = Math.min(4, score + 1);
    if (pwd.length >= 12) score = Math.min(4, score + 1);

    return Math.max(0, Math.min(4, score));
  }

  estimateCrackTime(entropy) {
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

  /**
   * Returns professional password best practices 
   * to be shown when the user first focuses on the field.
   */
  getGenericSuggestions() {
    return [
      "🎯 Aim for at least 12-16 characters.",
      "🔣 Mix Uppercase, Lowercase, Numbers, and Symbols.",
      "🚫 Avoid common words, names, or birthdays.",
      "🔑 Use a unique password for every account."
    ];
  }
}

// Export for usage in content.js
window.PasswordAnalyzer = PasswordAnalyzer;
