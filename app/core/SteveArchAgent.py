"""
Núcleo do agente Steve Arch.
O orquestrador central. Gerencia o ciclo de vida da conversa,
comunicação com a Anthropic, streaming e persistência.
Suporte a Tool Use: architecture_validator, stack_selector, scale_projector, financial_projector.
"""

from anthropic import Anthropic
from typing import Optional, Any, Dict
from app.core.config import settings
from app.core.session import Session, Message
from app.memory.history import ConversationHistory
from app.memory.session_store import SessionStore
from app.prompts.builder import get_basic_system_prompt
from app.tools.registry import dispatch, TOOL_SCHEMAS


class SteveArchAgent:

    def __init__(self, session_id: Optional[str] = None, area_context: Optional[Dict[str, Any]] = None):
        # Inicializa o cliente oficial da Anthropic
        self.client = Anthropic(api_key=settings.anthropic_api_key)

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

        # Atribui os schemas das ferramentas ao agente
        self.tools = TOOL_SCHEMAS

        # Lógica de carregamento de sessão: recupera do disco ou cria uma nova
        if session_id and self.store.exists(session_id):
            self.session = self.store.load(session_id)
        else:
            self.session = Session()

        # Inicializa o gerenciador de memória RAM (histórico)
        self.history = ConversationHistory(self.session)

    def chat_stream(self, user_input: str) -> str:
        try:
            # Registra a mensagem do usuário no histórico
            self.history.add_user_message(user_input)

            final_response_text = ""

            # Loop de Tool Use: a API pode solicitar ferramentas múltiplas vezes
            while True:
                with self.client.messages.stream(
                    model=settings.model_name,
                    max_tokens=settings.max_tokens,
                    system=self.system_prompt,
                    messages=self.history.get_messages_for_api(),
                    tools=self.tools,
                ) as stream:
                    response = stream.get_final_message()

                # Processa e exibe blocos de texto em streaming
                current_step_text = ""
                for block in response.content:
                    if block.type == "text":
                        print(block.text, end="", flush=True)
                        current_step_text += block.text

                final_response_text += current_step_text

                # Conversa encerrada — salva e retorna
                if response.stop_reason == "end_turn":
                    self.history.add_assistant_message(final_response_text)
                    self.store.save(self.session)
                    return final_response_text

                # Ferramenta solicitada — executa e continua o loop
                elif response.stop_reason == "tool_use":
                    # Registra a intenção do assistente com o bloco tool_use
                    self.session.messages.append(Message(
                        role="assistant",
                        content=[
                            {"type": block.type, "text": block.text}
                            if block.type == "text"
                            else {
                                "type": block.type,
                                "id": block.id,
                                "name": block.name,
                                "input": block.input
                            }
                            for block in response.content
                        ]
                    ))

                    # Executa cada ferramenta solicitada
                    for block in response.content:
                        if block.type == "tool_use":
                            print(f"\n[Steve Arch: Executando {block.name}...]\n",
                                  end="", flush=True)

                            tool_result = dispatch(block.name, block.input)

                            self.session.messages.append(Message(
                                role="user",
                                content=[{
                                    "type": "tool_result",
                                    "tool_use_id": block.id,
                                    "content": tool_result
                                }]
                            ))

                    # Volta ao início do loop com o resultado da ferramenta no histórico
                    continue

        except Exception as e:
            raise RuntimeError(f"Erro no processamento do Steve Arch: {e}") from e

    def reset(self) -> None:
        """Limpa o histórico e inicia nova sessão."""
        self.session = Session()
        self.history = ConversationHistory(self.session)

    def get_session_id(self) -> str:
        """Retorna o ID da sessão atual."""
        return self.session.id