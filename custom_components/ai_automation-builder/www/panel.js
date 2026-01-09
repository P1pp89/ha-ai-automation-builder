import { html, LitElement, css } from "https://unpkg.com/lit@2.8.0?module";

class AIAutomationBuilderPanel extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            narrow: { type: Boolean },
            currentTab: { type: String },
            yamlOutput: { type: String },
            validationResult: { type: Object },
            isLoading: { type: Boolean },
            prompt: { type: String }
        };
    }

    constructor() {
        super();
        this.currentTab = 'generate';
        this.yamlOutput = '';
        this.validationResult = null;
        this.isLoading = false;
        this.prompt = '';
        this.lang = 'it';
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.hass) {
            this.lang = this.hass.locale?.language || 'it';
        }
    }

    get translations() {
        return {
            it: {
                title: '🧠 AI Automation Builder',
                subtitle: 'Genera automazioni Home Assistant con IA',
                connected: 'Connesso',
                placeholder: 'Descrivi l\'automazione (es: Accendi luci alle 20:00 se scuro)...',
                generate: '🧠 Genera Automazione',
                export: '📥 Esporta YAML',
                validate: '✅ Valida YAML',
                save: '💾 Salva Automazione',
                tabs: { 
                    generate: '🧠 Genera', 
                    flow: '📊 Flow', 
                    yaml: '📝 YAML', 
                    validate: '✅ Validazione' 
                },
                templates: 'Template rapidi:',
                template1: '💡 Luci notturne',
                template2: '🚪 Antintrusione',
                template3: '🧺 Lavatrice',
                generating: '⏳ Generando...',
                copying: '📋 Copiando...',
                error: '❌ Errore',
                success: '✅ Successo',
                validYaml: '✅ YAML valido e pronto per salvare!',
                invalidYaml: '❌ YAML non valido:',
                noYaml: 'Genera un\'automazione per vedere il YAML...',
                noValidation: 'Valida il YAML per vedere i risultati...',
                copied: 'YAML copiato negli appunti!',
                enterPrompt: 'Inserisci una descrizione'
            },
            en: {
                title: '🧠 AI Automation Builder',
                subtitle: 'Generate Home Assistant automations with AI',
                connected: 'Connected',
                placeholder: 'Describe your automation (e.g., Turn on lights at 8 PM if dark)...',
                generate: '🧠 Generate Automation',
                export: '📥 Export YAML',
                validate: '✅ Validate YAML',
                save: '💾 Save Automation',
                tabs: { 
                    generate: '🧠 Generate', 
                    flow: '📊 Flow', 
                    yaml: '📝 YAML', 
                    validate: '✅ Validation' 
                },
                templates: 'Quick templates:',
                template1: '💡 Night lights',
                template2: '🚪 Intrusion alert',
                template3: '🧺 Washer done',
                generating: '⏳ Generating...',
                copying: '📋 Copying...',
                error: '❌ Error',
                success: '✅ Success',
                validYaml: '✅ YAML is valid and ready to save!',
                invalidYaml: '❌ YAML is invalid:',
                noYaml: 'Generate an automation to see the YAML...',
                noValidation: 'Validate the YAML to see results...',
                copied: 'YAML copied to clipboard!',
                enterPrompt: 'Enter a description'
            }
        };
    }

    get t() {
        return this.translations[this.lang] || this.translations.en;
    }

    async generateAutomation() {
        if (!this.prompt.trim()) {
            this.showToast(this.t.enterPrompt, 'warning');
            return;
        }

        this.isLoading = true;
        this.requestUpdate();

        try {
            const result = await this.callWebSocket('ai_automation_builder/build_automation', {
                prompt: this.prompt
            });

            if (result.success) {
                this.yamlOutput = result.yaml;
                this.currentTab = 'yaml';
                this.showToast(this.t.success + ' - Automazione generata!', 'success');
                this.requestUpdate();
            } else {
                this.showToast(this.t.error + ': ' + (result.error || 'Unknown'), 'error');
            }
        } catch (error) {
            this.showToast(this.t.error + ': ' + error.message, 'error');
            console.error('WebSocket error:', error);
        } finally {
            this.isLoading = false;
            this.requestUpdate();
        }
    }

    async validateYAML() {
        if (!this.yamlOutput) {
            this.showToast(this.t.error + ' - Genera prima un\'automazione', 'error');
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
            this.showToast(this.t.error + ': ' + error.message, 'error');
        }
    }

    async exportYAML() {
        if (!this.yamlOutput) {
            this.showToast(this.t.error + ' - Nulla da esportare', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.yamlOutput);
            this.showToast(this.t.copied, 'success');
            
            // Redirect dopo 1 secondo
            setTimeout(() => {
                window.location.href = '/config/automation/dashboard';
            }, 1000);
        } catch (error) {
            this.showToast(this.t.error + ' - Copia fallita', 'error');
        }
    }

    setTemplate(templatePrompt) {
        this.prompt = templatePrompt;
        this.requestUpdate();
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
                    // Ignore parse errors
                }
            };

            this.hass.connection.addEventListener('message', messageHandler);

            this.hass.connection.sendMessage({
                id: id,
                type: command,
                ...data
            });

            // Timeout after 30s
            setTimeout(() => {
                this.hass.connection.removeEventListener('message', messageHandler);
                reject(new Error('Request timeout'));
            }, 30000);
        });
    }

    showToast(message, type = 'info') {
        if (this.hass?.callService) {
            this.hass.callService('persistent_notification', 'create', {
                notification_id: 'ai_automation_builder',
                message: message,
                title: 'AI Automation Builder'
            });
        }
    }

    render() {
        return html`
            <ha-app-layout>
                <app-header slot="header" fixed>
                    <app-toolbar>
                        <ha-menu-button 
                            .hass="${this.hass}"
                            .narrow="${this.narrow}"
                        ></ha-menu-button>
                        <div main-title>${this.t.title}</div>
                        <div class="status-badge">${this.t.connected}</div>
                    </app-toolbar>
                </app-header>

                <div class="content">
                    <div class="container">
                        <!-- Header -->
                        <div class="panel-header">
                            <h1>${this.t.title}</h1>
                            <p>${this.t.subtitle}</p>
                        </div>

                        <!-- Main Card -->
                        <ha-card>
                            <!-- Input Section -->
                            <div class="card-content">
                                <div class="input-section">
                                    <textarea
                                        id="prompt-input"
                                        .value="${this.prompt}"
                                        @input="${(e) => this.prompt = e.target.value}"
                                        placeholder="${this.t.placeholder}"
                                        ?disabled="${this.isLoading}"
                                    ></textarea>

                                    <!-- Button Group -->
                                    <div class="button-group">
                                        <button
                                            class="btn btn-primary"
                                            @click="${this.generateAutomation}"
                                            ?disabled="${this.isLoading}"
                                        >
                                            ${this.isLoading ? this.t.generating : this.t.generate}
                                        </button>
                                        <button
                                            class="btn btn-secondary"
                                            @click="${this.validateYAML}"
                                            ?disabled="${!this.yamlOutput}"
                                        >
                                            ${this.t.validate}
                                        </button>
                                        <button
                                            class="btn btn-secondary"
                                            @click="${this.exportYAML}"
                                            ?disabled="${!this.yamlOutput}"
                                        >
                                            ${this.t.export}
                                        </button>
                                    </div>

                                    <!-- Templates -->
                                    <div class="templates">
                                        <span class="templates-label">${this.t.templates}</span>
                                        <button 
                                            class="template-btn" 
                                            @click="${() => this.setTemplate('Accendi tutte le luci del salotto alle 20:00')}"
                                        >
                                            ${this.t.template1}
                                        </button>
                                        <button 
                                            class="template-btn"
                                            @click="${() => this.setTemplate('Invia notifica se la porta principale si apre tra le 22:00 e le 06:00')}"
                                        >
                                            ${this.t.template2}
                                        </button>
                                        <button 
                                            class="template-btn"
                                            @click="${() => this.setTemplate('Notificami con suono quando il sensore di umidità della lavatrice scende sotto 30%')}"
                                        >
                                            ${this.t.template3}
                                        </button>
                                    </div>
                                </div>

                                <!-- Tabs -->
                                <div class="tabs">
                                    <button
                                        class="tab-btn ${this.currentTab === 'generate' ? 'active' : ''}"
                                        @click="${() => this.switchTab('generate')}"
                                    >
                                        ${this.t.tabs.generate}
                                    </button>
                                    <button
                                        class="tab-btn ${this.currentTab === 'flow' ? 'active' : ''}"
                                        @click="${() => this.switchTab('flow')}"
                                    >
                                        ${this.t.tabs.flow}
                                    </button>
                                    <button
                                        class="tab-btn ${this.currentTab === 'yaml' ? 'active' : ''}"
                                        @click="${() => this.switchTab('yaml')}"
                                    >
                                        ${this.t.tabs.yaml}
                                    </button>
                                    <button
                                        class="tab-btn ${this.currentTab === 'validate' ? 'active' : ''}"
                                        @click="${() => this.switchTab('validate')}"
                                    >
                                        ${this.t.tabs.validate}
                                    </button>
                                </div>

                                <!-- Tab Contents -->
                                <div class="tab-contents">
                                    <!-- Flow Tab -->
                                    ${this.currentTab === 'flow' ? html`
                                        <div class="flow-diagram">
                                            <div class="flow-node ${this.yamlOutput ? 'active' : ''}">
                                                <div class="flow-icon">📝</div>
                                                <div class="flow-label">Input</div>
                                            </div>
                                            <div class="flow-arrow">→</div>
                                            <div class="flow-node ${this.yamlOutput ? 'active' : ''}">
                                                <div class="flow-icon">🤖</div>
                                                <div class="flow-label">AI Process</div>
                                            </div>
                                            <div class="flow-arrow">→</div>
                                            <div class="flow-node ${this.yamlOutput ? 'active' : ''}">
                                                <div class="flow-icon">✅</div>
                                                <div class="flow-label">Validation</div>
                                            </div>
                                            <div class="flow-arrow">→</div>
                                            <div class="flow-node">
                                                <div class="flow-icon">💾</div>
                                                <div class="flow-label">Save</div>
                                            </div>
                                        </div>
                                    ` : ''}

                                    <!-- YAML Tab -->
                                    ${this.currentTab === 'yaml' ? html`
                                        <pre class="yaml-output">${this.yamlOutput || this.t.noYaml}</pre>
                                    ` : ''}

                                    <!-- Validation Tab -->
                                    ${this.currentTab === 'validate' ? html`
                                        <div class="validation-section">
                                            ${this.validationResult ? html`
                                                ${this.validationResult.valid ? html`
                                                    <div class="valid-message">
                                                        <ha-icon icon="mdi:check-circle"></ha-icon>
                                                        ${this.t.validYaml}
                                                    </div>
                                                ` : html`
                                                    <div class="error-message">
                                                        <ha-icon icon="mdi:alert-circle"></ha-icon>
                                                        ${this.t.invalidYaml}
                                                        <code>${this.validationResult.error}</code>
                                                    </div>
                                                `}
                                            ` : html`
                                                <p>${this.t.noValidation}</p>
                                            `}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </ha-card>
                    </div>
                </div>
            </ha-app-layout>
        `;
    }

    static get styles() {
        return css`
            :host {
                --primary-color: #00d4ff;
                --accent-color: #ff6b35;
                --bg-color: var(--primary-background-color);
                --card-bg: var(--ha-card-background);
                --text-color: var(--primary-text-color);
            }

            ha-app-layout {
                height: 100vh;
            }

            app-header {
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                color: white;
            }

            app-toolbar {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .status-badge {
                padding: 6px 12px;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.2);
                font-size: 12px;
                font-weight: bold;
            }

            .content {
                padding: 24px;
                background: var(--bg-color);
                overflow-y: auto;
            }

            .container {
                max-width: 1000px;
                margin: 0 auto;
            }

            .panel-header {
                text-align: center;
                margin-bottom: 32px;
            }

            .panel-header h1 {
                margin: 0 0 8px 0;
                font-size: 32px;
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .panel-header p {
                margin: 0;
                color: var(--secondary-text-color);
                font-size: 16px;
            }

            ha-card {
                background: var(--card-bg);
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .card-content {
                padding: 24px;
            }

            .input-section textarea {
                width: 100%;
                height: 140px;
                padding: 16px;
                border: 2px solid var(--divider-color);
                border-radius: 12px;
                background: var(--bg-color);
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
                font-size: 14px;
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
                background: var(--secondary-background-color);
                color: var(--text-color);
            }

            .btn-secondary:hover:not(:disabled) {
                background: var(--accent-color);
                color: white;
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
                font-weight: bold;
                color: var(--secondary-text-color);
            }

            .template-btn {
                background: var(--secondary-background-color);
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
                color: white;
                transform: translateY(-1px);
            }

            .tabs {
                display: flex;
                gap: 8px;
                margin: 24px 0;
                border-bottom: 2px solid var(--divider-color);
            }

            .tab-btn {
                flex: 1;
                padding: 12px 16px;
                border: none;
                background: transparent;
                color: var(--secondary-text-color);
                cursor: pointer;
                transition: all 0.2s;
                border-bottom: 3px solid transparent;
            }

            .tab-btn.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
            }

            .tab-contents {
                padding: 24px 0;
            }

            .flow-diagram {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 24px;
                background: var(--bg-color);
                border-radius: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .flow-node {
                flex: 0 1 120px;
                padding: 20px;
                text-align: center;
                border-radius: 12px;
                background: var(--secondary-background-color);
                opacity: 0.5;
                transition: all 0.3s;
            }

            .flow-node.active {
                background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                opacity: 1;
                transform: scale(1.05);
                box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
            }

            .flow-icon {
                font-size: 32px;
                margin-bottom: 8px;
            }

            .flow-label {
                font-size: 12px;
                font-weight: bold;
            }

            .flow-arrow {
                font-size: 24px;
                opacity: 0.3;
            }

            .yaml-output {
                background: var(--bg-color);
                border: 1px solid var(--divider-color);
                border-radius: 8px;
                padding: 16px;
                font-family: monospace;
                white-space: pre-wrap;
                word-wrap: break-word;
                max-height: 500px;
                overflow-y: auto;
                margin: 0;
                color: var(--accent-color);
            }

            .validation-section {
                padding: 16px;
                border-radius: 8px;
                background: var(--bg-color);
            }

            .valid-message {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #28a745;
                padding: 16px;
                background: rgba(40, 167, 69, 0.1);
                border-radius: 8px;
                border-left: 4px solid #28a745;
            }

            .error-message {
                display: flex;
                flex-direction: column;
                gap: 12px;
                color: #dc3545;
                padding: 16px;
                background: rgba(220, 53, 69, 0.1);
                border-radius: 8px;
                border-left: 4px solid #dc3545;
            }

            .error-message code {
                background: var(--bg-color);
                padding: 8px;
                border-radius: 4px;
                font-family: monospace;
                white-space: pre-wrap;
            }

            ha-icon {
                width: 24px;
                height: 24px;
            }

            @media (max-width: 768px) {
                .content {
                    padding: 12px;
                }

                .panel-header h1 {
                    font-size: 24px;
                }

                .button-group {
                    flex-direction: column;
                }

                .btn {
                    width: 100%;
                }

                .flow-diagram {
                    flex-direction: column;
                }

                .flow-arrow {
                    transform: rotate(90deg);
                }

                .tabs {
                    flex-wrap: wrap;
                }
            }
        `;
    }
}

customElements.define('ai-automation-builder-panel', AIAutomationBuilderPanel);

// Register as custom panel
window.customPanelRegistry = window.customPanelRegistry || {};
window.customPanelRegistry['ai_automation_builder'] = AIAutomationBuilderPanel;