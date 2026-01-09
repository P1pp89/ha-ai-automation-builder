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


class AIAutomationBuilderConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow per AI Automation Builder."""

    VERSION = 2

    async def async_step_user(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Primo passo: scegli il provider."""
        errors: Dict[str, str] = {}

        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        # Rileva se HA Cloud è attivo
        ha_cloud_available = await self._check_ha_cloud()

        if user_input is not None:
            provider = user_input.get("ai_provider")
            
            # Vai al passo successivo in base al provider
            if provider == "ha_cloud":
                return await self.async_step_ha_cloud()
            elif provider == "groq":
                return await self.async_step_groq()
            elif provider == "openai":
                return await self.async_step_openai()
            else:
                return await self.async_step_github_models()

        # Schema dinamico in base a HA Cloud
        provider_options = ["groq"]
        provider_help = "GROQ (Gratis, velocissimo)"

        if ha_cloud_available:
            provider_options.insert(0, "ha_cloud")
            provider_help = "Home Assistant Cloud (Consigliato se iscritto) | GROQ (Gratis alternativa)"

        provider_options.extend(["openai", "github_models"])

        schema = vol.Schema(
            {
                vol.Required("ai_provider", default=provider_options[0]): vol.In(
                    provider_options
                ),
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
            description_placeholders={"provider_info": provider_help},
        )

    async def async_step_ha_cloud(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Setup per Home Assistant Cloud."""
        errors: Dict[str, str] = {}

        if user_input is not None:
            return self.async_create_entry(
                title="AI Automation Builder (HA Cloud)",
                data={
                    "ai_provider": "ha_cloud",
                    "ai_model": user_input.get("ai_model", "gpt-4-turbo"),
                },
            )

        schema = vol.Schema(
            {
                vol.Required("ai_model", default="gpt-4-turbo"): vol.In(
                    ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
                ),
            }
        )

        return self.async_show_form(
            step_id="ha_cloud",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "info": "Home Assistant Cloud gestirà automaticamente l'autenticazione."
            },
        )

    async def async_step_groq(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Setup per GROQ."""
        errors: Dict[str, str] = {}

        if user_input is not None:
            api_key = user_input.get("api_key", "").strip()

            if not api_key:
                errors["api_key"] = "API Key è obbligatoria"
            elif not api_key.startswith("gsk_"):
                errors["api_key"] = "API Key GROQ invalida (deve iniziare con 'gsk_')"

            if not errors:
                return self.async_create_entry(
                    title="AI Automation Builder (GROQ)",
                    data={
                        "ai_provider": "groq",
                        "api_key": api_key,
                        "ai_model": user_input.get("ai_model", "mixtral-8x7b-32768"),
                    },
                )

        schema = vol.Schema(
            {
                vol.Required("api_key"): cv.string,
                vol.Required("ai_model", default="mixtral-8x7b-32768"): vol.In(
                    [
                        "mixtral-8x7b-32768",
                        "llama2-70b-4096",
                        "gemma-7b-it",
                    ]
                ),
            }
        )

        return self.async_show_form(
            step_id="groq",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "info": "1. Vai a https://console.groq.com\n2. Genera API Key\n3. Incollala qui"
            },
        )

    async def async_step_openai(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Setup per OpenAI."""
        errors: Dict[str, str] = {}

        if user_input is not None:
            api_key = user_input.get("api_key", "").strip()

            if not api_key:
                errors["api_key"] = "API Key è obbligatoria"
            elif not api_key.startswith("sk-"):
                errors["api_key"] = "API Key OpenAI invalida (deve iniziare con 'sk-')"

            if not errors:
                return self.async_create_entry(
                    title="AI Automation Builder (OpenAI)",
                    data={
                        "ai_provider": "openai",
                        "api_key": api_key,
                        "ai_model": user_input.get("ai_model", "gpt-3.5-turbo"),
                    },
                )

        schema = vol.Schema(
            {
                vol.Required("api_key"): cv.string,
                vol.Required("ai_model", default="gpt-3.5-turbo"): vol.In(
                    ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
                ),
            }
        )

        return self.async_show_form(
            step_id="openai",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "info": "1. Vai a https://platform.openai.com/api-keys\n2. Genera API Key\n3. Incollala qui"
            },
        )

    async def async_step_github_models(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Setup per GitHub Models."""
        errors: Dict[str, str] = {}

        if user_input is not None:
            api_key = user_input.get("api_key", "").strip()

            if not api_key:
                errors["api_key"] = "API Key è obbligatoria"

            if not errors:
                return self.async_create_entry(
                    title="AI Automation Builder (GitHub Models)",
                    data={
                        "ai_provider": "github_models",
                        "api_key": api_key,
                        "ai_model": user_input.get("ai_model", "Meta-Llama-3.5-8B-Instruct"),
                    },
                )

        schema = vol.Schema(
            {
                vol.Required("api_key"): cv.string,
                vol.Required("ai_model", default="Meta-Llama-3.5-8B-Instruct"): vol.In(
                    [
                        "Meta-Llama-3.5-8B-Instruct",
                        "Phi-3.5-mini-instruct",
                        "Mistral-Nemo",
                    ]
                ),
            }
        )

        return self.async_show_form(
            step_id="github_models",
            data_schema=schema,
            errors=errors,
            description_placeholders={
                "info": "1. Vai a https://github.com/marketplace/models\n2. Genera GitHub Token\n3. Incollalo qui"
            },
        )

    async def _check_ha_cloud(self) -> bool:
        """Controlla se HA Cloud è disponibile e attivo."""
        try:
            # Verifica se il componente cloud è caricato
            if "cloud" in self.hass.data:
                return True
            return False
        except Exception:
            return False

