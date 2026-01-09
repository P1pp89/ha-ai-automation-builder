"""AI Automation Builder integration."""
from __future__ import annotations

import logging
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.const import Platform

from .const import DOMAIN
from .websocket_api import async_setup_ws

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = []


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up from config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    # Register WebSocket API
    await async_setup_ws(hass)

    # Register custom panel
    hass.components.frontend.async_register_built_in_path(
        "ai_automation_builder",
        hass.config.path("custom_components/ai_automation_builder/www"),
    )

    # Add the panel
    hass.components.frontend.async_create_frontend_extra(
        DOMAIN,
        {
            "js_url": "/local/ai-automation-builder/panel.js",
            "icon": "mdi:brain",
            "title": "AI Automation Builder",
        },
    )

    _LOGGER.info("AI Automation Builder integration set up")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if DOMAIN in hass.data:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
