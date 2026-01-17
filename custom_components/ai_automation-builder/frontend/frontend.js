import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0?module";

class AIAutomationBuilderCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
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
    this.lang = 'it';
    this.componentVersion = '2.0.0'; // Versione del componente (fallback)
    this.loadComponentVersion(); // Carica versione dinamicamente
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.hass) {
      this.lang = this.hass.locale?.language || 'it';
    }
  }

  setConfig(config) {
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.lang = hass?.locale?.language || 'it';
  }

  get hass() {
    return this._hass;
  }

  get translations() {
    return {
      it: {
        title: '🧠 AI Automation Builder',
        connected: 'Connesso',
        version: 'v',
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
        version: 'v',
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
    return this.translations[this.lang] || this.translations.en;
  }

  async generateAutomation() {
    const prompt = this.shadowRoot.querySelector('#prompt-input')?.value;
    if (!prompt) {
      this.showNotification(this.t.error + ' - ' + this.t.placeholder, 'error');
      return;
    }

    this.isLoading = true;
    this.requestUpdate();
    try {
      const result = await this.callWebSocket('ai_automation_builder/build_automation', {
        prompt: prompt
      });
      if (result.success) {
        this.yamlOutput = result.yaml;
        this.currentTab = 'yaml';
        this.showNotification(this.t.success + ' - Automazione generata!', 'success');
        this.requestUpdate();
      } else {
        this.showNotification(this.t.error + ': ' + (result.error || 'Unknown'), 'error');
      }
    } catch (error) {
      this.showNotification(this.t.error + ': ' + error.message, 'error');
      console.error('WebSocket error:', error);
    } finally {
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  async validateYAML() {
    if (!this.yamlOutput) {
      this.showNotification(this.t.error + ' - Genera prima un\'automazione', 'error');
      return;
    }

    try {
      const result = await this.callWebSocket('ai_automation_builder/validate_yaml', {
        yaml: this.yamlOutput
      });
      this.validationResult = result;
      this.currentTab = 'validate';
      this.requestUpdate();
    } catch (error) {
      this.showNotification(this.t.error + ': ' + error.message, 'error');
    }
  }

  exportYAML() {
    if (!this.yamlOutput) {
      this.showNotification(this.t.error + ' - Nulla da esportare', 'error');
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
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.requestUpdate();
  }

  async callWebSocket(command, data = {}) {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      const messageHandler = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            this.hass.connection.removeEventListener('message', messageHandler);
            if (msg.type === 'result') {
              resolve(msg.result);
            } else if (msg.type === 'error') {
              reject(new Error(msg.error?.message || 'WebSocket error'));
            }
          }
        } catch (e) {
          // Ignore
        }
      };
      this.hass.connection.addEventListener('message', messageHandler);
      this.hass.connection.sendMessage({
        id: id,
        type: command,
        ...data
      });
      setTimeout(() => reject(new Error('Timeout')), 30000);
    });
  }

  async loadComponentVersion() {
    try {
      const result = await this.callWebSocket('ai_automation_builder/get_version', {});
      if (result.version) {
        this.componentVersion = result.version;
        this.requestUpdate(); // Aggiorna la UI con la nuova versione
      }
    } catch (error) {
      console.error('Error loading component version:', error);
      // Mantieni la versione di fallback
    }
  }

  showNotification(message, type) {
    if (this.hass?.callService) {
      this.hass.callService('persistent_notification', 'create', {
        notification_id: 'ai_automation_builder',
        message: message,
        title: 'AI Automation Builder'
      });
    } else {
      console.log(message);
    }
  }

  render() {
    return html`
      <ha-card>
        <div class="card-header">
          <div class="header-content">
            <h2>${this.t.title}</h2>
            <span class="status">✓ ${this.t.connected} ${this.t.version}${this.componentVersion}</span>
          </div>
        </div>
        <div class="card-content">
          <div class="input-section">
            <textarea id="prompt-input" placeholder="${this.t.placeholder}"></textarea>
            <div class="button-group">
              <button class="btn btn-primary" @click="${this.generateAutomation.bind(this)}" ?disabled="${this.isLoading}">
                ${this.isLoading ? this.t.generating : this.t.generate}
              </button>
              <button class="btn btn-secondary" @click="${this.validateYAML.bind(this)}">
                ${this.t.validate}
              </button>
              <button class="btn btn-secondary" @click="${this.exportYAML.bind(this)}">
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
              <div class="flow-node">📝 Input</div>
              <div class="flow-node">→</div>
              <div class="flow-node">🤖 AI Process</div>
              <div class="flow-node">→</div>
              <div class="flow-node">✅ Validation</div>
              <div class="flow-node">→</div>
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
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host {
        --primary-color: #00d4ff;
        --accent-color: #ff6b35;
        --bg-color: #0a0a0f;
        --card-bg: #151520;
        --text-color: #e0e0e0;
      }

      ha-card {
        background: var(--card-bg);
        color: var(--text-color);
        border-radius: 16px;
        padding: 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .card-header {
        padding: 24px;
        border-bottom: 1px solid #333;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-header h2 {
        margin: 0;
        font-size: 24px;
        background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .status {
        padding: 8px 16px;
        border-radius: 20px;
        background: #28a745;
        font-size: 12px;
        font-weight: bold;
      }

      .card-content {
        padding: 24px;
      }

      .input-section textarea {
        width: 100%;
        height: 120px;
        background: #1a1a25;
        border: 2px solid #333;
        border-radius: 12px;
        padding: 16px;
        color: var(--text-color);
        font-family: monospace;
        font-size: 14px;
        resize: vertical;
        margin-bottom: 16px;
        box-sizing: border-box;
      }

      .input-section textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
      }

      .button-group {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }

      .btn {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 25px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--primary-color), #0099cc);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
      }

      .btn-secondary {
        background: #333;
        color: var(--text-color);
      }

      .btn-secondary:hover:not(:disabled) {
        background: var(--accent-color);
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
        margin-top: 16px;
      }

      .templates-label {
        font-size: 12px;
        color: #888;
        font-weight: bold;
      }

      .template-btn {
        background: #333;
        color: var(--text-color);
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .template-btn:hover {
        background: var(--accent-color);
        transform: translateY(-1px);
      }

      .tabs {
        display: flex;
        gap: 8px;
        margin: 24px 0;
        border-radius: 12px;
        padding: 4px;
        background: #222;
      }

      .tab-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        background: transparent;
        color: #888;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tab-btn.active {
        background: var(--primary-color);
        color: white;
      }

      .flow-diagram {
        display: flex;
        gap: 16px;
        padding: 24px;
        background: linear-gradient(135deg, #1a1a25, #222);
        border-radius: 16px;
        justify-content: space-around;
      }

      .flow-node {
        flex: 1;
        padding: 20px;
        text-align: center;
        border-radius: 12px;
        background: #2a2a3a;
        opacity: 0.5;
        transition: all 0.3s;
      }

      .yaml-output {
        background: #1a1a25;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 16px;
        font-family: monospace;
        white-space: pre-wrap;
        max-height: 400px;
        overflow-y: auto;
        margin: 0;
        color: #00d4ff;
      }

      .validation-section {
        padding: 16px;
        border-radius: 8px;
        background: #1a1a25;
      }

      .valid-message {
        color: #28a745;
        padding: 16px;
        background: rgba(40, 167, 69, 0.1);
        border-radius: 8px;
        border-left: 4px solid #28a745;
      }

      .error-message {
        color: #dc3545;
        padding: 16px;
        background: rgba(220, 53, 69, 0.1);
        border-radius: 8px;
        border-left: 4px solid #dc3545;
        font-family: monospace;
        white-space: pre-wrap;
      }

      @media (max-width: 768px) {
        ha-card {
          border-radius: 8px;
        }
        .flow-diagram {
          flex-direction: column;
        }
        .button-group {
          flex-direction: column;
        }
        .btn {
          width: 100%;
        }
      }
    `;
  }
}

customElements.define('ai-automation-builder-card', AIAutomationBuilderCard);