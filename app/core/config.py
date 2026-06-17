from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Cada atributo é uma variável que será lida do .env
    openrouter_api_key: str | None = None # deixando opcional
    model_name: str = "nousresearch/hermes-3-llama-3.1-405b:free"
    llm_provider: str = "openrouter"
    max_tokens: int = 4096
    temperature: float = 0.7

    # paths
    session_dir: str = "./data/sessions"
    vector_store_path: str = "./data/vectorstore"

    # logs
    log_level: str = "INFO"

    class Config:
        env_file = ".env"  # de onde ler os valores
        case_sensitive = False # podemos usar maiuscula ou minuscula

settings = Settings() # Aqui temos uma instância única que todo o resto do projeto usa