"""WebSocket API per AI Automation Builder."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import aiohttp
import voluptuous as vol
import yaml

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    WS_TYPE_BUILD_AUTOMATION,
    WS_TYPE_GET_ENTITIES,
    WS_TYPE_VALIDATE_YAML,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_ws(hass: HomeAssistant) -> None:
    """Registra i comandi WebSocket."""
    websocket_api.async_register_command(hass, ws_build_automation)
    websocket_api.async_register_command(hass, ws_get_entities)
    websocket_api.async_register_command(hass, ws_validate_yaml)
    _LOGGER.info("✅ WebSocket commands registrati")


@websocket_api.websocket_command({
    vol.Required("type"): WS_TYPE_BUILD_AUTOMATION,
    vol.Required("prompt"): str,
})
@websocket_api.async_response
async def ws_build_automation(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Genera automazione da prompt."""
    try:
        _LOGGER.info("🔍 Richiesta automazione: %s", msg["prompt"][:50])
        
        # Ottieni config
        config_entries = hass.data.get(DOMAIN, {})
        if not config_entries:
            raise ValueError("Integrazione non configurata")
        
        entry_id = list(config_entries.keys())[0]
        config = config_entries[entry_id]
        
        _LOGGER.info("🔧 Provider: %s", config.get("ai_provider"))
        
        # Genera YAML
        yaml_output = await call_ai(msg["prompt"], config)
        
        connection.send_result(msg["id"], {"success": True, "yaml": yaml_output})
        
    except Exception as e:
        _LOGGER.error("❌ Errore: %s", e, exc_info=True)
        connection.send_error(msg["id"], "generation_failed", str(e))


@websocket_api.websocket_command({
    vol.Required("type"): WS_TYPE_GET_ENTITIES,
})
@websocket_api.async_response
async def ws_get_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Restituisce entità HA."""
    try:
        entities = {}
        for state in hass.states.async_all():
            domain = state.domain
            if domain not in entities:
                entities[domain] = []
            entities[domain].append({
                "id": state.entity_id,
                "name": state.name or state.entity_id,
                "state": state.state,
            })
        connection.send_result(msg["id"], {"entities": entities})
    except Exception as e:
        _LOGGER.error("❌ Errore get_entities: %s", e)
        connection.send_error(msg["id"], "entities_failed", str(e))


@websocket_api.websocket_command({
    vol.Required("type"): WS_TYPE_VALIDATE_YAML,
    vol.Required("yaml"): str,
})
@websocket_api.async_response
async def ws_validate_yaml(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Valida YAML."""
    try:
        data = yaml.safe_load(msg["yaml"])
        
        if not isinstance(data, dict):
            raise ValueError("YAML deve essere un dizionario")
        
        if "alias" not in data:
            raise ValueError("Manca 'alias'")
        
        # Accetta sia triggers che trigger (retrocompatibilità)
        if "triggers" not in data and "trigger" not in data:
            raise ValueError("Manca 'triggers' o 'trigger'")
        
        # Accetta sia actions che action (retrocompatibilità)
        if "actions" not in data and "action" not in data:
            raise ValueError("Manca 'actions' o 'action'")
        
        connection.send_result(msg["id"], {"valid": True})
        
    except yaml.YAMLError as e:
        connection.send_result(msg["id"], {"valid": False, "error": f"Errore YAML: {e}"})
    except ValueError as e:
        connection.send_result(msg["id"], {"valid": False, "error": str(e)})


