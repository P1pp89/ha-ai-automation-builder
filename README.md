# 🧠 Home Assistant AI Automation Builder

**Transform natural language into perfect YAML automations powered by AI!**

Generate Home Assistant automations by simply describing what you want in English or Italian. No YAML knowledge required.

## ✨ Features

- 🎯 **Natural Language to YAML** - Describe your automation, AI generates the YAML
- 🤖 **Multiple AI Providers** - GROQ (free), OpenAI, Home Assistant Cloud, GitHub Models
- ⚡ **Ultra-Fast** - Instant automation generation with GROQ
- 🔒 **Secure** - API keys stored safely in HA secrets
- 🌍 **Multi-language** - English & Italian support
- 📋 **Real-time Validation** - Catch YAML errors before saving
- 🎨 **Visual Interface** - Beautiful Lovelace cards for easy automation building
- 🔗 **Entity Recognition** - AI automatically detects your Home Assistant entities

## 🚀 Quick Start

### Installation

1. **Using HACS (Recommended)**
   - Add repository: `https://github.com/P1pp89/ha-ai-automation-builder`
   - Search for "AI Automation Builder"
   - Click Install
   - Restart Home Assistant

2. **Manual Installation**
   - Download and extract to `custom_components/ai_automation_builder`
   - Restart Home Assistant

### Configuration

1. Go to **Settings → Devices & Services → Create Integration**
2. Search for **"AI Automation Builder"**
3. Choose your AI Provider:
   - **GROQ** (Recommended - Free, Fast)
     - Sign up: https://console.groq.com
     - Generate API Key
     - Use model: `mixtral-8x7b-32768`
   - **Home Assistant Cloud** (If subscribed)
   - **OpenAI** (Paid, Very Powerful)
   - **GitHub Models** (Free with GitHub account)

## 📖 Usage

### In Home Assistant

1. Open your dashboard
2. Find "AI Automation Builder" in sidebar
3. Enter your automation description:
   - "Turn on living room lights when I arrive home"
   - "Send notification if temperature drops below 15°C"
   - "Turn off all lights at 11 PM"
4. AI generates YAML instantly
5. Review, validate, and save

### WebSocket API

For developers, use the WebSocket API:

```javascript
// Build automation
{
  "type": "ai_automation_builder/build_automation",
  "prompt": "Turn on lights when motion detected"
}

// Get entities
{
  "type": "ai_automation_builder/get_entities"
}

// Validate YAML
{
  "type": "ai_automation_builder/validate_yaml",
  "yaml": "alias: My Automation\ntrigger:\n  platform: state"
}
