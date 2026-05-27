"""
Histórico de mensagens
Gerencia o histórico de conversas em memória (RAM).
Controla a quantidde de mensagens que ficam ativas, faz compactação
quando necessário e exporta o histórico para formatos úteis.
"""

from typing import List, Dict, Optional
from datetime import datetime
from app.core.session import Session

class ConversationHistory:
    def __init__(self, session: Session):
        self.session = session
        self.max_messages: int = 50  # Limite para evitar estouro de contexto

    def add_user_message(self, content: str) -> None:
        ## Adiciona uma mensagem do usuário e verifica o limite de memória.
        self.session.add_message("user", content)
        self._check_limit()

    def add_assistant_message(self, content: str) -> None:
        # Adiciona uma mensagem do assistente.
        self.session.add_message("assistant", content)

    def get_messages_for_api(self) -> List[Dict[str, str]]:
        # Retorna o histórico formatado para consumo da API (Anthropic/OpenAI).
        return self.session.to_api_format()

    def _check_limit(self) -> None:
        # Verifica se a conversa excedeu o limite máximo de mensagens.
        if self.session.message_count() > self.max_messages:
            self._compact()

    def _compact(self) -> None:
        # Mantém apenas as últimas 20 mensagens da lista
        self.session.messages = self.session.messages[-20:]
        # Atualiza o timestamp de modificação da sessão
        self.session.updated_at = datetime.utcnow().isoformat()
        print(f"[MEMORY] Histórico compactado para as últimas 20 mensagens.")

    def is_empty(self) -> bool:
        # Verifica se a sessão está sem mensagens.
        return self.session.message_count() == 0

    def last_message(self) -> Optional[str]:
        # Retorna o texto da última mensagem enviada ou recebida.
        if self.is_empty():
            return None
        return self.session.messages[-1].content