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

**Generate Home Assistant automations with Artificial Intelligence!**

Describe what you want in natural language → AI generates perfect YAML → Copy and paste!

[🚀 Quick Installation](#-installation) • [📚 Documentation](#-documentation) • [🐛 Report Bug](#-support) • [⭐ Support the Project](#support)
</div>

---
<div align="center">

## Main Features

| Feature | Description |
|---------|------------|
| 🧠 **Conversational AI** | Describe in Italian: "Turn on the lights at 8:00 PM" → YAML ready |
| ⚡ **Free Groq AI** | No cost, zero complex setup, instant results |
| ✅ **Real-Time YAML Validation** | Instantly check if your YAML is correct |
| 📋 **One-Click Copy** | Works on PC, mobile, companion apps - always |
| 🎨 **Modern Dark Mode UI** | Sleek interface in the sidebar panel |
| 🌍 **Multi-language** | Italian 🇮🇹 + English 🇬🇧 |
| 🔒 **Privacy First** | No data collected, all local |
| 🚀 **Production Ready** | Stable, tested, zero crashes |

</div>

---
## Demo & Screenshots

### Main Panel

<p align="center">
  <img src="assets/screenshot_1.png" width="300">
</p>

---

## Installation

### HACS (Recommended)

[![Apri il repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=P1pp89&repository=ha-ai-automation-builder&category=integration)

```
1. Open Home Assistant → HACS → Integrations
2. Click "Explore and download repositories"
3. Search for "AI Automation Builder"
4. Click "Download this repository"
5. Restart Home Assistant
6. Settings → Devices & Services → AI Automation Builder
7. Select Groq → Enter API key → Done!
```

**Time:** ~2 minutes

### Manual Installation
```bash
#1. Download the repository
cd config
git clone https://github.com/P1pp89/ha-ai-automation-builder.git custom_components/ai_automation_builder

#2. Restart Home Assistant
# (Settings → System → Restart)

#3. Set up the integration
# (Settings → Devices & Services → AI Automation Builder)
```

---

## Configuration

### Step 1: Choose AI Provider
#### **Groq (Free - Recommended)**

```
1. Go to → console.groq.com
2. Create a free account
3. Generate API Key (starts with gsk_)
4. Choose template: llama-3.3-70b-versatile
5. Home Assistant: Settings → Add Integration → AI Automation Builder
6. Select "Groq" → Paste API Key
7. Done!
```

**Advantages:**
- Completely free (no fees!)
- Lightning fast (responses in 1-2 seconds)
- Powerful templates (Llama 3.3, Mixtral, Gemma)
- No complex configuration
  
#### **OpenAI (Paid)**

```
API Key: sk-... (from platform.openai.com)
Models: gpt-4o, gpt-4o-mini, gpt-4-turbo
Note: Requires available credits
```

#### **GitHub Models (Free)**

```
Token: GitHub PAT (from github.com/settings/tokens)
Models: gpt-4o, gpt-4o-mini
Note: Slower, for testing
```

### Step 2: Open the Panel

```
Home Assistant → Settings → Dashboards
Sidebar → 🧠 AI Automation
```

---

## How to Use It

### Complete Workflow in 4 Steps

#### **Step 1: Describe the Automation**

Open the panel and type in natural language:

```
"Turn on bedroom lights at 10:00 PM"
"Send notification if the front door opens"
"Turn off all devices when I leave"
"Turn heating to 23°C when no one is home"
```

#### **Step 2: Generate YAML**

Click the **🧠 Generate Automation** button

The AI ​​generates the YAML in 1-2 seconds:
```yaml
alias: Turn on camera lights at 10:00 PM
description: Turn on camera lights at 10:00 PM
trigger:
  - platform: time
    at: "10:00 PM"
condition: []
action:
  - service: light.turn_on
    data: {}
mode: single
```

#### **Step 3: Validate**

Click the **✅ Validate YAML** tab

You should see: ✅ **Valid YAML!**

#### **Step 4: Copy and Paste**

1. Click **📋 Copy Code**
2. Go to **Settings → Automations & Scenes → Automations**
3. Create Automation → Edit YAML
4. Paste the code
5. Save → Restart Home Assistant

---

## Complete Documentation

### Quick Templates

Click on the templates to autocomplete:

| Template | Description | Example |
|----------|------------|----------|
| 🌙 **Night Lights** | Turn on soft lights at night | Generate example automation |
| 🚨 **Intrusion Detection** | Notify me when motion is detected | Generate example automation |
| 👕 **Washing Machine** | Notify me when it's finished | Generate example automation |

### Available Entities

The AI ​​has access to all your Home Assistant entities:
- 💡 Lights (`light.`)
- 🌡️ Temperatures (`sensor.`, `climate.`)
- 🔐 Sensors (`binary_sensor.`)
- 🔌 Switches (`switch.`, `input_boolean.`)
- 📣 Notifications (`notify.`)
- ⏰ Timers and Automations
- 
### Supported Language

- Fluent Italian
- English
- Long and complex descriptions

---

## Troubleshooting

### "Panel not loading"

```
1. Check: Settings → System → Logs
2. Filter: "ai_automation_builder"
3. Restart HA if you see errors
4. Clear browser cache (Ctrl+F5)
```

### "IA does not generate YAML"

```
1. Verify the correct Groq API key
2. Check your internet connection
3. Browser console (F12) → see errors?
4. Home Assistant log → check for errors
```

### "Invalid YAML"

```
AI generates 99% correct YAML
If invalid: add details to the description
Ex: "Turn on room light (light.camera) at 10:00 PM"
```

### "Copy doesn't work"

```
Normal on Companion/mobile app
Workaround: Select YAML manually
→ Copy with Ctrl+C
```

### Any more questions?

Open an Issue on GitHub: [Issues](https://github.com/custom/ai_automation_builder/issues)
---

## Compatibility

| Home Assistant | Status | Notes |
|---|---|---|
| **2024.1.0+** | ✅ Supported | Minimum Version |
| **2026.1.0** | ✅ Tested | Compatible |
| Python | **3.11+** | Required |

---

## Bug Report

If you find a bug:

```
1. Open Settings → System → Logs
2. Filter: ai_automation_builder
3. Copy the error logs
4. Open the GitHub Issue with the logs
5. Describe what happened
```

**Template Issue:**
```
Title: [BUG] Short Description

Description:
- What did you do?
- What did you expect?
- What happened instead?
- Error Log:
```

---

### Suggestions for Improvements

Do you have ideas for new features?

Open a Discussion: [Discussions](https://github.com/custom/ai_automation_builder/discussions)

Common Ideas:
- Multiple Language Support
- Mobile Widgets
- Integration with Other Services
- Custom Themes
---

## Changelog

### v1.1.0 (January 2026) - 🎉 stable Release

**Features:**
- ✅ AI-powered YAML generation
- ✅ Real-time YAML validation
- ✅ Robust code copying (fallback for mobile)
- ✅ Modern UI dark mode
- ✅ Multilingual (IT + EN)

**Fixes:**
- ✅ Blocking call resolved
- ✅ HACS full download
- ✅ Stable WebSocket
- ​​✅ Zero JavaScript errors

**Known Issues:**
- None! 🎉
---

## 🤝 Contribute

Want to help? Perfect!

```bash
# 1. Fork the repository
git clone https://github.com/YOUR_USERNAME/ai_automation_builder.git

# 2. Create branch feature
git checkout -b feature/my-improvement

# 3. Commit with clear messages
git commit -m "feat: add new AI model"

# 4. Push
git push origin feature/my-improvement

# 5. Open Pull Request
# (Describe the changes in the PR)
```

---

## 📜 License

MIT License - see [LICENSE] (LICENSE)

---

## ⭐ Support the Project

If you like **AI Automation Builder**:

- **Star** the repository (helps visibility!)
- **Report bugs** (improve quality)
- **Suggest features** (make it more powerful)
- **Share** with others (spread the love!)
- **Write a review** on HACS (helps those who seek)

---

## 🙏 Acknowledgements

- **Home Assistant** - Fantastic platform
- **Groq** - Free and fast AI API
- **Community** - Testing and feedback

---

<div align="center">

**Created with ❤️ for the Home Assistant community**

[🏠 Home Assistant](https://www.home-assistant.io/) • [💬 Discord](https://discord.gg/homeassistant) • [📚 Forum](https://community.home-assistant.io/)

**Questions?** Open a [Discussion](https://github.com/custom/ai_automation_builder/discussions)
**Bug?** Open an [Issue](https://github.com/custom/ai_automation_builder/issues)

*Made with passion by developers, for developers* 🚀

</div>
