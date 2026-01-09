class AIAutomationBuilder {
    constructor() {
        this.hass = null;
        this.config = null;
        this.currentTab = 'generate';
        this.templates = {
            it: {
                luci: { name: 'Luci notturne', prompt: 'Accendi le luci del salotto alle 20:00 solo se sono scuro' },
                intrusione: { name: 'Antintrusione', prompt: 'Invia notifica se porta aperta di notte' },
                lavatrice: { name: 'Lavatrice finita', prompt: 'Notificami quando la lavatrice ha finito' }
            },
            en: {
                lights: { name: 'Night lights', prompt: 'Turn on living room lights at 8 PM only if dark' },
                intrusion: { name: 'Intrusion alert', prompt: 'Send notification if door opens at night' },
                washer: { name: 'Washer done', prompt: 'Notify me when washing machine is done' }
            }
        };
    }

    async init(hass) {
        this.hass = hass;
        this.lang = hass.locale?.language || 'it';
        this.setupEventListeners();
        this.renderTemplates();
        this.updateUIText();
    }

    setupEventListeners() {
        // Pulsante Genera
        document.getElementById('generate-btn')?.addEventListener('click', () => this.generateAutomation());
        
        // Pulsante Export
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportYAML());
        
        // Pulsante Valida
        document.getElementById('validate-btn')?.addEventListener('click', () => this.validateYAML());
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                document.getElementById('prompt-input').value = prompt;
            });
        });
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-content`);
        });
        
        this.currentTab = tabName;
        
        // Update flow diagram when switching to flow tab
        if (tabName === 'flow') {
            this.updateFlowDiagram();
        }
    }

    async generateAutomation() {
        const prompt = document.getElementById('prompt-input')?.value;
        
        if (!prompt) {
            this.showError('❌ Inserisci una descrizione');
            return;
        }
        
        const btn = document.getElementById('generate-btn');
        btn.disabled = true;
        btn.textContent = '⏳ Generando...';
        
        try {
            const result = await this.callWebSocket('ai_automation_builder/build_automation', {
                prompt: prompt
            });
            
            if (result.success) {
                document.getElementById('yaml-output').textContent = result.yaml;
                this.switchTab('yaml');
                this.showSuccess('✅ Automazione generata!');
                
                // Auto-activate relevant flow nodes
                this.updateFlowDiagram();
            } else {
                this.showError('❌ Errore generazione: ' + (result.error || 'Sconosciuto'));
            }
        } catch (error) {
            this.showError('❌ Errore: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = this.lang === 'it' ? '🧠 Genera Automazione' : '🧠 Generate Automation';
        }
    }

    async validateYAML() {
        const yaml = document.getElementById('yaml-output')?.textContent;
        
        if (!yaml) {
            this.showError('❌ Genera prima un\'automazione');
            return;
        }
        
        try {
            const result = await this.callWebSocket('ai_automation_builder/validate_yaml', {
                yaml: yaml
            });
            
            const validationDiv = document.getElementById('validation-result');
            
            if (result.valid) {
                validationDiv.innerHTML = '<div class="valid">✅ YAML valido! Pronto per salvare.</div>';
                this.switchTab('validate');
            } else {
                validationDiv.innerHTML = `<div class="error">❌ Errore: ${result.error}</div>`;
                this.switchTab('validate');
            }
        } catch (error) {
            this.showError('❌ Errore validazione: ' + error.message);
        }
    }

    exportYAML() {
        const yaml = document.getElementById('yaml-output')?.textContent;
        
        if (!yaml) {
            this.showError('❌ Nulla da esportare');
            return;
        }
        
        // Copia negli appunti
        navigator.clipboard.writeText(yaml).then(() => {
            this.showSuccess('📋 Copiato negli appunti!');
            
            // Apri automazioni HA
            setTimeout(() => {
                window.location.href = '/config/automation/dashboard';
            }, 1500);
        }).catch(() => {
            this.showError('❌ Errore copia');
        });
    }

    updateFlowDiagram() {
        const nodes = document.querySelectorAll('.flow-node');
        nodes.forEach((node, index) => {
            node.classList.toggle('active', index < 3); // Primi 3 nodi attivi se YAML presente
        });
    }

    renderTemplates() {
        const templatesContainer = document.querySelector('.templates');
        const templates = this.templates[this.lang] || this.templates.en;
        
        templatesContainer.innerHTML = '';
        Object.values(templates).forEach(template => {
            const btn = document.createElement('button');
            btn.className = 'template-btn';
            btn.textContent = template.name;
            btn.dataset.prompt = template.prompt;
            btn.addEventListener('click', () => {
                document.getElementById('prompt-input').value = template.prompt;
                this.generateAutomation();
            });
            templatesContainer.appendChild(btn);
        });
    }

    updateUIText() {
        const texts = {
            it: {
                title: '🧠 AI Automation Builder',
                status: 'Connesso',
                prompt: 'Descrivi l\'automazione...',
                generate: '🧠 Genera Automazione',
                export: '📥 Esporta',
                validate: '✅ Valida',
                flow: '📊 Flow',
                yaml: '📝 YAML',
                validation: '✅ Validazione'
            },
            en: {
                title: '🧠 AI Automation Builder',
                status: 'Connected',
                prompt: 'Describe your automation...',
                generate: '🧠 Generate Automation',
                export: '📥 Export',
                validate: '✅ Validate',
                flow: '📊 Flow',
                yaml: '📝 YAML',
                validation: '✅ Validation'
            }
        };
        
        const t = texts[this.lang] || texts.en;
        
        document.querySelector('.header h1').textContent = t.title;
        document.querySelector('.status').textContent = t.status;
        document.getElementById('prompt-input').placeholder = t.prompt;
    }

    async callWebSocket(command, data = {}) {
        return new Promise((resolve, reject) => {
            const id = Math.random();
            
            this.hass.connection.addEventListener('message', (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.id === id) {
                        if (msg.type === 'result') {
                            resolve(msg.result);
                        } else if (msg.type === 'error') {
                            reject(new Error(msg.error?.message || 'WebSocket error'));
                        }
                    }
                } catch (e) {
                    // Ignore non-JSON messages
                }
            });
            
            this.hass.connection.sendMessage({
                id: id,
                type: command,
                ...data
            });
            
            // Timeout after 30s
            setTimeout(() => reject(new Error('Timeout')), 30000);
        });
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notifContainer = document.getElementById('notification') || this.createNotification();
        notifContainer.textContent = message;
        notifContainer.className = type === 'success' ? 'valid' : 'error';
        notifContainer.style.display = 'block';
        
        setTimeout(() => {
            notifContainer.style.display = 'none';
        }, 3000);
    }

    createNotification() {
        const div = document.createElement('div');
        div.id = 'notification';
        div.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 16px; border-radius: 8px;';
        document.body.appendChild(div);
        return div;
    }
}

// Inizializza quando disponibile
window.AIAutomationBuilder = new AIAutomationBuilder();

// Export per Home Assistant
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAutomationBuilder;
}
