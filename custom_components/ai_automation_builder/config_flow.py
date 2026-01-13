"""Config flow per AI Automation Builder."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


class AIAutomationBuilderConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow per AI Automation Builder."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Handle a flow initialized by the user."""
        errors = {}

        # Permetti una sola istanza
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            provider = user_input.get("ai_provider", "groq")
            
            if provider == "groq":
                return await self.async_step_groq(user_input)
            elif provider == "openai":
                return await self.async_step_openai(user_input)
            else:
                return await self.async_step_github(user_input)

        data_schema = vol.Schema({
            vol.Required("ai_provider", default="groq"): vol.In(["groq", "openai", "github_models"])
        })

        return self.async_show_form(
            step_id="user",
            data_schema=data_schema,
            errors=errors,
        )

    async def async_step_groq(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Configure Groq."""
        errors = {}

        if user_input is not None:
            api_key = user_input.get("api_key", "").strip()
            
            if not api_key:
                errors["api_key"] = "API Key richiesta"
            elif not api_key.startswith("gsk_"):
                errors["api_key"] = "API Key deve iniziare con gsk_"
            
            if not errors:
                return self.async_create_entry(
                    title="AI Automation Builder (Groq)",
                    data={
                        "ai_provider": "groq",
                        "api_key": api_key,
                        "ai_model": user_input.get("ai_model", "llama-3.3-70b-versatile"),
                    },
                )

        # Modelli aggiornati Groq (Gennaio 2025)
        data_schema = vol.Schema({
            vol.Required("api_key"): str,
            vol.Optional("ai_model", default="llama-3.3-70b-versatile"): vol.In([
                "llama-3.3-70b-versatile",  # Più recente e versatile
                "llama-3.1-8b-instant",     # Veloce
                "mixtral-8x7b-32768",       # Buon compromesso
                "gemma2-9b-it",             # Alternativa
            ]),
        })

        return self.async_show_form(
            step_id="groq",
            data_schema=data_schema,
            errors=errors,
            description_placeholders={
                "info": "Ottieni API Key gratuita su console.groq.com"
            }
        )

    async def async_step_openai(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Configure OpenAI."""
        errors = {}

        if user_input is not None:
            api_key = user_input.get("api_key", "").strip()
            
            if not api_key:
                errors["api_key"] = "API Key richiesta"
            elif not api_key.startswith("sk-"):
                errors["api_key"] = "API Key deve iniziare con sk-"
            
            if not errors:
                return self.async_create_entry(
                    title="AI Automation Builder (OpenAI)",
                    data={
                        "ai_provider": "openai",
                        "api_key": api_key,
                        "ai_model": user_input.get("ai_model", "gpt-4o-mini"),
                    },
                )

        # Modelli OpenAI aggiornati
        data_schema = vol.Schema({
            vol.Required("api_key"): str,
            vol.Optional("ai_model", default="gpt-4o-mini"): vol.In([
                "gpt-4o-mini",       # Economico e veloce (raccomandato)
                "gpt-4o",            # Più potente
                "gpt-4-turbo",       # Turbo
                "gpt-3.5-turbo",     # Più economico
            ]),
        })

        return self.async_show_form(
            step_id="openai",
            data_schema=data_schema,
            errors=errors,
            description_placeholders={
                "info": "ATTENZIONE: OpenAI richiede credito prepagato. Verifica su platform.openai.com/account/billing"
            }
        )

    async def async_step_github(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Configure GitHub Models."""
        errors = {}

        if user_input is not None:
            api_key = user_input.get("api_key", "").strip()
            
            if not api_key:
                errors["api_key"] = "Token richiesto"
            
            if not errors:
                return self.async_create_entry(
                    title="AI Automation Builder (GitHub)",
                    data={
                        "ai_provider": "github_models",
                        "api_key": api_key,
                        "ai_model": user_input.get("ai_model", "gpt-4o"),
                    },
                )

        data_schema = vol.Schema({
            vol.Required("api_key"): str,
            vol.Optional("ai_model", default="gpt-4o"): vol.In([
                "gpt-4o",
                "gpt-4o-mini",
            ]),
        })

        return self.async_show_form(
            step_id="github",
            data_schema=data_schema,
            errors=errors,
            description_placeholders={
                "info": "Ottieni token su github.com/settings/tokens"
            }
        )
