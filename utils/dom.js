// utils/dom.js

class FloatingPanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
  }

  create() {
    if (this.panel) return;
    
    const container = document.createElement('div');
    container.id = 'pwd-strength-container';
    
    // Use Shadow DOM to isolate styles
    this.shadow = container.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        font-family: 'Courier New', Courier, monospace;
        z-index: 2147483647;
        position: absolute;
        width: 280px;
        background: #0D0D0D;
        color: #ffffff;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        font-size: 12px;
        display: none; /* Hidden by default */
        transition: opacity 0.3s ease;
      }
      .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        border-bottom: 1px solid #333;
        padding-bottom: 4px;
        color: #00FF41;
        font-weight: bold;
      }
      .score-bar {
        height: 6px;
        width: 100%;
        background: #333;
        border-radius: 3px;
        margin: 8px 0;
        overflow: hidden;
      }
      .score-fill {
        height: 100%;
        width: 0%;
        transition: width 0.3s ease, background-color 0.3s ease;
      }
      .metric { margin: 4px 0; display: flex; justify-content: space-between; }
      .label { color: #aaa; }
      .value { font-weight: bold; }
      .breach { color: #ff4444; font-weight: bold; margin-top: 8px; }
      .safe { color: #00FF41; }
      .suggestions { margin-top: 8px; font-size: 11px; color: #aaa; }
      .suggestions li { margin: 2px 0; }
    `;
    
    this.shadow.appendChild(style);
    
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="header">
        <span>SECURITY ANALYSIS</span>
        <span id="strength-label">--</span>
      </div>
      <div class="score-bar">
        <div class="score-fill" id="score-fill"></div>
      </div>
      <div class="metric">
        <span class="label">Entropy:</span>
        <span class="value" id="entropy-val">0 bits</span>
      </div>
      <div class="metric">
        <span class="label">Crack Time:</span>
        <span class="value" id="crack-val">N/A</span>
      </div>
      <div class="metric breach" id="breach-container" style="display:none;">
        <span>Breached:</span>
        <span id="breach-count">0 times</span>
      </div>
      <ul class="suggestions" id="suggestions"></ul>
    `;
    
    this.shadow.appendChild(content);
    document.body.appendChild(container);
    this.panel = container;
  }

  position(inputElement) {
    // SAFETY CHECK: If inputElement is missing or panel isn't ready, stop.
    if (!inputElement || !this.panel) return;

    const rect = inputElement.getBoundingClientRect();
    const panelRect = this.panel.getBoundingClientRect();
    
    // Position logic (top or bottom depending on space)
    let top = window.scrollY + rect.bottom + 5;
    let left = window.scrollX + rect.left;

    // Prevent going off-screen
    if (left + 280 > window.innerWidth) {
        left = window.innerWidth - 290;
    }

    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
  }

  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
      this.isVisible = true;
    }
  }

  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
      this.isVisible = false;
    }
  }

  update(data, breachData) {
    if (!this.panel) return;

    // Score Mapping
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const colors = ['#FF0000', '#FFA500', '#FFFF00', '#90EE90', '#00FF41'];
    
    // Update UI Elements
    const label = data.score >= 0 ? labels[data.score] : '--';
    this.shadow.getElementById('strength-label').innerText = label;
    this.shadow.getElementById('strength-label').style.color = colors[data.score] || '#fff';
    
    const fill = this.shadow.getElementById('score-fill');
    fill.style.width = `${(data.score + 1) * 20}%`;
    fill.style.backgroundColor = colors[data.score] || '#333';

    this.shadow.getElementById('entropy-val').innerText = `${Math.round(data.entropy)} bits`;
    this.shadow.getElementById('crack-val').innerText = data.crackTime;

    // Breach Logic
    const breachDiv = this.shadow.getElementById('breach-container');
    if (breachData && breachData.found) {
      breachDiv.style.display = 'flex';
      breachDiv.className = 'metric breach';
      this.shadow.getElementById('breach-count').innerText = `${breachData.count.toLocaleString()} times`;
    } else if (breachData && !breachData.found) {
      breachDiv.style.display = 'flex';
      breachDiv.className = 'metric safe';
      this.shadow.getElementById('breach-count').innerText = 'Not Found';
    } else {
      breachDiv.style.display = 'none';
    }

    // Suggestions
    const sugList = this.shadow.getElementById('suggestions');
    sugList.innerHTML = '';
    if (data.suggestions && data.suggestions.length > 0) {
      data.suggestions.forEach(s => {
        const li = document.createElement('li');
        li.innerText = s;
        sugList.appendChild(li);
      });
    }
  }
}

window.FloatingPanel = FloatingPanel;
