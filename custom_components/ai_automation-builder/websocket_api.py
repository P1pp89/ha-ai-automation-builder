"""WebSocket API per AI Automation Builder."""

import os
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
    """Chiama modello AI con supporto multiProvider."""
    try:
        provider = config.get("ai_provider", "groq")
        model = config.get("ai_model")
        
        # Selezione endpoint e headers in base al provider
        if provider == "ha_cloud":
            # Home Assistant Cloud - usa il componente cloud integrato
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
        # Verifica se è Home Assistant OS/Supervised
        if "hassio" not in hass.data:
            result["message"] = "Richiede Home Assistant OS o Supervised. Usa configurazione manuale."
            _LOGGER.warning(result["message"])
            return result
        
        addon_slug = "a0d7b954_ollama"
        _LOGGER.info("Tentativo installazione Ollama addon...")
        
        try:
            # Usa il nuovo endpoint deprecato
            addon_info = await hass.services.async_call(
                "hassio",
                "addon_info",
                {"addon": addon_slug},
                blocking=True,
                return_response=True,
            )
            
            if addon_info and addon_info.get("installed"):
                _LOGGER.info("Ollama addon già installato, verifico stato...")
                
                if addon_info.get("state") != "started":
                    await hass.services.async_call(
                        "hassio",
                        "addon_start",
                        {"addon": addon_slug},
                        blocking=True,
                    )
                    _LOGGER.info("Ollama addon avviato")
                    await asyncio.sleep(3)
                
                result["success"] = True
                result["message"] = "Ollama già installato e configurato!"
                result["endpoint"] = "http://homeassistant.local:11434"
                return result
        
        except Exception as e:
            _LOGGER.debug(f"Addon non trovato, procedo con installazione: {e}")
        
        # NUOVO CODICE: Usa l'API REST diretto al Supervisor
        try:
            import aiohttp
            
            supervisor_token = os.getenv("SUPERVISOR_TOKEN")
            if not supervisor_token:
                result["message"] = "SUPERVISOR_TOKEN non disponibile. Usa endpoint manuale."
                _LOGGER.error(result["message"])
                return result
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {supervisor_token}",
                    "Content-Type": "application/json",
                }
                
                # Installa addon usando il nuovo endpoint
                async with session.post(
                    f"http://supervisor/api/store/addons/{addon_slug}/install",
                    headers=headers,
                    json={"background": False},
                ) as resp:
                    if resp.status == 200:
                        _LOGGER.info("Ollama addon installato con successo")
                        await asyncio.sleep(2)
                    else:
                        result["message"] = f"Errore installazione (HTTP {resp.status}). Installa manualmente da Impostazioni → Componenti aggiuntivi."
                        _LOGGER.error(result["message"])
                        return result
        
        except Exception as e:
            result["message"] = f"Errore installazione: {e}. Installa manualmente l'addon 'Ollama' dai Componenti aggiuntivi."
            _LOGGER.error(result["message"])
            return result
        
        # Avvia addon
        try:
            await hass.services.async_call(
                "hassio",
                "addon_start",
                {"addon": addon_slug},
                blocking=True,
            )
            
            _LOGGER.info("Ollama addon avviato")
            await asyncio.sleep(5)
            
            result["success"] = True
            result["message"] = "Ollama installato e avviato! Il primo avvio può richiedere 1-2 minuti per scaricare il modello."
            result["endpoint"] = "http://homeassistant.local:11434"
        
        except Exception as e:
            result["message"] = f"Addon installato ma errore avvio: {e}. Avvialo manualmente da Impostazioni → Componenti aggiuntivi."
            _LOGGER.error(result["message"])
    
    except Exception as e:
        result["message"] = f"Errore generale: {str(e)}"
        _LOGGER.error(f"Errore install_ollama_addon: {e}", exc_info=True)
    
    return result


def _get_local_ip_sync() -> str:
    """Get local IP sync version."""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

async def async_setup_ws(hass: HomeAssistant) -> None:
    """Registra WS API."""
    websocket_api.async_register_command(hass, ws_build_automation)
    websocket_api.async_register_command(hass, ws_get_entities)
    websocket_api.async_register_command(hass, ws_validate_yaml)
