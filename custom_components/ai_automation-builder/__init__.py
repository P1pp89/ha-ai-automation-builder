"""AI Automation Builder integration - VERSIONE CORRETTA FINALE."""

from __future__ import annotations

import json
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

    # Leggi la versione dal manifest.json (async)
    manifest_path = os.path.join(os.path.dirname(__file__), "manifest.json")
    component_version = "2.0.0"  # Fallback
    try:
        def read_manifest():
            with open(manifest_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        manifest = await hass.async_add_executor_job(read_manifest)
        component_version = manifest.get("version", "2.0.0")
        _LOGGER.info("✅ Versione componente: %s", component_version)
    except Exception as e:
        _LOGGER.warning("⚠️ Errore lettura versione dal manifest: %s", e)

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

    # Crea cartella per i file frontend (async)
    frontend_path = hass.config.path("www/community/ai_automation_builder")

    def create_frontend_dir():
        if not os.path.exists(frontend_path):
            os.makedirs(frontend_path, exist_ok=True)
            return True
        return False

    try:
        created = await hass.async_add_executor_job(create_frontend_dir)
        if created:
            _LOGGER.info("✅ Cartella frontend creata: %s", frontend_path)
    except Exception as e:
        _LOGGER.error("❌ Errore creazione cartella: %s", e)

    # Copia i file frontend da custom_components/ai_automation_builder/frontend/ (async)
    def copy_frontend_files():
        """Copia i file frontend in modo sincrono (eseguito in executor)."""
        import hashlib
        
        frontend_source = os.path.join(os.path.dirname(__file__), "frontend")

        if not os.path.exists(frontend_source):
            _LOGGER.warning("⚠️ Cartella frontend/ non trovata in %s", frontend_source)
            return

        # Genera un hash basato sulla versione per cache busting più efficace
        version_hash = hashlib.md5(component_version.encode()).hexdigest()[:8]

        for file in ["panel.js", "frontend.js", "style.css", "index.html"]:
            source_file = os.path.join(frontend_source, file)
            target_file = os.path.join(frontend_path, file)

            if not os.path.exists(source_file):
                _LOGGER.warning("⚠️ %s non trovato in frontend/", file)
                continue

            # Leggi il contenuto del file
            with open(source_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if file.endswith('.js'):
                # Sostituisci la versione hardcoded con quella dinamica
                content = content.replace("this.componentVersion = '2.0.0';", f"this.componentVersion = '{component_version}';")
                
                # Aggiungi cache busting agli import CSS se presenti
                content = content.replace(
                    'href="/local/community/ai_automation_builder/style.css"',
                    f'href="/local/community/ai_automation_builder/style.css?v={component_version}&h={version_hash}"'
                )
            
            elif file.endswith('.html'):
                # Aggiungi cache busting ai link CSS e JS nell'HTML
                content = content.replace(
                    'href="style.css"',
                    f'href="style.css?v={component_version}&h={version_hash}"'
                )
                content = content.replace(
                    'src="panel.js"',
                    f'src="panel.js?v={component_version}&h={version_hash}"'
                )
                content = content.replace(
                    'src="frontend.js"',
                    f'src="frontend.js?v={component_version}&h={version_hash}"'
                )
            
            # Scrivi il file modificato
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(content)
            _LOGGER.info("✅ %s copiato e aggiornato con versione %s (hash: %s)", file, component_version, version_hash)

    try:
        await hass.async_add_executor_job(copy_frontend_files)
    except Exception as e:
        _LOGGER.warning("⚠️ Errore copia file frontend: %s", e)

    # Registra il pannello nella sidebar
    try:
        from homeassistant.components import panel_custom

        # Pulisci pannelli esistenti per evitare conflitti
        existing_panels = hass.data.get("frontend_panels", {})
        if "ai-automation-builder" in existing_panels:
            _LOGGER.info("⚠️ Pannello già registrato, aggiornamento...")

        # Genera hash per cache busting più efficace
        import hashlib
        version_hash = hashlib.md5(component_version.encode()).hexdigest()[:8]

        await panel_custom.async_register_panel(
            hass,
            webcomponent_name="ai-automation-builder-panel",
            frontend_url_path="ai-automation-builder",
            sidebar_title="AI Automation",
            sidebar_icon="mdi:brain",
            module_url=f"/local/community/ai_automation_builder/panel.js?v={component_version}&h={version_hash}",
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
