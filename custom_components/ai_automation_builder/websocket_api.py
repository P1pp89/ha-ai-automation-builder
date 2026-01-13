"""WebSocket API per AI Automation Builder - VERSIONE CORRETTA."""

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
    WS_TYPE_EXPORT_YAML,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_ws(hass: HomeAssistant) -> None:
    """Registra i comandi WebSocket."""
    websocket_api.async_register_command(hass, ws_build_automation)
    websocket_api.async_register_command(hass, ws_get_entities)
    websocket_api.async_register_command(hass, ws_validate_yaml)
    websocket_api.async_register_command(hass, ws_export_yaml)
    _LOGGER.info("✅ WebSocket commands registrati")


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_BUILD_AUTOMATION,
        vol.Required("prompt"): str,
    }
)
@websocket_api.async_response
async def ws_build_automation(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Genera automazione da prompt."""
    try:
        _LOGGER.info("🔍 Richiesta automazione: %s", msg["prompt"][:100])

        # Ottieni config
        config_entries = hass.data.get(DOMAIN, {})
        if not config_entries:
            _LOGGER.error("❌ Integrazione non configurata")
            connection.send_error(
                msg["id"], "not_configured", "Integrazione non configurata"
            )
            return

        entry_id = list(config_entries.keys())[0]
        config = config_entries[entry_id]
        provider = config.get("ai_provider", "groq")

        _LOGGER.info(
            "🔍 Provider: %s, Model: %s", provider, config.get("ai_model")
        )

        # Genera YAML
        yaml_output = await call_ai(msg["prompt"], config, hass)

        if yaml_output.startswith("# Errore"):
            _LOGGER.error("❌ Errore generazione: %s", yaml_output)
            connection.send_result(
                msg["id"], {"success": False, "error": yaml_output}
            )
        else:
            _LOGGER.info("✅ YAML generato con successo (%d caratteri)", len(yaml_output))
            connection.send_result(
                msg["id"], {"success": True, "yaml": yaml_output}
            )

    except Exception as e:
        _LOGGER.error("❌ Errore ws_build_automation: %s", e, exc_info=True)
        connection.send_error(msg["id"], "generation_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_GET_ENTITIES,
    }
)
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
            entities[domain].append(
                {
                    "id": state.entity_id,
                    "name": state.name or state.entity_id,
                    "state": state.state,
                }
            )

        _LOGGER.info(
            "✅ Restituite %d entità", sum(len(v) for v in entities.values())
        )
        connection.send_result(msg["id"], {"entities": entities})

    except Exception as e:
        _LOGGER.error("❌ Errore get_entities: %s", e)
        connection.send_error(msg["id"], "entities_failed", str(e))


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_VALIDATE_YAML,
        vol.Required("yaml"): str,
    }
)
@websocket_api.async_response
async def ws_validate_yaml(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Valida YAML."""
    try:
        yaml_content = msg["yaml"].strip()
        
        if not yaml_content:
            raise ValueError("YAML vuoto")

        # Prova a parsare il YAML
        data = yaml.safe_load(yaml_content)

        if data is None:
            raise ValueError("YAML è vuoto o None")

        # Se è un dizionario singolo, accettalo
        if isinstance(data, dict):
            # Validazione morbida: basta che abbia alias e trigger/action
            has_basic_structure = "alias" in data or "description" in data
            if has_basic_structure:
                _LOGGER.info("✅ YAML validato con successo (dict)")
                connection.send_result(msg["id"], {"valid": True, "message": "YAML valido"})
                return

        # Se è una lista, valida ogni elemento
        if isinstance(data, list):
            for item in data:
                if not isinstance(item, dict):
                    raise ValueError("Elemento della lista non è un dizionario")
                # Ogni automazione dovrebbe avere almeno alias
                if "alias" not in item:
                    raise ValueError("Manca 'alias' in un'automazione")

            _LOGGER.info("✅ YAML validato con successo (list)")
            connection.send_result(msg["id"], {"valid": True, "message": "YAML valido"})
            return

        raise ValueError(
            "YAML deve essere un dizionario o una lista di dizionari"
        )

    except yaml.YAMLError as e:
        _LOGGER.warning("⚠️ Errore YAML: %s", e)
        connection.send_result(
            msg["id"],
            {
                "valid": False,
                "error": f"Errore parsing YAML: {str(e)[:200]}",
            },
        )

    except ValueError as e:
        _LOGGER.warning("⚠️ Validazione fallita: %s", e)
        connection.send_result(
            msg["id"],
            {"valid": False, "error": f"Validazione fallita: {str(e)}"},
        )

    except Exception as e:
        _LOGGER.error("❌ Errore validazione YAML: %s", e, exc_info=True)
        connection.send_result(
            msg["id"],
            {"valid": False, "error": f"Errore inaspettato: {str(e)[:200]}"},
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_TYPE_EXPORT_YAML,
        vol.Required("yaml"): str,
        vol.Optional("filename", default="automation.yaml"): str,
    }
)
@websocket_api.async_response
async def ws_export_yaml(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Esporta YAML nel file di automazione."""
    try:
        yaml_content = msg["yaml"].strip()
        
        if not yaml_content:
            raise ValueError("YAML vuoto")

        # Salva nel file di automazione
        automation_file = hass.config.path("automations.yaml")
        
        # Leggi il contenuto esistente
        try:
            with open(automation_file, "r", encoding="utf-8") as f:
                existing = f.read()
        except FileNotFoundError:
            existing = ""

        # Aggiungi il nuovo YAML
        new_content = existing + "\n# Automazione generata da AI Automation Builder\n" + yaml_content + "\n"

        # Scrivi il file
        with open(automation_file, "w", encoding="utf-8") as f:
            f.write(new_content)

        _LOGGER.info("✅ YAML esportato in %s", automation_file)
        
        connection.send_result(
            msg["id"],
            {
                "success": True,
                "message": "YAML esportato con successo",
                "file": automation_file,
            },
        )

    except Exception as e:
        _LOGGER.error("❌ Errore esportazione YAML: %s", e, exc_info=True)
        connection.send_error(msg["id"], "export_failed", str(e))


async def call_ai(prompt: str, config: dict, hass: HomeAssistant) -> str:
    """Chiama API AI per generare YAML."""
    provider = config.get("ai_provider", "groq")
    api_key = config.get("api_key")
    model = config.get("ai_model", "llama-3.3-70b-versatile")

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

    # Ottieni lista entità per contesto
    entities_context = ""
    try:
        entities = {}
        for state in hass.states.async_all():
            domain = state.domain
            if domain not in entities:
                entities[domain] = []
            if len(entities[domain]) < 5:  # Limita a 5 per dominio
                entities[domain].append(state.entity_id)

        entities_context = "\n\nEntità disponibili:\n"
        for domain, entity_list in entities.items():
            entities_context += f"- {domain}: {', '.join(entity_list)}\n"
    except Exception as e:
        _LOGGER.warning("⚠️ Errore recupero entità: %s", e)

    # System prompt migliorato
    system_prompt = f"""Sei un esperto di Home Assistant. Genera SOLO YAML valido per automazioni.

FORMATO RICHIESTO:

```yaml
- alias: "Nome descrittivo"
  description: "Descrizione breve"
  trigger:
    - platform: state
      entity_id: sensor.example
      to: "on"
  condition: []
  action:
    - service: light.turn_on
      target:
        entity_id: light.example
```

REGOLE IMPORTANTI:

1. Usa le chiavi corrette di Home Assistant
2. "trigger" (singolare) e non "triggers"
3. "action" (singolare) e non "actions"
4. "condition" (singolare) e non "conditions"
5. NO commenti, NO markdown, SOLO YAML valido
6. Assicurati che il YAML sia sintatticamente corretto

{entities_context}

Genera SOLO il codice YAML, niente altro."""

    # Payload
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 2000,
    }

    try:
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            _LOGGER.debug("📤 Invio richiesta a %s", endpoint)
            async with session.post(
                endpoint,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    _LOGGER.error(
                        "❌ API Error %s: %s", resp.status, error_text[:500]
                    )
                    
                    # Gestisci error 429 per OpenAI
                    if resp.status == 429:
                        return "# Errore API 429: Quota superata. Controlla il tuo account OpenAI e i crediti disponibili su https://platform.openai.com/account/billing"
                    
                    return f"# Errore API {resp.status}: {error_text[:200]}"

                data = await resp.json()

                if "choices" not in data or len(data["choices"]) == 0:
                    _LOGGER.error("❌ Risposta API invalida: %s", data)
                    return "# Errore: Risposta API invalida"

                content = data["choices"][0]["message"]["content"]

                # Rimuovi markdown e pulisci
                content = content.strip()

                # Rimuovi blocchi code markdown
                if "```yaml" in content:
                    content = content.split("```yaml")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()

                # Rimuovi eventuali linee di commento all'inizio
                lines = content.split("\n")
                cleaned_lines = [
                    line
                    for line in lines
                    if not line.strip().startswith("#") or line.strip().startswith("#!")
                ]
                content = "\n".join(cleaned_lines).strip()

                _LOGGER.info("✅ YAML generato (%d caratteri)", len(content))
                _LOGGER.debug("📄 YAML generato:\n%s", content[:500])

                return content

    except asyncio.TimeoutError:
        _LOGGER.error("❌ Timeout nella chiamata API")
        return "# Errore: Timeout - L'API ha impiegato troppo tempo a rispondere"

    except aiohttp.ClientError as e:
        _LOGGER.error("❌ Errore connessione: %s", e)
        return f"# Errore connessione: {e}"

    except Exception as e:
        _LOGGER.error("❌ Errore call_ai: %s", e, exc_info=True)
        return f"# Errore: {e}"
