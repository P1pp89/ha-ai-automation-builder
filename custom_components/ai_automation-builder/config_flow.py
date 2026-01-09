"""Config Flow."""

from __future__ import annotations

import socket
import voluptuous as vol
from typing import Any
from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntry
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

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Utente."""
        errors = {}

        if user_input is not None:
            # Auto Ollama
            if user_input.get("auto_install"):
                endpoint = f"http://{self._get_local_ip()}:11434/v1"
                data = {
                    CONF_AI_PROVIDER: "ollama",
                    CONF_AI_ENDPOINT: endpoint,
                    CONF_AI_MODEL: "phi3:mini",
                }
                return self.async_create_entry(title="🧠 Ollama", data=data)

            # ✅ FIX: Lookup corretto
            providers_dict = dict(AI_PROVIDERS)
            provider_name = providers_dict.get(user_input[CONF_AI_PROVIDER], "AI")
            title = f"{provider_name}"
            
            return self.async_create_entry(title=title, data=user_input)

        data_schema = vol.Schema(
            {
                vol.Optional("auto_install"): bool,
                vol.Required(CONF_AI_PROVIDER): selector.SelectSelector(
                    selector.SelectOptionDict(options=AI_PROVIDERS)
                ),
                vol.Required(CONF_AI_ENDPOINT): str,
                vol.Optional(CONF_AI_API_KEY, default=""): str,
                vol.Optional(CONF_AI_MODEL, default="phi3:mini"): str,
            }
        )

        return self.async_show_form(
            step_id="user", data_schema=data_schema, errors=errors
        )

    def _get_local_ip(self) -> str:
        """IP."""
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = "127.0.0.1"
        finally:
            s.close()
        return ip
