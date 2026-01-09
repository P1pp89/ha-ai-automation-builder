// Supporto lingua automatica HA
const lang = window.hass?.locale?.language || 'it';
const translations = {
  it: {
    generate: '🧠 Genera Automazione',
    flow: '📊 Flow',
    yaml: '📝 YAML',
    validate: '✅ Validazione',
    magic_install: '🪄 Installa Ollama Ora'
  },
  en: {
    generate: '🧠 Generate Automation',
    flow: '📊 Flow',
    yaml: '📝 YAML',
    validate: '✅ Validation',
    magic_install: '🪄 Install Ollama Now'
  }
};

// Applica lingua
document.getElementById('generate-btn').textContent = translations[lang].generate;

// Pulsante MAGIC auto-install
document.getElementById('magic-install').onclick = async () => {
  await this.callWS('ai_automation_builder.install_ollama');
  location.reload();
};