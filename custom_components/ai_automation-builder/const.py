"""Costanti per l'integrazione Home Assistant AI Automation Builder."""

from __future__ import annotations

from logging import Logger, getLogger

DOMAIN: str = "ai_automation_builder"

LOGGER: Logger = getLogger(__package__)

# Chiavi di configurazione
CONF_AI_PROVIDER: str = "ai_provider"
CONF_AI_ENDPOINT: str = "ai_endpoint"
CONF_AI_API_KEY: str = "ai_api_key"
CONF_AI_MODEL: str = "ai_model"
CONF_LANGUAGE: str = "language"  # "it" / "en"

# Provider supportati
AI_PROVIDER_OLLAMA: str = "ollama"
AI_PROVIDER_OPENAI: str = "openai"
AI_PROVIDER_GROQ: str = "groq"

AI_PROVIDERS: dict[str, str] = {
    AI_PROVIDER_OLLAMA: "Ollama (locale gratuito)",
    AI_PROVIDER_OPENAI: "OpenAI",
    AI_PROVIDER_GROQ: "Groq",
}

# Comandi WebSocket
WS_TYPE_BUILD_AUTOMATION: str = "ai_automation_builder/build_automation"
WS_TYPE_GET_ENTITIES: str = "ai_automation_builder/get_entities"
WS_TYPE_VALIDATE_YAML: str = "ai_automation_builder/validate_yaml"
WS_TYPE_SAVE_AUTOMATION: str = "ai_automation_builder/save_automation"

# Servizi
SERVICE_INSTALL_OLLAMA: str = "install_ollama"
SERVICE_RESTART_AI: str = "restart_ai"

# Default
DEFAULT_MODEL_OLLAMA: str = "phi3:mini"
DEFAULT_MODEL_OLLAMA_ALT: str = "llama3.1"
DEFAULT_LANGUAGE: str = "it"
