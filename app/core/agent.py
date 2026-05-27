"""
Núcleo do agente, aqui fica toda a lógica de conversa.
O orquestrador central. Gerencia o ciclo de vida da conversa,
comunicação com a Anthropic, streaming e persistência.
Agora com suporte a Tool Use (SymPy).
"""

from anthropic import Anthropic
from typing import Optional, Any, Dict
from app.core.config import settings
from app.core.session import Session, Message
from app.memory.history import ConversationHistory
from app.memory.session_store import SessionStore
from app.prompts.builder import get_basic_system_prompt
from app.tools.registry import dispatch, TOOL_SCHEMAS


class AlbertAgent:

    def __init__(self, session_id: Optional[str] = None):
        # Inicializa o cliente oficial da Anthropic
        self.client = Anthropic(api_key=settings.anthropic_api_key)

        # Camada de persistência em disco
        self.store = SessionStore()

        # Busca o system prompt (DNA do Albert) via builder
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
            # Registra a fala do usuário
            self.history.add_user_message(user_input)

            final_response_text = ""

            # Loop de Tool Use: A API pode pedir para usar ferramentas várias vezes
            while True:
                with self.client.messages.stream(
                    model=settings.model_name,
                    max_tokens=settings.max_tokens,
                    system=self.system_prompt,
                    messages=self.history.get_messages_for_api(),
                    tools=self.tools,
                ) as stream:
                    response = stream.get_final_message()

                # Processa e exibe blocos de texto
                current_step_text = ""
                for block in response.content:
                    if block.type == "text":
                        print(block.text, end="", flush=True)
                        current_step_text += block.text

                final_response_text += current_step_text

                # Verifica se a conversa encerrou ou se precisa de ferramenta
                if response.stop_reason == "end_turn":
                    self.history.add_assistant_message(final_response_text)
                    self.store.save(self.session)
                    return final_response_text

                elif response.stop_reason == "tool_use":
                    # Adiciona a intenção do assistente (inclui o tool_use block)
                    self.session.messages.append(Message(
                        role="assistant",
                        content=[
                            {"type": block.type, "text": block.text}
                            if block.type == "text"
                            else {"type": block.type, "id": block.id, "name": block.name, "input": block.input}
                            for block in response.content
                        ]
                    ))

                    # Executa cada ferramenta solicitada
                    for block in response.content:
                        if block.type == "tool_use":
                            print(f"\n[SISTEMA: Executando {block.name}...]\n",
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

                    # Loop continua: volta ao while True com resultado no histórico
                    continue

        except Exception as e:
            raise RuntimeError(f"Erro no processamento do Agente: {e}") from e

    def reset(self) -> None:
        self.session = Session()
        self.history = ConversationHistory(self.session)

    def get_session_id(self) -> str:
        return self.session.id