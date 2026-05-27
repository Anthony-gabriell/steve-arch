"""
Persistência de sessão
Esse arquivo define a existencia de uma sessão de conversa.
Este arquivo não salva nem carrega nada. só define como uma sessão é.
"""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4
from typing import List, Dict, Optional
from typing import Any

# Estrutura de uma mensagem
@dataclass
class Message:
    role: str
    content: Any # Saiu de str para Any para aceitar listas de blocos
    # Usamos uma função anônima (lambda) para gerar a data/hora exata do momento da criação
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

# Estrutura de uma sessão
@dataclass
class Session:
    # Gera um identificador único para cada nova sessão
    id: str = field(default_factory=lambda: str(uuid4()))
    # Cria uma lista vazia isolada para esta sessão específica
    messages: List[Message] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    # Cria um dicionário vazio isolado para metadados
    metadata: Dict[str, str] = field(default_factory=dict)

    # Métodos da Session
    def add_message(self, role: str, content: str) -> None:
        # Cria uma Message e adiciona em self.messages, atualizando o updated_at.
        nova_mensagem = Message(role=role, content=content)
        self.messages.append(nova_mensagem)
        self.updated_at = datetime.utcnow().isoformat()

    def to_api_format(self) -> List[Dict[str, str]]:
        # Converte as mensagens para o formato que as APIs de LLM (como Anthropic/OpenAI) esperam.
        return [{"role": msg.role, "content": msg.content} for msg in self.messages]

    def clear(self) -> None:
        # Limpa todas as mensagens da sessão.
        self.messages.clear()
        self.updated_at = datetime.utcnow().isoformat()

    def message_count(self) -> int:
        # Retorna quantas mensagens a sessão tem.
        return len(self.messages)


# Exemplo de uso
if __name__ == "__main__":
    # Criando uma nova sessão
    session = Session()
    print(f"Sessão criada com ID: {session.id}")

    # Adicionando mensagens
    session.add_message("user", "O que é entropia?")
    session.add_message("assistant", "Entropia é uma medida de desordem...")

    # Contando mensagens
    print(f"Total de mensagens: {session.message_count()}")  # Saída: 2

    # Formato para API
    print("Formato da API:")
    print(session.to_api_format())
    # Saída: [{'role': 'user', 'content': 'O que é entropia?'}, {'role': 'assistant', 'content': 'Entropia é uma medida de desordem...'}]

