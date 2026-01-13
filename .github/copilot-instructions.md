# AI Automation Builder - AI Agent Development Guide

## Project Overview

**AI Automation Builder** is a Home Assistant custom integration that generates Home Assistant automations using AI. Users describe what they want in plain language, and the integration calls external AI APIs (Groq, OpenAI, GitHub Models) to generate valid Home Assistant YAML automation code.

## Architecture

### Three-Layer Stack
1. **Backend (Python)**: Home Assistant integration (`custom_components/ai_automation-builder/`)
   - Manages configuration and API credentials for different AI providers
   - Registers WebSocket commands for frontend-backend communication
   - Handles YAML validation and file export to `automations.yaml`

2. **Frontend (Web)**: HTML5 + Lit (JavaScript library)
   - Custom Home Assistant panel at `http://homeassistant:8123/ui/ai-automation-builder`
   - Tab interface: Flow, YAML view, validation results
   - WebSocket communication with backend

3. **AI Layer**: External APIs
   - Calls Groq, OpenAI, or GitHub Models APIs
   - System prompt instructs AI to generate strict, valid Home Assistant YAML

### Key Data Flow
```
User Input (frontend) 
  → WebSocket ws_build_automation (prompt)
  → Backend retrieves AI config from hass.data[DOMAIN]
  → call_ai() formats system prompt + user prompt
  → External API returns YAML
  → Frontend displays YAML with export option
  → WebSocket ws_export_yaml appends to automations.yaml
```

## Critical Patterns & Conventions

### WebSocket Command Registration
All backend-frontend communication uses Home Assistant WebSocket API. Commands are:
- `ai_automation_builder/build_automation` - generates YAML from natural language
- `ai_automation_builder/get_entities` - returns list of available entities for context
- `ai_automation_builder/validate_yaml` - validates YAML syntax before export
- `ai_automation_builder/export_yaml` - appends YAML to `automations.yaml`

All defined in [const.py](custom_components/ai_automation-builder/const.py), registered in [websocket_api.py](custom_components/ai_automation-builder/websocket_api.py#L30-L35).

### Configuration Flow
- Single-instance integration enforced via `async_set_unique_id(DOMAIN)`
- Supports three AI providers with separate config steps (Groq/OpenAI/GitHub Models)
- Provider-specific API key validation (e.g., Groq keys start with `gsk_`)
- Config stored in `hass.data[DOMAIN][entry_id]` and accessible by WebSocket handlers

See [config_flow.py](custom_components/ai_automation-builder/config_flow.py).

### YAML Generation & Validation
**System Prompt Template** (in [websocket_api.py](custom_components/ai_automation-builder/websocket_api.py#L280-L310)):
- Instructs AI to output **only valid YAML** (no markdown, no comments)
- Emphasizes correct Home Assistant keys: `trigger`, `action`, `condition` (singular)
- Includes available entities as context to help AI reference valid device IDs
- Uses `temperature: 0.1` for deterministic output

**Cleanup Logic** (in [websocket_api.py](custom_components/ai_automation-builder/websocket_api.py#L340-L360)):
- Removes markdown code fences (`` ```yaml ... ``` ``)
- Strips comment lines (lines starting with `#` except shebangs)
- Parses YAML both as dict or list depending on automation format

**Validation** checks for:
- Presence of `alias` (required by Home Assistant)
- Proper YAML syntax via `yaml.load()`
- Accepts both single dict (one automation) and list (multiple)

### Frontend Integration
- Lit WebComponent ([panel.js](custom_components/ai_automation-builder/frontend/panel.js)) manages UI state
- Communicates with Hass via `this.hass.callWS()` for WebSocket calls
- Bilingual support (Italian/English) via `translations` property
- Tab interface shows Flow builder, YAML editor, validation results
- Quick templates for common automations (night lights, intrusion alert, etc.)

### File Structure
- `__init__.py`: Sets up integration, registers WebSocket, copies frontend files to `www/`
- `config_flow.py`: Multi-step configuration for AI provider selection and credentials
- `websocket_api.py`: All WebSocket handlers and AI API call logic (~400 lines)
- `const.py`: Domain and WebSocket command type constants
- `manifest.json`: Integration metadata (requires Home Assistant 2024.1.0)
- `frontend/`: HTML panel and JS components (copied to `www/community/ai_automation_builder/` at runtime)

## Developer Workflows

### Adding a New AI Provider
1. Add API endpoint to `endpoints` dict in [websocket_api.py#L267](custom_components/ai_automation-builder/websocket_api.py#L267)
2. Add config flow step in [config_flow.py](custom_components/ai_automation-builder/config_flow.py) (follow OpenAI/Groq pattern)
3. Add model options to step's `vol.In(["model1", "model2"])`
4. Test credentials format validation (e.g., key prefix check)

### Modifying AI Prompt
Edit `system_prompt` in [websocket_api.py#L280](custom_components/ai_automation-builder/websocket_api.py#L280). Key rules:
- Keep emphasis on Home Assistant YAML syntax
- Use `{entities_context}` placeholder for available devices
- Maintain low temperature (0.1) for consistent output

### Testing Locally
- HACS integration: copy `custom_components/` to Home Assistant dev instance
- Frontend served from `www/community/ai_automation_builder/`
- WebSocket commands testable via Home Assistant Developer Tools → WebSocket
- Enable debug logging: `_LOGGER.debug()` calls throughout [websocket_api.py](custom_components/ai_automation-builder/websocket_api.py)

### Common Issues
- **API 429 errors**: User account out of credits (especially OpenAI). Error handling in [websocket_api.py#L330](custom_components/ai_automation-builder/websocket_api.py#L330)
- **Invalid YAML output**: AI ignoring system prompt. Solutions: lower temperature, add examples, regenerate prompt
- **Entity context missing**: Gracefully handled with fallback—logs warning but continues
- **File export fails**: Check `automations.yaml` permissions in Home Assistant config directory

## Language & Localization

- Code uses Italian comments/logging but English for user-facing strings
- Translations in [traslations/](custom_components/ai_automation-builder/traslations/) (IT and EN files)
- Frontend detects Home Assistant user language via Hass object
- All error messages include actionable details (e.g., link to OpenAI billing page)

## Dependencies & API Integration

- **aiohttp**: Async HTTP client for external AI API calls
- **voluptuous**: YAML schema validation for config flow
- **pyyaml**: YAML parsing and validation
- **Home Assistant Core**: All integration lifecycle (config entries, WebSocket API, state management)

No npm/pip build required—integration loads directly as custom component.
