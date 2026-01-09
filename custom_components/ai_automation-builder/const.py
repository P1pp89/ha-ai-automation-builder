"""Costanti AI Automation Builder."""

DOMAIN = "ai_automation_builder"

CONF_AI_PROVIDER = "ai_provider"
CONF_AI_ENDPOINT = "ai_endpoint"
CONF_AI_API_KEY = "api_key"
CONF_AI_MODEL = "ai_model"

AI_PROVIDERS = [
    ("ollama", "Ollama (locale gratuito)"),
    ("openai", "OpenAI"),
    ("groq", "Groq"),
]

WS_TYPE_BUILD_AUTOMATION = "ai_automation_builder/build_automation"
WS_TYPE_GET_ENTITIES = "ai_automation_builder/get_entities"
WS_TYPE_VALIDATE_YAML = "ai_automation_builder/validate_yaml"
