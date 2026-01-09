"""Config Flow AI Automation Builder."""

from __future__ import annotations

import voluptuous as vol
import socket
from typing import Any
from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector
from .const import (
    DOMAIN,
    CONF_AI_PROVIDER,
    CONF_AI_ENDPOINT,
    CONF_AI_MODEL,
    CONF_AI_API_KEY,
    AI_PROVIDERS,
)

class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config Flow."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry):
        """Options flow."""
        return OptionsFlowHandler(config_entry)

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        """Step user."""
        errors = {}

        if user_input is not None:
            if user_input.get("auto_install"):
                # Auto ollama
                endpoint = f"http://{self._get_local_ip()}:11434/v1"
                data = {
                    CONF_AI_PROVIDER: "ollama",
                    CONF_AI_ENDPOINT: endpoint,
                    CONF_AI_MODEL: "phi3:mini",
                }
                return self.async_create_entry(title="🧠 Ollama Auto", data=data)

            return self.async_create_entry(
                title=AI_PROVIDERS[user_input[CONF_AI_PROVIDER]],
                data=user_input,
            )

        data_schema = vol.Schema(
            {
                vol.Optional("auto_install"): bool,
                vol.Required(CONF_AI_PROVIDER): selector.SelectSelector(
                    selector.SelectOptionDict(options=list(AI_PROVIDERS.items()))
                ),
                vol.Required(CONF_AI_ENDPOINT): str,
                vol.Optional(CONF_AI_API_KEY): str,
                vol.Optional(CONF_AI_MODEL, default="phi3:mini"): str,
            }
        )

        return self.async_show_form(
            step_id="user", data_schema=data_schema, errors=errors
        )

    def _get_local_ip(self) -> str:
        """Get local IP."""
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = "127.0.0.1"
        finally:
            s.close()
        return ip


class OptionsFlowHandler(config_entries.OptionsFlow):
    """Options handler."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Options step."""
        if user_input is not None:
            return self.async_create_entry(title="AI Options", data=user_input)

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_AI_ENDPOINT, default=self.config_entry.options.get(CONF_AI_ENDPOINT)
                ): str,
                vol.Optional(CONF_AI_MODEL, default="phi3:mini"): str,
            }
        )

        return self.async_show_form(
            step_id="init", data_schema=schema, description_placeholders={}
        )
