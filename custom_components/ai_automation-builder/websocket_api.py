"""WebSocket API per AI Automation Builder."""
from __future__ import annotations

import aiohttp
import yaml
import logging
import voluptuous as vol
from typing import Any, Dict

from homeassistant.core import HomeAssistant
from homeassistant.components import websocket_api
from homeassistant.helpers import config_validation as cv
from homeassistant.const import CONF_TYPE

from .const import (
    DOMAIN,
    WS_TYPE_BUILD_AUTOMATION,
    WS_TYPE_GET_ENTITIES,
    WS_TYPE_VALIDATE_YAML,
)

_LOGGER = logging.getLogger(__name__)


async def call_ai(prompt: str, config: dict, hass: HomeAssistant) -> str:
    """Chiama modello AI con supporto multiProvider."""
    try:
        provider = config.get("ai_provider", "groq")
        model = config.get("ai_model")
        
        # Home Assistant Cloud
        if provider == "ha_cloud":
            try:
                result = await hass.services.async_call(
                    "cloud",
                    "generate_text",
                    {
                        "prompt": prompt,
                        "max_tokens": 1500,
                    },
                    blocking=True,
                    return_response=True,
                )
                return result.get("text", "# Errore: risposta vuota da HA Cloud")
            except Exception as e:
                _LOGGER.error("Errore HA Cloud: %s", e)
                return f"# Errore HA Cloud: {str(e)}"
        
        # API esterne (GROQ, OpenAI, GitHub Models)
        api_key = config.get("api_key")
        
        if not api_key:
            return "# Errore: API Key non configurata"
        
        if provider == "groq":
            endpoint = "https://api.groq.com/openai/v1/chat/completions"
        elif provider == "openai":
            endpoint = "https://api.openai.com/v1/chat/completions"
        elif provider == "github_models":
            endpoint = "https://models.inference.ai.azure.com/chat/completions"
        else:
            return "# Errore: Provider non riconosciuto"
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": """Sei un esperto di Home Assistant. Genera SOLO YAML valido per automazioni.
Formato richiesto:
- alias: Nome automazione
  trigger: ...
  condition: (opzionale)
  action: ...

Riconosci automaticamente le entità dal prompt dell'utente.
Usa solo servizi e azioni standard di Home Assistant.
Non aggiungere commenti extra, solo YAML valido."""
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 1500,
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                endpoint,
                json=payload,
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    _LOGGER.error("Errore API %s: %s", resp.status, error_text)
                    return f"# Errore {resp.status}: Verifica API Key e Provider"
                
                data = await resp.json()
                yaml_str = data["choices"][0]["message"]["content"]
                return yaml_str
    
    except Exception as e:
        _LOGGER.error("Errore call_ai: %s", e)
        return f"# Errore: {str(e)}\nVerifica API Key e connessione"


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required(CONF_TYPE): WS_TYPE_BUILD_AUTOMATION,
        vol.Required("prompt"): cv.string,
    }
)
@websocket_api.async_response
async def ws_build_automation(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Genera automazione da prompt."""
    try:
        config = hass.data[DOMAIN][list(hass.data[DOMAIN].keys())[0]]
        yaml_code = await call_ai(msg["prompt"], config, hass)
        
        connection.send_result(
            msg["id"],
            {"success": True, "yaml": yaml_code}
        )
    except Exception as e:
        _LOGGER.error("Errore ws_build_automation: %s", e)
        connection.send_error(msg["id"], "internal_error", str(e))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required(CONF_TYPE): WS_TYPE_GET_ENTITIES}
)
@websocket_api.async_response
async def ws_get_entities(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Restituisce lista di tutte le entità HA."""
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
        _LOGGER.error("Errore ws_get_entities: %s", e)
        connection.send_error(msg["id"], "internal_error", str(e))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required(CONF_TYPE): WS_TYPE_VALIDATE_YAML,
        vol.Required("yaml"): cv.string,
    }
)
@websocket_api.async_response
async def ws_validate_yaml(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: Dict[str, Any],
) -> None:
    """Valida YAML di un'automazione."""
    try:
        yaml_content = msg["yaml"]
        data = yaml.safe_load(yaml_content)
        
        # Validazione base
        if not isinstance(data, dict):
            raise ValueError("YAML deve essere un dizionario")
        
        if "alias" not in data:
            raise ValueError("Manca il campo 'alias'")
        
        if "trigger" not in data:
            raise ValueError("Manca il campo 'trigger'")
        
        connection.send_result(msg["id"], {"valid": True})
    
    except yaml.YAMLError as e:
        connection.send_result(
            msg["id"],
            {"valid": False, "error": f"Errore YAML: {str(e)}"}
        )
    except ValueError as e:
        connection.send_result(
            msg["id"],
            {"valid": False, "error": str(e)}
        )
    except Exception as e:
        _LOGGER.error("Errore ws_validate_yaml: %s", e)
        connection.send_result(
            msg["id"],
            {"valid": False, "error": f"Errore inatteso: {str(e)}"}
        )


async def async_setup_ws(hass: HomeAssistant) -> None:
    """Registra i comandi WebSocket API."""
    websocket_api.async_register_command(hass, ws_build_automation)
    websocket_api.async_register_command(hass, ws_get_entities)
    websocket_api.async_register_command(hass, ws_validate_yaml)
    _LOGGER.info("WebSocket API registrata per AI Automation Builder")

