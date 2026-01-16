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
    WS_TYPE_PREVIEW_AUTOMATION,
    WS_TYPE_TEST_AUTOMATION,
    WS_TYPE_DRY_RUN_AUTOMATION,
)

_LOGGER = logging.getLogger(__name__)


# Traduzioni per i messaggi di analisi
TRANSLATIONS = {
    "it": {
        "automation_no_name": "Automazione senza nome",
        "entity_not_found": "Entità '{entity_id}' non trovata",
        "when": "Quando",
        "changes_from": "cambia da",
        "to": "a",
        "at_time": "Alle ore",
        "at": "Al",
        "with_offset": "con offset",
        "above": "supera",
        "below": "scende sotto",
        "trigger_type": "Trigger di tipo",
        "if": "Se",
        "is": "è",
        "if_time_is": "Se l'ora è",
        "after": "dopo",
        "before": "prima di",
        "condition_type": "Condizione di tipo",
        "turn_on_light": "Accendi luce",
        "turn_off_light": "Spegni luce",
        "turn_on_switch": "Accendi interruttore",
        "turn_off_switch": "Spegni interruttore",
        "send_notification": "Invia notifica",
        "set_temperature": "Imposta temperatura",
        "execute_action": "Esegui azione",
        "on": "su",
        "brightness": "luminosità",
        "action_success": "Azione '{action}' eseguita con successo",
        "action_no_name": "Azione senza nome",
        "invalid_action_name": "Nome azione invalido",
        "would_execute_action": "Simulerebbe azione",
        "would_turn_on": "Accenderebbe",
        "from_to": "da '{current}' a '{predicted}'",
        "would_turn_off": "Spegnerebbe",
        "would_set_temp": "Imposterebbe temperatura di",
        "target": "target"
    },
    "en": {
        "automation_no_name": "Automation without name",
        "entity_not_found": "Entity '{entity_id}' not found",
        "when": "When",
        "changes_from": "changes from",
        "to": "to",
        "at_time": "At",
        "at": "At",
        "with_offset": "with offset",
        "above": "above",
        "below": "below",
        "trigger_type": "Trigger type",
        "if": "If",
        "is": "is",
        "if_time_is": "If time is",
        "after": "after",
        "before": "before",
        "condition_type": "Condition type",
        "turn_on_light": "Turn on light",
        "turn_off_light": "Turn off light",
        "turn_on_switch": "Turn on switch",
        "turn_off_switch": "Turn off switch",
        "send_notification": "Send notification",
        "set_temperature": "Set temperature",
        "execute_action": "Execute action",
        "on": "on",
        "brightness": "brightness",
        "action_success": "Action '{action}' executed successfully",
        "action_no_name": "Action without name",
        "invalid_action_name": "Invalid action name",
        "would_execute_action": "Would execute action",
        "would_turn_on": "Would turn on",
        "from_to": "from '{current}' to '{predicted}'",
        "would_turn_off": "Would turn off",
        "would_set_temp": "Would set temperature of",
        "target": "target"
    },
    "es": {
        "automation_no_name": "Automatización sin nombre",
        "entity_not_found": "Entidad '{entity_id}' no encontrada",
        "when": "Cuando",
        "changes_from": "cambia de",
        "to": "a",
        "at_time": "A las",
        "at": "Al",
        "with_offset": "con desplazamiento",
        "above": "supera",
        "below": "baja de",
        "trigger_type": "Tipo de disparador",
        "if": "Si",
        "is": "es",
        "if_time_is": "Si la hora es",
        "after": "después de",
        "before": "antes de",
        "condition_type": "Tipo de condición",
        "turn_on_light": "Encender luz",
        "turn_off_light": "Apagar luz",
        "turn_on_switch": "Encender interruptor",
        "turn_off_switch": "Apagar interruptor",
        "send_notification": "Enviar notificación",
        "set_temperature": "Establecer temperatura",
        "execute_action": "Ejecutar acción",
        "on": "en",
        "brightness": "brillo",
        "action_success": "Acción '{action}' ejecutada con éxito",
        "action_no_name": "Acción sin nombre",
        "invalid_action_name": "Nombre de acción inválido",
        "would_execute_action": "Ejecutaría acción",
        "would_turn_on": "Encendería",
        "from_to": "de '{current}' a '{predicted}'",
        "would_turn_off": "Apagaría",
        "would_set_temp": "Establecería temperatura de",
        "target": "objetivo"
    },
    "fr": {
        "automation_no_name": "Automatisation sans nom",
        "entity_not_found": "Entité '{entity_id}' non trouvée",
        "when": "Quand",
        "changes_from": "change de",
        "to": "à",
        "at_time": "À",
        "at": "Au",
        "with_offset": "avec décalage",
        "above": "dépasse",
        "below": "descend sous",
        "trigger_type": "Type de déclencheur",
        "if": "Si",
        "is": "est",
        "if_time_is": "Si l'heure est",
        "after": "après",
        "before": "avant",
        "condition_type": "Type de condition",
        "turn_on_light": "Allumer lumière",
        "turn_off_light": "Éteindre lumière",
        "turn_on_switch": "Allumer interrupteur",
        "turn_off_switch": "Éteindre interrupteur",
        "send_notification": "Envoyer notification",
        "set_temperature": "Définir température",
        "execute_action": "Exécuter action",
        "on": "sur",
        "brightness": "luminosité",
        "action_success": "Action '{action}' exécutée avec succès",
        "action_no_name": "Action sans nom",
        "invalid_action_name": "Nom d'action invalide",
        "would_execute_action": "Exécuterait action",
        "would_turn_on": "Allumerait",
        "from_to": "de '{current}' à '{predicted}'",
        "would_turn_off": "Éteindrait",
        "would_set_temp": "Définirait température de",
        "target": "cible"
    },
    "de": {
        "automation_no_name": "Automatisierung ohne Namen",
        "entity_not_found": "Entität '{entity_id}' nicht gefunden",
        "when": "Wenn",
        "changes_from": "ändert sich von",
        "to": "zu",
        "at_time": "Um",
        "at": "Bei",
        "with_offset": "mit Versatz",
        "above": "über",
        "below": "unter",
        "trigger_type": "Trigger-Typ",
        "if": "Wenn",
        "is": "ist",
        "if_time_is": "Wenn Zeit ist",
        "after": "nach",
        "before": "vor",
        "condition_type": "Bedingungstyp",
        "turn_on_light": "Licht einschalten",
        "turn_off_light": "Licht ausschalten",
        "turn_on_switch": "Schalter einschalten",
        "turn_off_switch": "Schalter ausschalten",
        "send_notification": "Benachrichtigung senden",
        "set_temperature": "Temperatur einstellen",
        "execute_action": "Aktion ausführen",
        "on": "auf",
        "brightness": "Helligkeit",
        "action_success": "Aktion '{action}' erfolgreich ausgeführt",
        "action_no_name": "Aktion ohne Namen",
        "invalid_action_name": "Ungültiger Aktionsname",
        "would_execute_action": "Würde Aktion ausführen",
        "would_turn_on": "Würde einschalten",
        "from_to": "von '{current}' zu '{predicted}'",
        "would_turn_off": "Würde ausschalten",
        "would_set_temp": "Würde Temperatur einstellen von",
        "target": "Ziel"
    },
    "pt": {
        "automation_no_name": "Automação sem nome",
        "entity_not_found": "Entidade '{entity_id}' não encontrada",
        "when": "Quando",
        "changes_from": "muda de",
        "to": "para",
        "at_time": "Às",
        "at": "Ao",
        "with_offset": "com deslocamento",
        "above": "acima de",
        "below": "abaixo de",
        "trigger_type": "Tipo de gatilho",
        "if": "Se",
        "is": "é",
        "if_time_is": "Se a hora é",
        "after": "depois de",
        "before": "antes de",
        "condition_type": "Tipo de condição",
        "turn_on_light": "Ligar luz",
        "turn_off_light": "Desligar luz",
        "turn_on_switch": "Ligar interruptor",
        "turn_off_switch": "Desligar interruptor",
        "send_notification": "Enviar notificação",
        "set_temperature": "Definir temperatura",
        "execute_action": "Executar ação",
        "on": "em",
        "brightness": "brilho",
        "action_success": "Ação '{action}' executada com sucesso",
        "action_no_name": "Ação sem nome",
        "invalid_action_name": "Nome de ação inválido",
        "would_execute_action": "Executaria ação",
        "would_turn_on": "Ligaria",
        "from_to": "de '{current}' para '{predicted}'",
        "would_turn_off": "Desligaria",
        "would_set_temp": "Definiria temperatura de",
        "target": "alvo"
    },
    "nl": {
        "automation_no_name": "Automatisering zonder naam",
        "entity_not_found": "Entiteit '{entity_id}' niet gevonden",
        "when": "Wanneer",
        "changes_from": "verandert van",
        "to": "naar",
        "at_time": "Om",
        "at": "Bij",
        "with_offset": "met offset",
        "above": "boven",
        "below": "onder",
        "trigger_type": "Trigger type",
        "if": "Als",
        "is": "is",
        "if_time_is": "Als tijd is",
        "after": "na",
        "before": "voor",
        "condition_type": "Conditie type",
        "turn_on_light": "Licht aanzetten",
        "turn_off_light": "Licht uitzetten",
        "turn_on_switch": "Schakelaar aanzetten",
        "turn_off_switch": "Schakelaar uitzetten",
        "send_notification": "Melding sturen",
        "set_temperature": "Temperatuur instellen",
        "execute_action": "Actie uitvoeren",
        "on": "op",
        "brightness": "helderheid",
        "action_success": "Actie '{action}' succesvol uitgevoerd",
        "action_no_name": "Actie zonder naam",
        "invalid_action_name": "Ongeldige actienaam",
        "would_execute_action": "Zou actie uitvoeren",
        "would_turn_on": "Zou aanzetten",
        "from_to": "van '{current}' naar '{predicted}'",
        "would_turn_off": "Zou uitzetten",
        "would_set_temp": "Zou temperatuur instellen van",
        "target": "doel"
    }
}


