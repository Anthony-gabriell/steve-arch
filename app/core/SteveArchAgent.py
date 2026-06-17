"""
Núcleo do agente Steve Arch.
O orquestrador central. Gerencia o ciclo de vida da conversa,
comunicação com a Anthropic, streaming e persistência.
Suporte a Tool Use: architecture_validator, stack_selector, scale_projector, financial_projector.
"""

from openai import OpenAI
from typing import Optional, Any, Dict
from app.core.config import settings
from app.core.session import Session
from app.memory.history import ConversationHistory
from app.memory.session_store import SessionStore
from app.prompts.builder import get_basic_system_prompt


class SteveArchAgent:

    def __init__(self, session_id: Optional[str] = None, area_context: Optional[Dict[str, Any]] = None):
        self.client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )

        # Camada de persistência em disco
        self.store = SessionStore()

        # Busca o system prompt (DNA do Steve Arch) via builder
        # Se vier com contexto de área, carrega o prompt especializado
        if area_context:
            from app.prompts.builder import get_area_system_prompt
            self.system_prompt = get_area_system_prompt(
                area=area_context.get("area", "geral"),
                common_tools=area_context.get("common_tools", ""),
                restrictions=area_context.get("restrictions", ""),
            )
        else:
            self.system_prompt = get_basic_system_prompt()

        # Lógica de carregamento de sessão: recupera do disco ou cria uma nova
        if session_id and self.store.exists(session_id):
            self.session = self.store.load(session_id)
        else:
            self.session = Session()

        # Inicializa o gerenciador de memória RAM (histórico)
        self.history = ConversationHistory(self.session)

    def chat_stream(self, user_input: str) -> str:
        try:
            self.history.add_user_message(user_input)

            messages = [{"role": "system", "content": self.system_prompt}]
            messages += self.history.get_messages_for_api()

            response = self.client.chat.completions.create(
                model=settings.model_name,
                max_tokens=settings.max_tokens,
                messages=messages,
            )

            text = response.choices[0].message.content or ""
            print(text, flush=True)

            self.history.add_assistant_message(text)
            self.store.save(self.session)
            return text

        except Exception as e:
            raise RuntimeError(f"Erro no processamento do Steve Arch: {e}") from e

    def reset(self) -> None:
        """Limpa o histórico e inicia nova sessão."""
        self.session = Session()
        self.history = ConversationHistory(self.session)

    def get_session_id(self) -> str:
        """Retorna o ID da sessão atual."""
        return self.session.id