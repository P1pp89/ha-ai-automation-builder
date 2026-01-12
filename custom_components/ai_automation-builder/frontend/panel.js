import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0?module";

class AIAutomationBuilderPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      narrow: { type: Boolean },
      route: { type: Object },
      currentTab: { type: String },
      yamlOutput: { type: String },
      validationResult: { type: Object },
      isLoading: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.currentTab = 'generate';
    this.yamlOutput = '';
    this.validationResult = null;
    this.isLoading = false;
  }

  get translations() {
    return {
      it: {
        title: '🧠 AI Automation Builder',
        connected: 'Connesso',
        placeholder: 'Descrivi l\'automazione (es: Accendi luci alle 20:00)...',
        generate: '🧠 Genera Automazione',
        export: '📥 Copia YAML',
        validate: '✅ Valida YAML',
        tabs: { flow: '📊 Flow', yaml: '📝 YAML', validate: '✅ Validazione' },
        templates: 'Template rapidi:',
        template1: 'Luci notturne',
        template2: 'Antintrusione',
        template3: 'Lavatrice',
        generating: '⏳ Generando...',
        error: '❌ Errore',
        success: '✅ Successo',
        validYaml: '✅ YAML valido!',
        invalidYaml: '❌ YAML non valido:'
      },
      en: {
        title: '🧠 AI Automation Builder',
        connected: 'Connected',
        placeholder: 'Describe your automation (e.g., Turn on lights at 8 PM)...',
        generate: '🧠 Generate Automation',
        export: '📥 Copy YAML',
        validate: '✅ Validate YAML',
        tabs: { flow: '📊 Flow', yaml: '📝 YAML', validate: '✅ Validation' },
        templates: 'Quick templates:',
        template1: 'Night lights',
        template2: 'Intrusion alert',
        template3: 'Washer done',
        generating: '⏳ Generating...',
        error: '❌ Error',
        success: '✅ Success',
        validYaml: '✅ YAML is valid!',
        invalidYaml: '❌ YAML is invalid:'
      }
    };
  }

  get t() {
    const lang = this.hass?.locale?.language || 'it';
    return this.translations[lang] || this.translations.en;
  }

  async generateAutomation() {
    const prompt = this.shadowRoot.querySelector('#prompt-input')?.value;
    if (!prompt) {
      this._showNotification(this.t.error + ' - ' + this.t.placeholder, 'error');
      return;
    }

    this.isLoading = true;
    this.requestUpdate();

    try {
      const result = await this._callWebSocket('ai_automation_builder/build_automation', {
        prompt: prompt
      });
      
      if (result.success) {
        this.yamlOutput = result.yaml;
        this.currentTab = 'yaml';
        this._showNotification(this.t.success + ' - Automazione generata!', 'success');
        this.requestUpdate();
      } else {
        this._showNotification(this.t.error + ': ' + (result.error || 'Unknown'), 'error');
      }
    } catch (error) {
      this._showNotification(this.t.error + ': ' + error.message, 'error');
      console.error('WebSocket error:', error);
    } finally {
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  async validateYAML() {
    if (!this.yamlOutput) {
      this._showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
      return;
    }

    try {
      const result = await this._callWebSocket('ai_automation_builder/validate_yaml', {
        yaml: this.yamlOutput
      });
      this.validationResult = result;
      this.currentTab = 'validate';
      this.requestUpdate();
    } catch (error) {
      this._showNotification(this.t.error + ': ' + error.message, 'error');
    }
  }

  exportYAML() {
  if (!this.yamlOutput) {
    this._showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
    return;
  }

  // Verifica se la Clipboard API è disponibile
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // ✅ Clipboard API disponibile
    navigator.clipboard.writeText(this.yamlOutput).then(() => {
      this._showNotification('✅ Codice copiato negli appunti!', 'success');
      setTimeout(() => {
        window.location.href = '/config/automation/dashboard';
      }, 1500);
    }).catch((err) => {
      console.error('Clipboard error:', err);
      this._showNotification('⚠️ Copia automatica fallita. Seleziona e copia manualmente.', 'warning');
      this.currentTab = 'yaml'; // Mostra il YAML per copia manuale
    });
  } else {
    // ❌ Clipboard API non disponibile (fallback)
    console.warn('Clipboard API non disponibile, fallback a selezione manuale');
    this._showNotification('⚠️ Copia automatica non disponibile. Seleziona e copia manualmente il codice.', 'warning');
    this.currentTab = 'yaml'; // Mostra il YAML per copia manuale
  }
}

  setTemplate(prompt) {
    const input = this.shadowRoot.querySelector('#prompt-input');
    if (input) {
      input.value = prompt;
      input.focus();
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.requestUpdate();
  }

  toggleMenu() {
    // Trigger Home Assistant menu
    const event = new CustomEvent('hass-toggle-menu', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  async _callWebSocket(command, data = {}) {
    return new Promise((resolve, reject) => {
      const messageId = Math.floor(Math.random() * 1000000);
      
      const messageHandler = (event) => {
        const msg = event.detail;
        if (msg.id === messageId) {
          this.hass.connection.removeEventListener('message', messageHandler);
          
          if (msg.success !== undefined || msg.type === 'result') {
            resolve(msg);
          } else if (msg.error) {
            reject(new Error(msg.error.message || 'WebSocket error'));
          }
        }
      };

      this.hass.connection.addEventListener('message', messageHandler);
      
      this.hass.connection.sendMessagePromise({
        id: messageId,
        type: command,
        ...data
      }).then(resolve).catch(reject);

      setTimeout(() => {
        this.hass.connection.removeEventListener('message', messageHandler);
        reject(new Error('Timeout - richiesta scaduta'));
      }, 60000);
    });
  }

  _showNotification(message, type) {
    if (this.hass?.callService) {
      this.hass.callService('persistent_notification', 'create', {
        notification_id: 'ai_automation_builder_' + Date.now(),
        message: message,
        title: 'AI Automation Builder'
      });
    } else {
      console.log(message);
    }
  }

  render() {
    return html`
      <div class="header-bar">
        <button class="menu-button" @click="${this.toggleMenu}">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
          </svg>
        </button>
        <h1>${this.t.title}</h1>
        <span class="status">✓ ${this.t.connected}</span>
      </div>

      <div class="container">
        <div class="input-section">
          <textarea id="prompt-input" placeholder="${this.t.placeholder}"></textarea>
          <div class="button-group">
            <button class="btn btn-primary" @click="${this.generateAutomation}" ?disabled="${this.isLoading}">
              ${this.isLoading ? this.t.generating : this.t.generate}
            </button>
            <button class="btn btn-secondary" @click="${this.validateYAML}">
              ${this.t.validate}
            </button>
            <button class="btn btn-secondary" @click="${this.exportYAML}">
              ${this.t.export}
            </button>
          </div>
          <div class="templates">
            <span class="templates-label">${this.t.templates}</span>
            <button class="template-btn" @click="${() => this.setTemplate('Accendi le luci del salotto alle 20:00')}">
              ${this.t.template1}
            </button>
            <button class="template-btn" @click="${() => this.setTemplate('Invia notifica se la porta si apre di notte')}">
              ${this.t.template2}
            </button>
            <button class="template-btn" @click="${() => this.setTemplate('Notificami quando la lavatrice ha finito')}">
              ${this.t.template3}
            </button>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn ${this.currentTab === 'flow' ? 'active' : ''}" @click="${() => this.switchTab('flow')}">
            ${this.t.tabs.flow}
          </button>
          <button class="tab-btn ${this.currentTab === 'yaml' ? 'active' : ''}" @click="${() => this.switchTab('yaml')}">
            ${this.t.tabs.yaml}
          </button>
          <button class="tab-btn ${this.currentTab === 'validate' ? 'active' : ''}" @click="${() => this.switchTab('validate')}">
            ${this.t.tabs.validate}
          </button>
        </div>

        ${this.currentTab === 'flow' ? html`
          <div class="flow-diagram">
            <div class="flow-node">🔍 Input</div>
            <div class="flow-arrow">↓</div>
            <div class="flow-node">🤖 AI Process</div>
            <div class="flow-arrow">↓</div>
            <div class="flow-node">✅ Validation</div>
            <div class="flow-arrow">↓</div>
            <div class="flow-node">💾 Save</div>
          </div>
        ` : ''}

        ${this.currentTab === 'yaml' ? html`
          <pre class="yaml-output">${this.yamlOutput || 'Genera un\'automazione per vedere il YAML...'}</pre>
        ` : ''}

        ${this.currentTab === 'validate' ? html`
          <div class="validation-section">
            ${this.validationResult ? html`
              ${this.validationResult.valid ? html`
                <div class="valid-message">✅ ${this.t.validYaml}</div>
              ` : html`
                <div class="error-message">${this.t.invalidYaml}\n${this.validationResult.error}</div>
              `}
            ` : html`
              <p>Valida il YAML per vedere i risultati...</p>
            `}
          </div>
        ` : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        --primary-color: #03dac6;
        --primary-dark: #018786;
        --accent-color: #cf6679;
        --bg-color: #121212;
        --surface-color: #1e1e1e;
        --text-color: #e1e1e1;
        --text-secondary: #b3b3b3;
        display: block;
        background-color: var(--bg-color);
        color: var(--text-color);
        height: 100vh;
        overflow: hidden;
        position: relative;
      }

      .header-bar {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        background: var(--surface-color);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: sticky;
        top: 0;
        z-index: 100;
        gap: 16px;
      }

      .menu-button {
        display: none;
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .menu-button:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      @media (max-width: 768px) {
        .menu-button {
          display: block;
        }
      }

      .header-bar h1 {
        margin: 0;
        font-size: 24px;
        flex: 1;
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .status {
        padding: 6px 16px;
        border-radius: 20px;
        background: #2e7d32;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      .container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
        height: calc(100vh - 73px);
        overflow-y: auto;
      }

      .input-section {
        background: var(--surface-color);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .input-section textarea {
        width: 100%;
        height: 120px;
        background: var(--bg-color);
        border: 2px solid rgba(3, 218, 198, 0.3);
        border-radius: 12px;
        padding: 16px;
        color: var(--text-color);
        font-family: 'Roboto Mono', monospace;
        font-size: 14px;
        resize: vertical;
        margin-bottom: 16px;
        box-sizing: border-box;
        transition: border-color 0.3s, box-shadow 0.3s;
      }

      .input-section textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 4px rgba(3, 218, 198, 0.2);
      }

      .button-group {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      @media (max-width: 640px) {
        .button-group {
          grid-template-columns: 1fr;
        }
      }

      .btn {
        padding: 14px 24px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }

      .btn:hover::before {
        width: 300px;
        height: 300px;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        color: #000;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(3, 218, 198, 0.4);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-color);
        backdrop-filter: blur(10px);
      }

      .btn-secondary:hover:not(:disabled) {
        background: rgba(207, 102, 121, 0.3);
        transform: translateY(-2px);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .templates {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }

      .templates-label {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .template-btn {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-color);
        border: 1px solid rgba(3, 218, 198, 0.3);
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .template-btn:hover {
        background: rgba(3, 218, 198, 0.2);
        border-color: var(--primary-color);
        transform: translateY(-2px);
      }

      .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
        border-radius: 12px;
        padding: 4px;
        background: var(--surface-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .tab-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: 500;
      }

      .tab-btn.active {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        color: #000;
        box-shadow: 0 4px 12px rgba(3, 218, 198, 0.3);
      }

      .flow-diagram {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 32px;
        background: linear-gradient(135deg, var(--surface-color), rgba(30, 30, 30, 0.8));
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .flow-node {
        padding: 24px;
        text-align: center;
        border-radius: 12px;
        background: rgba(3, 218, 198, 0.1);
        border: 2px solid rgba(3, 218, 198, 0.3);
        font-weight: 600;
        transition: all 0.3s;
      }

      .flow-node:hover {
        background: rgba(3, 218, 198, 0.2);
        transform: scale(1.05);
      }

      .flow-arrow {
        text-align: center;
        font-size: 24px;
        color: var(--primary-color);
      }

      .yaml-output {
        background: var(--bg-color);
        border: 2px solid rgba(3, 218, 198, 0.3);
        border-radius: 12px;
        padding: 20px;
        font-family: 'Roboto Mono', monospace;
        white-space: pre-wrap;
        max-height: 500px;
        overflow-y: auto;
        margin: 0;
        color: var(--primary-color);
        line-height: 1.6;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .validation-section {
        padding: 24px;
        border-radius: 12px;
        background: var(--surface-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      .valid-message {
        color: #4caf50;
        padding: 20px;
        background: rgba(76, 175, 80, 0.1);
        border-radius: 12px;
        border-left: 4px solid #4caf50;
        font-weight: 600;
      }

      .error-message {
        color: #f44336;
        padding: 20px;
        background: rgba(244, 67, 54, 0.1);
        border-radius: 12px;
        border-left: 4px solid #f44336;
        font-family: 'Roboto Mono', monospace;
        white-space: pre-wrap;
      }

      @media (max-width: 768px) {
        .container {
          padding: 16px;
        }
        
        .header-bar {
          padding: 12px 16px;
        }
        
        .header-bar h1 {
          font-size: 18px;
        }
        
        .flow-diagram {
          padding: 16px;
        }
        
        .status {
          font-size: 10px;
          padding: 4px 12px;
        }
      }
    `;
  }
}

customElements.define('ai-automation-builder-panel', AIAutomationBuilderPanel);