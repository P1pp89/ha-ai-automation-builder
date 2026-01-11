# AI Automation Builder for Home Assistant

Genera automazioni Home Assistant usando l'intelligenza artificiale.

## Installazione

### HACS (consigliato)
1. Apri HACS
2. Vai su Integrazioni
3. Clicca "Aggiungi repository personalizzato"
4. Incolla: `https://github.com/TuoUsername/ai-automation-builder`
5. Cerca "AI Automation Builder"
6. Clicca Installa

### Manuale
1. Scarica questa repository
2. Copia `custom_components/ai_automation_builder` in `/config/custom_components/`
3. Riavvia Home Assistant

## Configurazione

1. Vai in **Impostazioni → Dispositivi e Servizi**
2. Clicca **Aggiungi integrazione**
3. Cerca "AI Automation Builder"
4. Scegli il provider (Groq, OpenAI, GitHub Models)
5. Inserisci la tua API Key

### API Key gratuite:
- **Groq**: https://console.groq.com (consigliato, veloce e gratis)
- **OpenAI**: https://platform.openai.com
- **GitHub Models**: https://github.com/marketplace/models

## Utilizzo

1. Apri "AI Automation" dalla sidebar
2. Descrivi l'automazione in linguaggio naturale
3. Clicca "Genera Automazione"
4. Copia il YAML e importalo in Home Assistant

## Supporto

Per bug o richieste: [Issues](https://github.com/TuoUsername/ai-automation-builder/issues)
