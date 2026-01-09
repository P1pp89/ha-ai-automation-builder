# 🧠 AI Automation Builder per Home Assistant

**Trasforma il linguaggio naturale in perfette automazioni YAML alimentate dall'IA!**

Genera automazioni per Home Assistant semplicemente descrivendo ciò che vuoi in italiano o inglese. Nessuna conoscenza di YAML richiesta.

## ✨ Caratteristiche

- 🎯 **Linguaggio Naturale → YAML** - Descrivi l'automazione, l'IA genera lo YAML
- 🤖 **Molteplici Provider IA** - GROQ (gratis), OpenAI, Home Assistant Cloud, GitHub Models
- ⚡ **Ultra-veloce** - Generazione istantanea con GROQ
- 🔒 **Sicuro** - Chiavi API memorizzate in sicurezza in HA
- 🌍 **Multi-lingua** - Supporto italiano e inglese
- 📋 **Validazione real-time** - Rileva errori YAML prima di salvare
- 🎨 **Interfaccia visuale** - Belle card Lovelace per costruire automazioni facilmente
- 🔗 **Riconoscimento entità** - L'IA rileva automaticamente le tue entità

## 🚀 Guida Rapida

### Installazione

1. **Tramite HACS (Consigliato)**
   - Aggiungi repository: `https://github.com/P1pp89/ha-ai-automation-builder`
   - Cerca "AI Automation Builder"
   - Clicca Installa
   - Riavvia Home Assistant

2. **Installazione Manuale**
   - Scarica ed estrai in `custom_components/ai_automation_builder`
   - Riavvia Home Assistant

### Configurazione

1. Vai a **Impostazioni → Dispositivi e servizi → Crea integrazione**
2. Cerca **"AI Automation Builder"**
3. Scegli il tuo Provider IA:
   - **GROQ** (Consigliato - Gratis, Veloce)
     - Registrati: https://console.groq.com
     - Genera API Key
     - Usa modello: `mixtral-8x7b-32768`
   - **Home Assistant Cloud** (Se iscritto)
   - **OpenAI** (A pagamento, Molto potente)
   - **GitHub Models** (Gratis con account GitHub)

## 📖 Utilizzo

### In Home Assistant

1. Apri il tuo dashboard
2. Trova "AI Automation Builder" nella barra laterale
3. Inserisci la descrizione della tua automazione:
   - "Accendi le luci del salotto quando arrivo a casa"
   - "Invia notifica se la temperatura scende sotto 15°C"
   - "Spegni tutte le luci alle 23:00"
4. L'IA genera YAML all'istante
5. Rivedi, valida e salva

### API WebSocket

Per sviluppatori, usa l'API WebSocket:

```javascript
// Genera automazione
{
  "type": "ai_automation_builder/build_automation",
  "prompt": "Accendi le luci quando rilevi movimento"
}

// Ottieni entità
{
  "type": "ai_automation_builder/get_entities"
}

// Valida YAML
{
  "type": "ai_automation_builder/validate_yaml",
  "yaml": "alias: La Mia Automazione\ntrigger:\n  platform: state"
}


