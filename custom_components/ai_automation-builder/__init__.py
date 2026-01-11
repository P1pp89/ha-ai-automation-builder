"""AI Automation Builder integration."""
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
    
    # Copia il file panel.js nella cartella www
    try:
        panel_js = os.path.join(os.path.dirname(__file__), "panel.js")
        target_js = os.path.join(frontend_path, "panel.js")
        
        # Se il file panel.js esiste nella cartella dell'integrazione, copialo
        if os.path.exists(panel_js):
            import shutil
            shutil.copy2(panel_js, target_js)
            _LOGGER.info("✅ panel.js copiato in www")
    except Exception as e:
        _LOGGER.warning("⚠️ panel.js non trovato, sarà necessario caricarlo manualmente: %s", e)
    
    # Registra il pannello nella sidebar
    try:
        from homeassistant.components import panel_custom
        
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
    except Exception as e:
        _LOGGER.error("❌ Errore registrazione pannello: %s", e)
    
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True