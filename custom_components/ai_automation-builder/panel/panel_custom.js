class AiAutomationBuilderPanel extends HTMLElement {
  hass;
  narrow;

  setConfig(config) {
    // Config da manifest.json
  }

  set hass(hass) {
    this._hass = hass;
    // Inizializza lingua hass.locale.language
  }

  getCardSize() {
    return 4;
  }
}

customElements.define('ai-automation-builder-panel', AiAutomationBuilderPanel);

window.setCustomPanel('ai_automation_builder_panel', 'panel/panel_custom.js');
