"""Home Assistant AI Automation Builder."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .websocket_api import async_setup_ws

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Imposta l'integrazione."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    await async_setup_ws(hass)

    _LOGGER.info("AI Automation Builder pronto!")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Rimuovi integrazione."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
