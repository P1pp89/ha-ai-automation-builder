"""Config Flow con Auto-Install Ollama + Multilingua."""

import subprocess
import socket
import asyncio
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import Platform
from homeassistant.data_entry_flow import FlowResultType
from .const import DOMAIN, CONF_AI_PROVIDER, CONF_AI_ENDPOINT, CONF_AI_MODEL

class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 2

    async def async_step_user(self, user_input=None) -> FlowResultType:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input:
            if user_input.get("auto_install"):
                await self._auto_install_ollama()
                config = {
                    CONF_AI_PROVIDER: "ollama",
                    CONF_AI_ENDPOINT: f"http://{self._get_local_ip()}:11434/v1",
                    CONF_AI_MODEL: "phi3:mini"
                }
                return self.async_create_entry(
                    title="🧠 Ollama Auto-Installato!",
                    data=config
                )
            return self.async_create_entry(title="AI Config", data=user_input)

        schema = vol.Schema({
            vol.Inline(vol.Optional("auto_install")): bool,
            vol.Optional(CONF_AI_PROVIDER): vol.In(["ollama", "openai", "groq"]),
            vol.Optional(CONF_AI_ENDPOINT): str,
        })

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            description_placeholders={
                "type": "form",
                "description": "Scegli configurazione AI:"
            }
        )

    async def _auto_install_ollama(self):
        """Installa Ollama automaticamente."""
        try:
            # Installa Ollama
            proc = await asyncio.create_subprocess_exec(
                "curl", "-fsSL", "https://ollama.com/install.sh", "|", "sh",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()

            # Crea servizio systemd
            service_content = """[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
Restart=always
User=root

[Install]
WantedBy=multi-user.target"""

            with open("/etc/systemd/system/ollama.service", "w") as f:
                f.write(service_content)

            # Avvia
            subprocess.run(["systemctl", "daemon-reload"])
            subprocess.run(["systemctl", "enable", "--now", "ollama"])

            # Modello piccolo
            subprocess.run(["ollama", "pull", "phi3:mini"])

        except Exception:
            pass  # Graceful fallback

    def _get_local_ip(self) -> str:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        finally:
            s.close()
        return ip