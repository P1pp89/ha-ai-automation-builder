"""WebSocket API per AI Automation Builder."""

import aiohttp
import yaml
import logging
import asyncio
import voluptuous as vol
from typing import Any, Dict

from homeassistant.core import HomeAssistant
from homeassistant.components import websocket_api
from homeassistant.helpers import config_validation as cv
from homeassistant.const import CONF_TYPE
from homeassistant.util.yaml import dump

from .const import (
    DOMAIN,
    WS_TYPE_BUILD_AUTOMATION,
    WS_TYPE_GET_ENTITIES,
    WS_TYPE_VALIDATE_YAML,
)

_LOGGER = logging.getLogger(__name__)

async def call_ai(prompt: str, config: dict, hass: HomeAssistant) -> str:
    """Chiama modello AI."""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": config.get("ai_model", "llama3.1"),
                "messages": [
                    {
                        "role": "system",
                        "content": """Sei un esperto di Home Assistant. Genera SOLO YAML valido per automazioni.
Formato: alias, trigger, condition (se necessario), action.
Riconosci entità dal prompt. Usa servizio/action standard HA."""
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
            }

            async with session.post(
                config["ai_endpoint"] + "/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {config.get('ai_api_key', '')}"},
            ) as resp:
                data = await resp.json()
                yaml_str = data["choices"][0]["message"]["content"]
                return yaml_str
    except Exception as e:
        _LOGGER.error("Errore AI: %s", e)
        return "# Errore AI. Verifica endpoint e API key."

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
    """Genera automazione."""
    config = hass.data[DOMAIN][list(hass.data[DOMAIN].keys())[0]]
    
    yaml_code = await call_ai(msg["prompt"], config, hass)
    
    connection.send_result(
        msg["id"],
        {"success": True, "yaml": yaml_code}
    )

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
    """Lista entità HA."""
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
    """Valida YAML."""
    try:
        data = yaml.safe_load(msg["yaml"])
        # Validazione semplificata
        if "alias" not in data:
            raise ValueError("Manca 'alias'")
        if "trigger" not in data:
            raise ValueError("Manca 'trigger'")
        connection.send_result(msg["id"], {"valid": True})
    except Exception as e:
        connection.send_result(msg["id"], {"valid": False, "error": str(e)})

async def install_ollama_addon(hass: HomeAssistant) -> dict:
    """Installa e configura addon Ollama."""
    result = {"success": False, "message": "", "endpoint": ""}
    
    try:
        # Verifica se Supervisor è disponibile
        if not hasattr(hass.components, "hassio"):
            result["message"] = "Home Assistant Supervisor non disponibile. Usa Home Assistant OS o Supervised."
            return result
        
        # ID addon Ollama (Community addon)
        addon_slug = "a0d7b954_ollama"
        
        _LOGGER.info("Installazione Ollama addon in corso...")
        
        # 1. Aggiungi repository community addons se non presente
        try:
            await hass.async_add_executor_job(
                hass.components.hassio.async_create_backup,
                {"name": "Pre-Ollama Install", "addons": []}
            )
        except Exception:
            pass  # Backup opzionale
        
        # 2. Installa addon
        try:
            await hass.async_add_executor_job(
                hass.components.hassio.async_install_addon,
                addon_slug
            )
            _LOGGER.info("Ollama addon installato")
        except Exception as e:
            # Potrebbe essere già installato
            _LOGGER.warning(f"Installazione addon: {e}")
        
        # 3. Configura addon (imposta modello predefinito)
        addon_config = {
            "model": "phi3:mini",
            "keep_alive": "5m"
        }
        
        try:
            await hass.async_add_executor_job(
                hass.components.hassio.async_set_addon_options,
                addon_slug,
                addon_config
            )
            _LOGGER.info("Ollama configurato")
        except Exception as e:
            _LOGGER.warning(f"Configurazione addon: {e}")
        
        # 4. Avvia addon
        try:
            await hass.async_add_executor_job(
                hass.components.hassio.async_start_addon,
                addon_slug
            )
            _LOGGER.info("Ollama avviato")
            
            # Attendi avvio (5 secondi)
            await asyncio.sleep(5)
            
            result["success"] = True
            result["message"] = "Ollama installato e avviato con successo!"
            result["endpoint"] = "http://homeassistant.local:11434/v1"
            
        except Exception as e:
            result["message"] = f"Errore avvio addon: {e}"
            _LOGGER.error(result["message"])
        
    except Exception as e:
        result["message"] = f"Errore installazione: {e}"
        _LOGGER.error(result["message"])
    
    return result

async def async_setup_ws(hass: HomeAssistant) -> None:
    """Registra WS API."""
    websocket_api.async_register_command(hass, ws_build_automation)
    websocket_api.async_register_command(hass, ws_get_entities)
    websocket_api.async_register_command(hass, ws_validate_yaml)