async def call_ai(prompt: str, config: dict) -> str:
    """Chiama API AI per generare YAML - FORMATO UI HOME ASSISTANT 2024+"""
    provider = config.get("ai_provider", "groq")
    api_key = config.get("api_key")
    model = config.get("ai_model", "llama-3.1-8b-instant")
    
    if not api_key:
        return "# Errore: API Key mancante"
    
    _LOGGER.info("🚀 Chiamata %s con model %s", provider, model)
    
    # Endpoint
    endpoints = {
        "groq": "https://api.groq.com/openai/v1/chat/completions",
        "openai": "https://api.openai.com/v1/chat/completions",
        "github_models": "https://models.inference.ai.azure.com/chat/completions",
    }
    
    endpoint = endpoints.get(provider)
    if not endpoint:
        return f"# Errore: Provider {provider} non supportato"
    
    # PROMPT AGGIORNATO - Formato UI Home Assistant 2024+
    system_prompt = """Sei un esperto di Home Assistant. Genera SOLO YAML compatibile con l'UI di Home Assistant.

FORMATO OBBLIGATORIO (usa ESATTAMENTE questa sintassi):

alias: "Nome automazione"
description: "Descrizione opzionale"
triggers:
  - trigger: state
    entity_id: sensor.example
    to: "on"
  - trigger: time
    at: "20:00:00"
  - trigger: sun
    event: sunset
    offset: 0
conditions:
  - condition: state
    entity_id: input_boolean.example
    state: "on"
  - condition: time
    after: "19:00:00"
    before: "23:00:00"
actions:
  - action: light.turn_on
    target:
      entity_id: light.example
    data:
      brightness: 255
  - action: notify.notify
    data:
      message: "Messaggio"
      title: "Titolo"
mode: single

REGOLE CRITICHE:
1. USA "triggers:" (PLURALE) non "trigger:"
2. USA "actions:" (PLURALE) non "action:"
3. USA "action:" dentro actions, NON "service:"
4. USA "trigger:" per specificare il tipo (state/time/sun/numeric_state)
5. USA "condition:" per specificare il tipo di condizione
6. SEMPRE includi "mode: single" alla fine
7. NON usare sintassi YAML deprecata
8. Genera SOLO YAML puro, nessun commento o markdown

ESEMPI VALIDI:

# Luce al tramonto:
alias: Luce tramonto
triggers:
  - trigger: sun
    event: sunset
    offset: 0
conditions: []
actions:
  - action: light.turn_on
    target:
      entity_id: light.soggiorno
mode: single

# Luce con movimento:
alias: Luce movimento
triggers:
  - trigger: state
    entity_id: binary_sensor.motion
    to: "on"
conditions:
  - condition: time
    after: "19:00:00"
    before: "07:00:00"
actions:
  - action: light.turn_on
    target:
      entity_id: light.corridoio
    data:
      brightness: 100
mode: single

# Notifica temperatura:
alias: Alert temperatura
triggers:
  - trigger: numeric_state
    entity_id: sensor.temperatura
    above: 25
conditions: []
actions:
  - action: notify.mobile_app_phone
    data:
      message: "Temperatura alta: {{ states('sensor.temperatura') }}°C"
      title: "Home Assistant"
mode: single

Genera SOLO il YAML richiesto dall'utente seguendo ESATTAMENTE questo formato."""
    
    # Payload
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.1,
        "max_tokens": 2000,
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                endpoint,
                json=payload,
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=aiohttp.ClientTimeout(total=60),
            ) as resp:
                
                if resp.status != 200:
                    error = await resp.text()
                    _LOGGER.error("❌ API Error %s: %s", resp.status, error)
                    return f"# Errore API {resp.status}: {error}"
                
                data = await resp.json()
                content = data["choices"][0]["message"]["content"]
                
                # Rimuovi markdown
                content = content.strip()
                if content.startswith("```yaml"):
                    content = content.replace("```yaml", "").replace("```", "").strip()
                elif content.startswith("```"):
                    content = content.replace("```", "").strip()
                
                _LOGGER.info("✅ YAML generato (%s char)", len(content))
                return content
                
    except asyncio.TimeoutError:
        return "# Errore: Timeout"
    except Exception as e:
        _LOGGER.error("❌ Errore call_ai: %s", e, exc_info=True)
        return f"# Errore: {e}"
