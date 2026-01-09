"""Config flow per AI Automation Builder."""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

DATA_SCHEMA = vol.Schema(
    {
        vol.Required("ai_provider", default="ollama"): vol.In(
            ["ollama", "openai", "custom"]
        ),
        vol.Required("ai_endpoint", default="http://homeassistant.local:11434"): cv.string,
        vol.Optional("api_key", default=""): cv.string,
        vol.Required("ai_model", default="phi3:mini"): cv.string,
    }
)


class AIAutomationBuilderConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow per AI Automation Builder."""

    VERSION = 2

    async def async_step_user(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Primo passo del setup."""
        errors: Dict[str, str] = {}

        # Verifica se già configurato
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            # Valida l'endpoint
            endpoint = user_input.get("ai_endpoint", "").strip()
            
            if not endpoint:
                errors["ai_endpoint"] = "Endpoint non può essere vuoto"
            elif not (endpoint.startswith("http://") or endpoint.startswith("https://")):
                errors["ai_endpoint"] = "Endpoint deve iniziare con http:// o https://"
            
            if not errors:
                return self.async_create_entry(
                    title="AI Automation Builder",
                    data=user_input,
                )

        return self.async_show_form(
            step_id="user",
            data_schema=DATA_SCHEMA,
            errors=errors,
            description_placeholders={
                "ollama_info": "Installa Ollama da Impostazioni → Componenti aggiuntivi → Negozio. Cerca 'Ollama' e installalo.",
            },
        )

    async def async_step_import(self, import_data: Dict[str, Any]) -> FlowResult:
        """Importa configurazione da configuration.yaml (legacy)."""
        return await self.async_step_user(import_data)
