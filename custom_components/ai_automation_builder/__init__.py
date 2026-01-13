"""AI Automation Builder integration - VERSIONE CORRETTA FINALE."""

from __future__ import annotations

import logging
import os

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the AI Automation Builder component."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up AI Automation Builder from a config entry."""

    # Salva config
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data
    _LOGGER.info("✅ Config salvata: %s", entry.data.get("ai_provider"))

    # Importa e registra WebSocket
    try:
        from .websocket_api import async_setup_ws

        await async_setup_ws(hass)
        _LOGGER.info("✅ WebSocket registrato")
    except Exception as e:
        _LOGGER.error("❌ Errore setup websocket: %s", e)
        return False

    # Crea cartella per i file frontend
    frontend_path = hass.config.path("www/community/ai_automation_builder")

    if not os.path.exists(frontend_path):
        try:
            os.makedirs(frontend_path, exist_ok=True)
            _LOGGER.info("✅ Cartella frontend creata: %s", frontend_path)
        except Exception as e:
            _LOGGER.error("❌ Errore creazione cartella: %s", e)

    # Copia i file frontend da custom_components/ai_automation_builder/frontend/
    try:
        frontend_source = os.path.join(os.path.dirname(__file__), "frontend")

        if os.path.exists(frontend_source):
            import shutil

            for file in ["panel.js", "frontend.js", "style.css", "index.html"]:
                source_file = os.path.join(frontend_source, file)
                target_file = os.path.join(frontend_path, file)

                if os.path.exists(source_file):
                    shutil.copy2(source_file, target_file)
                    _LOGGER.info("✅ %s copiato in www", file)
                else:
                    _LOGGER.warning("⚠️ %s non trovato in frontend/", file)
        else:
            _LOGGER.warning("⚠️ Cartella frontend/ non trovata in %s", frontend_source)

    except Exception as e:
        _LOGGER.warning("⚠️ Errore copia file frontend: %s", e)

    # Registra il pannello nella sidebar
    try:
        from homeassistant.components import panel_custom

        # Pulisci pannelli esistenti per evitare conflitti
        existing_panels = hass.data.get("frontend_panels", {})
        if "ai-automation-builder" in existing_panels:
            _LOGGER.info("⚠️ Pannello già registrato, aggiornamento...")

        await panel_custom.async_register_panel(
            hass,
            webcomponent_name="ai-automation-builder-panel",
            frontend_url_path="ai-automation-builder",
            sidebar_title="AI Automation",
            sidebar_icon="mdi:robot-outline",
            module_url="/local/community/ai_automation_builder/panel.js",
            require_admin=True,
        )

        _LOGGER.info("✅ Pannello registrato nella sidebar")
    except ValueError as e:
        if "Overwriting panel" in str(e):
            _LOGGER.info("ℹ️ Pannello già registrato, nessun problema: %s", e)
        else:
            _LOGGER.error("❌ Errore registrazione pannello: %s", e)
    except Exception as e:
        _LOGGER.error("❌ Errore registrazione pannello: %s", e)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