def get_translation(language: str, key: str, **kwargs) -> str:
    """Ottieni una traduzione per la lingua specificata."""
    lang_dict = TRANSLATIONS.get(language, TRANSLATIONS["en"])
    text = lang_dict.get(key, TRANSLATIONS["en"].get(key, key))
    return text.format(**kwargs) if kwargs else text


async def async_setup_ws(hass: HomeAssistant) -> None:
    """Registra i comandi WebSocket."""
    websocket_api.async_register_command(hass, ws_build_automation)
    websocket_api.async_register_command(hass, ws_get_entities)
    websocket_api.async_register_command(hass, ws_validate_yaml)
    websocket_api.async_register_command(hass, ws_preview_automation)
    websocket_api.async_register_command(hass, ws_test_automation)
    websocket_api.async_register_command(hass, ws_dry_run_automation)
    _LOGGER.info("✅ WebSocket commands registrati")


@websocket_api.websocket_command({
    vol.Required("type"): WS_TYPE_BUILD_AUTOMATION,
    vol.Required("prompt"): str,
    vol.Optional("language", default="en"): str,
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
        
        # Ottieni la lingua dall'utente
        language = msg.get("language", "en")
        _LOGGER.info("🌍 Lingua: %s", language)
        
        # Genera YAML
        yaml_output = await call_ai(msg["prompt"], config, language)
        
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


async def call_ai(prompt: str, config: dict, language: str = "en") -> str:
    """Chiama API AI per generare YAML - FORMATO UI HOME ASSISTANT 2024+"""
    provider = config.get("ai_provider", "groq")
    api_key = config.get("api_key")
    model = config.get("ai_model", "llama-3.1-8b-instant")
    
    if not api_key:
        return "# Errore: API Key mancante"
    
    _LOGGER.info("🚀 Chiamata %s con model %s (lingua: %s)", provider, model, language)
    
    # Endpoint
    endpoints = {
        "groq": "https://api.groq.com/openai/v1/chat/completions",
        "openai": "https://api.openai.com/v1/chat/completions",
        "github_models": "https://models.inference.ai.azure.com/chat/completions",
    }
    
    endpoint = endpoints.get(provider)
    if not endpoint:
        return f"# Errore: Provider {provider} non supportato"
    
    # PROMPT TRADOTTI PER LINGUA
    system_prompts = {
        "it": """Sei un esperto di Home Assistant. Genera SOLO YAML compatibile con l'UI di Home Assistant.

FORMATO OBBLIGATORIO (usa ESATTAMENTE questa sintassi):

alias: "Nome automazione in italiano"
description: "Descrizione opzionale in italiano"
triggers:
  - trigger: time
    at: "20:00:00"
conditions: []
actions:
  - action: light.turn_on
    target:
      entity_id: light.example
mode: single

REGOLE CRITICHE:
1. USA "triggers:" (PLURALE) non "trigger:" - scrivilo UNA SOLA VOLTA all'inizio
2. USA "actions:" (PLURALE) non "action:" - scrivilo UNA SOLA VOLTA all'inizio
3. USA "action:" dentro gli elementi della lista actions, NON "service:"
4. USA "trigger:" per specificare il tipo (state/time/sun/numeric_state)
5. USA "condition:" per specificare il tipo di condizione
6. SEMPRE includi "mode: single" alla FINE
7. NON usare sintassi YAML deprecata
8. Genera SOLO YAML puro, nessun commento o markdown
9. IMPORTANTE: Scrivi "alias" e "description" in ITALIANO
10. NON duplicare MAI "triggers:", "conditions:", o "actions:" - scrivi ognuno UNA SOLA VOLTA

ESEMPIO CORRETTO:
alias: "Accendi luci alle 20:00"
description: "Accende automaticamente le luci del salotto"
triggers:
  - trigger: time
    at: "20:00:00"
conditions: []
actions:
  - action: light.turn_on
    target:
      entity_id: light.salotto
mode: single

SBAGLIATO - NON FARE COSÌ:
alias: "Accendi luci"
triggers:
  - trigger: time
    at: "20:00:00"
actions:
  - action: light.turn_on
    target:
      entity_id: light.salotto
actions:  ← SBAGLIATO! Non ripetere "actions:"
  - action: notify.notify
mode: single

Genera SOLO il YAML richiesto dall'utente seguendo ESATTAMENTE questo formato.""",
        
        "en": """You are a Home Assistant expert. Generate ONLY YAML compatible with Home Assistant UI.

REQUIRED FORMAT (use EXACTLY this syntax):

alias: "Automation name in English"
description: "Optional description in English"
triggers:
  - trigger: time
    at: "20:00:00"
conditions: []
actions:
  - action: light.turn_on
    target:
      entity_id: light.example
mode: single

CRITICAL RULES:
1. USE "triggers:" (PLURAL) not "trigger:" - write it ONCE at the beginning
2. USE "actions:" (PLURAL) not "action:" - write it ONCE at the beginning
3. USE "action:" inside the actions list items, NOT "service:"
4. USE "trigger:" to specify type (state/time/sun/numeric_state)
5. USE "condition:" to specify condition type
6. ALWAYS include "mode: single" at the END
7. DO NOT use deprecated YAML syntax
8. Generate ONLY pure YAML, no comments or markdown
9. IMPORTANT: Write "alias" and "description" in ENGLISH
10. NEVER duplicate "triggers:", "conditions:", or "actions:" - write each ONCE only

CORRECT EXAMPLE:
alias: "Turn on lights at 8 PM"
description: "Automatically turn on living room lights"
triggers:
  - trigger: time
    at: "20:00:00"
conditions: []
actions:
  - action: light.turn_on
    target:
      entity_id: light.living_room
mode: single

WRONG - DO NOT DO THIS:
alias: "Turn on lights"
triggers:
  - trigger: time
    at: "20:00:00"
actions:
  - action: light.turn_on
    target:
      entity_id: light.living_room
actions:  ← WRONG! Do not repeat "actions:"
  - action: notify.notify
mode: single

Generate ONLY the YAML requested by the user following EXACTLY this format.""",
        
        "es": """Eres un experto en Home Assistant. Genera SOLO YAML compatible con la UI de Home Assistant.

FORMATO OBLIGATORIO (usa EXACTAMENTE esta sintaxis):

alias: "Nombre de automatización en español"
description: "Descripción opcional en español"
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
      message: "Mensaje en español"
      title: "Título en español"
mode: single

REGLAS CRÍTICAS:
1. USA "triggers:" (PLURAL) no "trigger:"
2. USA "actions:" (PLURAL) no "action:"
3. USA "action:" dentro de actions, NO "service:"
4. USA "trigger:" para especificar el tipo (state/time/sun/numeric_state)
5. USA "condition:" para especificar el tipo de condición
6. SIEMPRE incluye "mode: single" al final
7. NO uses sintaxis YAML obsoleta
8. Genera SOLO YAML puro, sin comentarios ni markdown
9. IMPORTANTE: Escribe "alias" y "description" en ESPAÑOL

Genera SOLO el YAML solicitado por el usuario siguiendo EXACTAMENTE este formato.""",
        
        "fr": """Vous êtes un expert Home Assistant. Générez UNIQUEMENT du YAML compatible avec l'UI Home Assistant.

FORMAT OBLIGATOIRE (utilisez EXACTEMENT cette syntaxe):

alias: "Nom d'automatisation en français"
description: "Description optionnelle en français"
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
      message: "Message en français"
      title: "Titre en français"
mode: single

RÈGLES CRITIQUES:
1. UTILISEZ "triggers:" (PLURIEL) pas "trigger:"
2. UTILISEZ "actions:" (PLURIEL) pas "action:"
3. UTILISEZ "action:" dans actions, PAS "service:"
4. UTILISEZ "trigger:" pour spécifier le type (state/time/sun/numeric_state)
5. UTILISEZ "condition:" pour spécifier le type de condition
6. TOUJOURS inclure "mode: single" à la fin
7. N'utilisez PAS de syntaxe YAML obsolète
8. Générez UNIQUEMENT du YAML pur, sans commentaires ni markdown
9. IMPORTANT: Écrivez "alias" et "description" en FRANÇAIS

Générez UNIQUEMENT le YAML demandé par l'utilisateur en suivant EXACTEMENT ce format.""",
        
        "de": """Sie sind ein Home Assistant Experte. Generieren Sie NUR YAML kompatibel mit der Home Assistant UI.

ERFORDERLICHES FORMAT (verwenden Sie GENAU diese Syntax):

alias: "Automatisierungsname auf Deutsch"
description: "Optionale Beschreibung auf Deutsch"
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
      message: "Nachricht auf Deutsch"
      title: "Titel auf Deutsch"
mode: single

KRITISCHE REGELN:
1. VERWENDEN Sie "triggers:" (PLURAL) nicht "trigger:"
2. VERWENDEN Sie "actions:" (PLURAL) nicht "action:"
3. VERWENDEN Sie "action:" in actions, NICHT "service:"
4. VERWENDEN Sie "trigger:" um den Typ anzugeben (state/time/sun/numeric_state)
5. VERWENDEN Sie "condition:" um den Bedingungstyp anzugeben
6. IMMER "mode: single" am Ende einfügen
7. Verwenden Sie KEINE veraltete YAML-Syntax
8. Generieren Sie NUR reines YAML, keine Kommentare oder Markdown
9. WICHTIG: Schreiben Sie "alias" und "description" auf DEUTSCH

Generieren Sie NUR das vom Benutzer angeforderte YAML in GENAU diesem Format.""",
        
        "pt": """Você é um especialista em Home Assistant. Gere APENAS YAML compatível com a UI do Home Assistant.

FORMATO OBRIGATÓRIO (use EXATAMENTE esta sintaxe):

alias: "Nome da automação em português"
description: "Descrição opcional em português"
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
      message: "Mensagem em português"
      title: "Título em português"
mode: single

REGRAS CRÍTICAS:
1. USE "triggers:" (PLURAL) não "trigger:"
2. USE "actions:" (PLURAL) não "action:"
3. USE "action:" dentro de actions, NÃO "service:"
4. USE "trigger:" para especificar o tipo (state/time/sun/numeric_state)
5. USE "condition:" para especificar o tipo de condição
6. SEMPRE inclua "mode: single" no final
7. NÃO use sintaxe YAML obsoleta
8. Gere APENAS YAML puro, sem comentários ou markdown
9. IMPORTANTE: Escreva "alias" e "description" em PORTUGUÊS

Gere APENAS o YAML solicitado pelo usuário seguindo EXATAMENTE este formato.""",
        
        "nl": """U bent een Home Assistant expert. Genereer ALLEEN YAML compatibel met de Home Assistant UI.

VEREIST FORMAAT (gebruik EXACT deze syntaxis):

alias: "Automatiseringsnaam in het Nederlands"
description: "Optionele beschrijving in het Nederlands"
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
      message: "Bericht in het Nederlands"
      title: "Titel in het Nederlands"
mode: single

KRITIEKE REGELS:
1. GEBRUIK "triggers:" (MEERVOUD) niet "trigger:"
2. GEBRUIK "actions:" (MEERVOUD) niet "action:"
3. GEBRUIK "action:" binnen actions, NIET "service:"
4. GEBRUIK "trigger:" om het type te specificeren (state/time/sun/numeric_state)
5. GEBRUIK "condition:" om het conditietype te specificeren
6. ALTIJD "mode: single" aan het einde toevoegen
7. Gebruik GEEN verouderde YAML-syntaxis
8. Genereer ALLEEN pure YAML, geen opmerkingen of markdown
9. BELANGRIJK: Schrijf "alias" en "description" in het NEDERLANDS

Genereer ALLEEN de door de gebruiker gevraagde YAML volgens EXACT dit formaat."""
    }
    
    # Usa il prompt nella lingua richiesta, fallback a inglese
    system_prompt = system_prompts.get(language, system_prompts["en"])
    
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


@websocket_api.websocket_command({
    vol.Required("type"): WS_TYPE_PREVIEW_AUTOMATION,
    vol.Required("yaml"): str,
    vol.Optional("language", default="en"): str,
})
@websocket_api.async_response
async def ws_preview_automation(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Analizza l'automazione e mostra cosa farà."""
    try:
        data = yaml.safe_load(msg["yaml"])
        
        if not isinstance(data, dict):
            raise ValueError("YAML deve essere un dizionario")
        
        language = msg.get("language", "en")
        preview = await analyze_automation(hass, data, language)
        connection.send_result(msg["id"], {"success": True, "preview": preview})
        
    except Exception as e:
        _LOGGER.error("❌ Errore preview: %s", e)
        connection.send_error(msg["id"], "preview_failed", str(e))


@websocket_api.websocket_command({
    vol.Required("type"): WS_TYPE_TEST_AUTOMATION,
    vol.Required("yaml"): str,
    vol.Optional("language", default="en"): str,
})
@websocket_api.async_response
async def ws_test_automation(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Esegue l'automazione una volta per testare."""
    try:
        data = yaml.safe_load(msg["yaml"])
        
        if not isinstance(data, dict):
            raise ValueError("YAML deve essere un dizionario")
        
        language = msg.get("language", "en")
        result = await execute_test_automation(hass, data, language)
        connection.send_result(msg["id"], {"success": True, "result": result})
        
    except Exception as e:
        _LOGGER.error("❌ Errore test: %s", e)
        connection.send_error(msg["id"], "test_failed", str(e))


@websocket_api.websocket_command({
    vol.Required("type"): WS_TYPE_DRY_RUN_AUTOMATION,
    vol.Required("yaml"): str,
    vol.Optional("language", default="en"): str,
})
@websocket_api.async_response
async def ws_dry_run_automation(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Simula l'esecuzione dell'automazione senza effetti reali."""
    try:
        data = yaml.safe_load(msg["yaml"])
        
        if not isinstance(data, dict):
            raise ValueError("YAML deve essere un dizionario")
        
        language = msg.get("language", "en")
        result = await simulate_automation(hass, data, language)
        connection.send_result(msg["id"], {"success": True, "simulation": result})
        
    except Exception as e:
        _LOGGER.error("❌ Errore dry run: %s", e)
        connection.send_error(msg["id"], "dry_run_failed", str(e))


async def analyze_automation(hass: HomeAssistant, automation_data: dict, language: str = "en") -> dict:
    """Analizza l'automazione e restituisce un preview dettagliato."""
    preview = {
        "alias": automation_data.get("alias", get_translation(language, "automation_no_name")),
        "description": automation_data.get("description", ""),
        "triggers": [],
        "conditions": [],
        "actions": [],
        "entities_involved": set(),
        "warnings": []
    }
    
    # Analizza triggers
    triggers = automation_data.get("triggers", automation_data.get("trigger", []))
    if not isinstance(triggers, list):
        triggers = [triggers]
    
    for trigger in triggers:
        trigger_info = await analyze_trigger(hass, trigger, language)
        preview["triggers"].append(trigger_info)
        if trigger_info.get("entity_id"):
            preview["entities_involved"].add(trigger_info["entity_id"])
    
    # Analizza conditions
    conditions = automation_data.get("conditions", automation_data.get("condition", []))
    if not isinstance(conditions, list):
        conditions = [conditions]
    
    for condition in conditions:
        condition_info = await analyze_condition(hass, condition, language)
        preview["conditions"].append(condition_info)
        if condition_info.get("entity_id"):
            preview["entities_involved"].add(condition_info["entity_id"])
    
    # Analizza actions
    actions = automation_data.get("actions", automation_data.get("action", []))
    if not isinstance(actions, list):
        actions = [actions]
    
    for action in actions:
        action_info = await analyze_action(hass, action, language)
        preview["actions"].append(action_info)
        if action_info.get("entity_id"):
            preview["entities_involved"].add(action_info["entity_id"])
        if action_info.get("target", {}).get("entity_id"):
            preview["entities_involved"].add(action_info["target"]["entity_id"])
    
    # Converti set in lista per JSON
    preview["entities_involved"] = list(preview["entities_involved"])
    
    # Controlla entità esistenti
    for entity_id in preview["entities_involved"]:
        if not hass.states.get(entity_id):
            preview["warnings"].append(get_translation(language, "entity_not_found", entity_id=entity_id))
    
    return preview


async def analyze_trigger(hass: HomeAssistant, trigger: dict, language: str = "en") -> dict:
    """Analizza un singolo trigger."""
    trigger_type = trigger.get("trigger", "unknown")
    
    info = {
        "type": trigger_type,
        "description": "",
        "entity_id": trigger.get("entity_id"),
        "valid": True
    }
    
    if trigger_type == "state":
        entity_id = trigger.get("entity_id")
        from_state = trigger.get("from")
        to_state = trigger.get("to")
        
        info["description"] = f"{get_translation(language, 'when')} {entity_id}"
        if from_state:
            info["description"] += f" {get_translation(language, 'changes_from')} '{from_state}'"
        if to_state:
            info["description"] += f" {get_translation(language, 'to')} '{to_state}'"
        
        # Verifica se l'entità esiste
        if entity_id and not hass.states.get(entity_id):
            info["valid"] = False
            info["error"] = get_translation(language, "entity_not_found", entity_id=entity_id)
    
    elif trigger_type == "time":
        at_time = trigger.get("at")
        info["description"] = f"{get_translation(language, 'at_time')} {at_time}"
    
    elif trigger_type == "sun":
        event = trigger.get("event", "sunrise")
        offset = trigger.get("offset", 0)
        info["description"] = f"{get_translation(language, 'at')} {event}"
        if offset:
            info["description"] += f" {get_translation(language, 'with_offset')} {offset}"
    
    elif trigger_type == "numeric_state":
        entity_id = trigger.get("entity_id")
        above = trigger.get("above")
        below = trigger.get("below")
        
        info["description"] = f"{get_translation(language, 'when')} {entity_id}"
        if above is not None:
            info["description"] += f" {get_translation(language, 'above')} {above}"
        if below is not None:
            info["description"] += f" {get_translation(language, 'below')} {below}"
    
    else:
        info["description"] = f"{get_translation(language, 'trigger_type')} '{trigger_type}'"
    
    return info


async def analyze_condition(hass: HomeAssistant, condition: dict, language: str = "en") -> dict:
    """Analizza una singola condizione."""
    condition_type = condition.get("condition", "unknown")
    
    info = {
        "type": condition_type,
        "description": "",
        "entity_id": condition.get("entity_id"),
        "valid": True
    }
    
    if condition_type == "state":
        entity_id = condition.get("entity_id")
        state = condition.get("state")
        info["description"] = f"{get_translation(language, 'if')} {entity_id} {get_translation(language, 'is')} '{state}'"
        
        if entity_id and not hass.states.get(entity_id):
            info["valid"] = False
            info["error"] = get_translation(language, "entity_not_found", entity_id=entity_id)
    
    elif condition_type == "time":
        after = condition.get("after")
        before = condition.get("before")
        info["description"] = get_translation(language, "if_time_is")
        if after:
            info["description"] += f" {get_translation(language, 'after')} {after}"
        if before:
            info["description"] += f" {get_translation(language, 'before')} {before}"
    
    elif condition_type == "numeric_state":
        entity_id = condition.get("entity_id")
        above = condition.get("above")
        below = condition.get("below")
        
        info["description"] = f"{get_translation(language, 'if')} {entity_id}"
        if above is not None:
            info["description"] += f" > {above}"
        if below is not None:
            info["description"] += f" < {below}"
    
    else:
        info["description"] = f"{get_translation(language, 'condition_type')} '{condition_type}'"
    
    return info


async def analyze_action(hass: HomeAssistant, action: dict, language: str = "en") -> dict:
    """Analizza una singola azione."""
    action_name = action.get("action", action.get("service", "unknown"))
    
    info = {
        "action": action_name,
        "description": "",
        "target": action.get("target", {}),
        "data": action.get("data", {}),
        "valid": True
    }
    
    # Estrai entity_id dal target o direttamente
    entity_id = None
    if "target" in action and "entity_id" in action["target"]:
        entity_id = action["target"]["entity_id"]
    elif "entity_id" in action:
        entity_id = action["entity_id"]
    
    info["entity_id"] = entity_id
    
    # Descrizioni specifiche per azioni comuni
    if action_name.startswith("light."):
        if "turn_on" in action_name:
            info["description"] = f"{get_translation(language, 'turn_on_light')} {entity_id or get_translation(language, 'target')}"
            if "brightness" in info["data"]:
                info["description"] += f" ({get_translation(language, 'brightness')}: {info['data']['brightness']})"
        elif "turn_off" in action_name:
            info["description"] = f"{get_translation(language, 'turn_off_light')} {entity_id or get_translation(language, 'target')}"
    
    elif action_name.startswith("switch."):
        if "turn_on" in action_name:
            info["description"] = f"{get_translation(language, 'turn_on_switch')} {entity_id or get_translation(language, 'target')}"
        elif "turn_off" in action_name:
            info["description"] = f"{get_translation(language, 'turn_off_switch')} {entity_id or get_translation(language, 'target')}"
    
    elif action_name.startswith("notify."):
        message = info["data"].get("message", "")
        title = info["data"].get("title", "")
        info["description"] = get_translation(language, "send_notification")
        if title:
            info["description"] += f" '{title}'"
        if message:
            info["description"] += f": {message[:50]}..."
    
    elif action_name.startswith("climate."):
        if "set_temperature" in action_name:
            temp = info["data"].get("temperature")
            info["description"] = f"{get_translation(language, 'set_temperature')} {entity_id or get_translation(language, 'target')}"
            if temp:
                info["description"] += f" {get_translation(language, 'to')} {temp}°C"
    
    else:
        info["description"] = f"{get_translation(language, 'execute_action')} '{action_name}'"
        if entity_id:
            info["description"] += f" {get_translation(language, 'on')} {entity_id}"
    
    # Verifica se l'entità esiste
    if entity_id and not hass.states.get(entity_id):
        info["valid"] = False
        info["error"] = get_translation(language, "entity_not_found", entity_id=entity_id)
    
    return info


async def execute_test_automation(hass: HomeAssistant, automation_data: dict, language: str = "en") -> dict:
    """Esegue l'automazione una volta per testare."""
    result = {
        "executed_actions": [],
        "errors": [],
        "success": True,
        "execution_time": None
    }
    
    import time
    start_time = time.time()
    
    try:
        # Esegui solo le azioni (ignora trigger e conditions per il test)
        actions = automation_data.get("actions", automation_data.get("action", []))
        if not isinstance(actions, list):
            actions = [actions]
        
        for i, action in enumerate(actions):
            try:
                action_result = await execute_single_action(hass, action, language)
                result["executed_actions"].append({
                    "index": i,
                    "action": action.get("action", action.get("service")),
                    "result": action_result,
                    "success": True
                })
            except Exception as e:
                result["errors"].append({
                    "index": i,
                    "action": action.get("action", action.get("service")),
                    "error": str(e)
                })
                result["success"] = False
        
        result["execution_time"] = round(time.time() - start_time, 3)
        
    except Exception as e:
        result["success"] = False
        result["errors"].append({"general": str(e)})
    
    return result


async def execute_single_action(hass: HomeAssistant, action: dict, language: str = "en") -> str:
    """Esegue una singola azione."""
    action_name = action.get("action", action.get("service"))
    if not action_name:
        raise ValueError(get_translation(language, "action_no_name"))
    
    # Prepara i parametri
    service_data = action.get("data", {}).copy()
    
    # Gestisci target
    if "target" in action:
        target = action["target"]
        if "entity_id" in target:
            service_data["entity_id"] = target["entity_id"]
    elif "entity_id" in action:
        service_data["entity_id"] = action["entity_id"]
    
    # Dividi domain e service
    if "." in action_name:
        domain, service = action_name.split(".", 1)
    else:
        raise ValueError(get_translation(language, "invalid_action_name") + f": {action_name}")
    
    # Esegui l'azione
    await hass.services.async_call(domain, service, service_data)
    
    return get_translation(language, "action_success", action=action_name)


async def simulate_automation(hass: HomeAssistant, automation_data: dict, language: str = "en") -> dict:
    """Simula l'esecuzione dell'automazione senza effetti reali."""
    simulation = {
        "would_execute": [],
        "current_states": {},
        "predicted_states": {},
        "warnings": []
    }
    
    # Analizza le azioni che verrebbero eseguite
    actions = automation_data.get("actions", automation_data.get("action", []))
    if not isinstance(actions, list):
        actions = [actions]
    
    for i, action in enumerate(actions):
        action_sim = await simulate_single_action(hass, action, language)
        simulation["would_execute"].append({
            "index": i,
            "action": action.get("action", action.get("service")),
            "description": action_sim["description"],
            "entity_id": action_sim.get("entity_id"),
            "current_state": action_sim.get("current_state"),
            "predicted_state": action_sim.get("predicted_state")
        })
        
        # Raccogli stati attuali e previsti
        if action_sim.get("entity_id"):
            entity_id = action_sim["entity_id"]
            simulation["current_states"][entity_id] = action_sim.get("current_state")
            simulation["predicted_states"][entity_id] = action_sim.get("predicted_state")
    
    return simulation


async def simulate_single_action(hass: HomeAssistant, action: dict, language: str = "en") -> dict:
    """Simula una singola azione."""
    action_name = action.get("action", action.get("service", "unknown"))
    
    # Estrai entity_id
    entity_id = None
    if "target" in action and "entity_id" in action["target"]:
        entity_id = action["target"]["entity_id"]
    elif "entity_id" in action:
        entity_id = action["entity_id"]
    
    simulation = {
        "description": f"{get_translation(language, 'would_execute_action')} '{action_name}'",
        "entity_id": entity_id,
        "current_state": None,
        "predicted_state": None
    }
    
    # Ottieni stato attuale se c'è un'entità
    if entity_id:
        current_state = hass.states.get(entity_id)
        if current_state:
            simulation["current_state"] = current_state.state
            
            # Predici il nuovo stato basato sull'azione
            if "turn_on" in action_name:
                simulation["predicted_state"] = "on"
                simulation["description"] = f"{get_translation(language, 'would_turn_on')} {entity_id} ({get_translation(language, 'from_to', current=current_state.state, predicted='on')})"
            elif "turn_off" in action_name:
                simulation["predicted_state"] = "off"
                simulation["description"] = f"{get_translation(language, 'would_turn_off')} {entity_id} ({get_translation(language, 'from_to', current=current_state.state, predicted='off')})"
            elif "set_temperature" in action_name:
                temp = action.get("data", {}).get("temperature")
                if temp:
                    simulation["predicted_state"] = str(temp)
                    simulation["description"] = f"{get_translation(language, 'would_set_temp')} {entity_id} {get_translation(language, 'to')} {temp}°C"
        else:
            simulation["description"] = f"⚠️ {get_translation(language, 'entity_not_found', entity_id=entity_id)}"
    
    return simulation
