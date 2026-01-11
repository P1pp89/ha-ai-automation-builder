# AI Automation Builder for Home Assistant

Generate Home Assistant automations using artificial intelligence.

## Installation

### HACS (recommended)
1. Open HACS
2. Go to Integrations
3. Click "Add Custom Repository"
4. Paste: `https://github.com/YourUsername/ai-automation-builder`
5. Search for "AI Automation Builder"
6. Click Install

### Manual
1. Download this repository
2. Copy `custom_components/ai_automation_builder` to `/config/custom_components/`
3. Restart Home Assistant

## Configuration

1. Go to **Settings → Devices & Services**
2. Click **Add Integration**
3. Search for "AI Automation Builder"
4. Choose the provider (Groq, OpenAI, GitHub Models)
5. Enter your API Key

### Free API Keys:
- **Groq**: https://console.groq.com (recommended, fast and (free)
- **OpenAI**: https://platform.openai.com
- **GitHub Models**: https://github.com/marketplace/models

## Usage

1. Open "AI Automation" from the sidebar
2. Describe the automation in natural language
3. Click "Generate Automation"
4. Copy the YAML and import it into Home Assistant

## Support

For bugs or requests: [Issues](https://github.com/P1pp89/ai-automation-builder/issues)
