<div align="center">

# 🧠 AI Automation Builder

</div>

<div align="center">

[![HACS Badge](https://img.shields.io/badge/HACS-Custom%20Integration-41BDF5?logo=home-assistant&logoColor=white&style=flat-square)](https://github.com/hacs/integration)
<img src="https://img.shields.io/github/v/release/P1pp89/ha-ai-automation-builder?display_name=tag" alt="Release Version" />
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1.0+-41BDF5?logo=homeassistant&logoColor=white&style=flat-square)](https://www.home-assistant.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?style=flat-square&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=YVQPMTVWK46R4)

**Genera automazioni Home Assistant con Intelligenza Artificiale!**

Descrivi cosa vuoi in linguaggio naturale → IA genera YAML perfetto → Copia e incolla!

[🚀 Installazione Veloce](#-installazione) • [📚 Documentazione](#-documentazione) • [🐛 Segnala Bug](#-supporto) • [⭐ Supporta il Progetto](#supporta)

</div>

---
<div align="center">

## Caratteristiche Principali

| Feature | Descrizione |
|---------|------------|
| 🧠 **IA Conversazionale** | Descrivi in italiano: "Accendi le luci alle 20:00" → YAML pronto |
| ⚡ **Groq AI Gratuito** | Nessun costo, zero configurazione complessa, risultati immediati |
| ✅ **Validazione YAML Real-Time** | Controlla istantaneamente se il YAML è corretto |
| 📋 **Copia con Un Click** | Funziona su PC, mobile, app companion - sempre |
| 🎨 **Dark Mode UI Moderna** | Interfaccia sleek nel pannello sidebar |
| 🌍 **Multi-lingua** | Italiano 🇮🇹 + Inglese 🇬🇧 |
| 🔒 **Privacy First** | Nessun dato raccolto, tutto locale |
| 🚀 **Production Ready** | Stabile, testato, zero crash |

</div>

---
## Demo & Screenshots

### Pannello Principale
![AI Automation Builder Panel](./docs/images/panel-main.png)

### Generazione YAML
![YAML Generation](./docs/images/panel-generate.png)

### Validazione YAML
![YAML Validation](./docs/images/panel-validate.png)

### Copia Codice
![Copy Code](./docs/images/panel-copy.png)

---

## Installazione

### Opzione 1: HACS (Consigliato)

```
1. Apri Home Assistant → HACS → Integrazioni
2. Clicca "Esplora e scarica repository"
3. Cerca: "AI Automation Builder"
4. Clicca "Scarica questa repository"
5. Riavvia Home Assistant
6. Settings → Devices & Services → AI Automation Builder
7. Scegli Groq → Inserisci API key → Fine!
```

**Tempo:** ~2 minuti

### Opzione 2: Installazione Manuale

```bash
# 1. Scarica il repository
cd config
git clone https://github.com/custom/ai_automation_builder.git custom_components/ai_automation_builder

# 2. Riavvia Home Assistant
# (Settings → System → Restart)

# 3. Configura l'integrazione
# (Settings → Devices & Services → AI Automation Builder)
```

---

## Configurazione

### Step 1: Scegli Provider AI

#### **Groq (Gratuito - Consigliato)**

```
1. Vai su → console.groq.com
2. Crea account gratuito
3. Genera API Key (inizia con gsk_)
4. Scegli modello: llama-3.3-70b-versatile
5. Home Assistant: Settings → Add Integration → AI Automation Builder
6. Seleziona "Groq" → Incolla API key
7. Fine!
```

**Vantaggi:**
- Completamente gratuito (nessun costo!)
- Velocissimo (risposte in 1-2 secondi)
- Modelli potenti (Llama 3.3, Mixtral, Gemma)
- Zero configurazione complessa

#### **OpenAI (A pagamento)**

```
API Key: sk-... (da platform.openai.com)
Modelli: gpt-4o, gpt-4o-mini, gpt-4-turbo
Nota: Richiede crediti disponibili
```

#### **GitHub Models (Gratuito)**

```
Token: GitHub PAT (da github.com/settings/tokens)
Modelli: gpt-4o, gpt-4o-mini
Nota: Più lento, per testing
```

### Step 2: Apri il Pannello

```
Home Assistant → Settings → Dashboards
Sidebar → 🧠 AI Automation
```

---

## Come Usarlo

### Workflow Completo in 4 Passi

#### **Passo 1: Descrivi l'Automazione**

Apri il pannello e digita in linguaggio naturale:

```
"Accendi le luci della camera alle 22:00"
"Invia notifica se la porta principale si apre"
"Spegni tutti i dispositivi quando esco"
"Aumenta riscaldamento a 23° quando nessuno è a casa"
```

#### **Passo 2: Genera YAML**

Clicca il pulsante **🧠 Genera Automazione**

L'IA genera il YAML in 1-2 secondi:
```yaml
- alias: "Accendi luci camera alle 22:00"
  description: "Automazione generata da AI"
  trigger:
    - platform: time
      at: "22:00"
  condition: []
  action:
    - service: light.turn_on
      target:
        entity_id: light.camera
```

#### **Passo 3: Valida**

Clicca il tab **✅ Valida YAML**

Dovresti vedere: ✅ **YAML valido!**

#### **Passo 4: Copia e Incolla**

1. Clicca **📋 Copia Codice**
2. Vai su **Settings → Automations & Scenes → Automations**
3. Crea automazione → Modifica YAML
4. Incolla il codice
5. Salva → Riavvia Home Assistant

---

## Documentazione Completa

### Template Rapidi

Clicca sui template per autocompletare:

| Template | Descrizione | Esempio |
|----------|------------|---------|
| 🌙 **Luci Notturne** | Accendi luci soft di sera | Genera automazione di esempio |
| 🚨 **Antintrusione** | Notifiche se movimento rilevato | Genera automazione di esempio |
| 👕 **Lavatrice** | Avvisa quando è finita | Genera automazione di esempio |

### Entità Disponibili

L'IA ha accesso a tutte le tue entità Home Assistant:
- 💡 Luci (`light.`)
- 🌡️ Temperature (`sensor.`, `climate.`)
- 🔐 Sensori (`binary_sensor.`)
- 🔌 Switch (`switch.`, `input_boolean.`)
- 📣 Notifiche (`notify.`)
- ⏰ Timer e automazioni

### Linguaggio Supportato

- Italiano fluente
- English
- Descrizioni lunghe e complesse

---

## Troubleshooting

### "Pannello non carica"

```
1. Controlla: Settings → System → Logs
2. Filtra: "ai_automation_builder"
3. Riavvia HA se vedi errori
4. Pulisci cache browser (Ctrl+F5)
```

### "IA non genera YAML"

```
1. Verifica API key Groq sia corretta
2. Controlla connessione internet
3. Console browser (F12) → vedi errori?
4. Log di Home Assistant → cerca errori
```

### "YAML non valida"

```
L'IA genera YAML corretto al 99%
Se non valida: aggiungi dettagli alla descrizione
Es: "Accendi luce camera (light.camera) alle 22:00"
```

### "Copia non funziona"

```
Normal su app Companion/mobile
Workaround: Seleziona YAML manualmente
→ Copia con Ctrl+C
```

### Altre Domande?

Apri un Issue su GitHub: [Issues](https://github.com/custom/ai_automation_builder/issues)

---

## Compatibilità

| Home Assistant | Stato | Note |
|---|---|---|
| **2024.1.0+** | ✅ Supportato | Versione minima |
| **2026.1.0** | ✅ Testato | Compatibile |
| Python | **3.11+** | Obbligatorio |

---

## Segnalazione Bug

Se trovi un bug:

```
1. Apri Settings → System → Logs
2. Filtra: ai_automation_builder
3. Copia i log di errore
4. Apri GitHub Issue con i log
5. Descrivi che cosa è successo
```

**Template Issue:**
```
Titolo: [BUG] Descrizione breve

Descrizione:
- Cosa hai fatto?
- Cosa ti aspettavi?
- Cosa è successo invece?
- Log di errore:
```

---

## Suggerimenti per Miglioramenti

Hai idee per nuove feature?

Apri una Discussion: [Discussions](https://github.com/custom/ai_automation_builder/discussions)

Idee comuni:
- Supporto più lingue
- Widget mobile
- Integrazione con altri servizi
- Temi personalizzati

---

## Changelog

### v1.1.0 (Gennaio 2026) - 🎉 Release Stabile

**Features:**
- ✅ Generazione YAML con IA
- ✅ Validazione YAML real-time
- ✅ Copia codice robusta (fallback per mobile)
- ✅ Dark mode UI moderna
- ✅ Multi-lingua (IT + EN)

**Fixes:**
- ✅ Blocking call risolto
- ✅ HACS download completo
- ✅ WebSocket stabile
- ✅ Zero errori JavaScript

**Known Issues:**
- Nessuno! 🎉

---

## 🤝 Contribuire

Vuoi aiutare? Perfetto! 

```bash
# 1. Fork il repository
git clone https://github.com/TUO_USERNAME/ai_automation_builder.git

# 2. Crea branch feature
git checkout -b feature/mio-miglioramento

# 3. Commit con messaggi chiari
git commit -m "feat: aggiungi nuovo modello AI"

# 4. Push
git push origin feature/mio-miglioramento

# 5. Open Pull Request
# (Descrivi le modifiche nel PR)
```

---

## 📜 Licenza

MIT License - vedi [LICENSE](LICENSE)

---

## ⭐ Supporta il Progetto

Se **AI Automation Builder** ti piace:

- **Star** il repository (aiuta la visibilità!)
- **Segnala bug** (migliora la qualità)
- **Suggerisci feature** (rendi più potente)
- **Condividi** con altri (spread the love!)
- **Scrivi review** su HACS (aiuta chi cerca)

---

## 🙏 Ringraziamenti

- **Home Assistant** - Piattaforma fantastica
- **Groq** - API IA gratuita e veloce
- **Community** - Testing e feedback

---

<div align="center">

**Creato con ❤️ per la community Home Assistant**

[🏠 Home Assistant](https://www.home-assistant.io/) • [💬 Discord](https://discord.gg/homeassistant) • [📚 Forum](https://community.home-assistant.io/)

**Domande?** Apri una [Discussion](https://github.com/custom/ai_automation_builder/discussions)  
**Bug?** Apri un [Issue](https://github.com/custom/ai_automation_builder/issues)

*Made with passion by developers, for developers* 🚀

</div>
