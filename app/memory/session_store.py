"""
Armazenar/carregar sessões
Salva e carrega sessões em arquivos JSON no disco.
É a camada de persistencia.
"""

import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from app.core.session import Session, Message
from app.core.config import settings


class SessionStore:
    def __init__(self):
        # Define o caminho pegando das configurações e garantindo que é um objeto Path
        self.sessions_dir = Path(settings.session_dir)

        # Cria a pasta (e pastas pai se necessário) se ela não existir
        self.sessions_dir.mkdir(parents=True, exist_ok=True)

    def save(self, session: Session) -> None:
        # Salva uma sessão em disco como JSON.
        filepath = self.sessions_dir / f"{session.id}.json"

        # Converte o objeto Session para um dicionário Python
        data = self._session_to_dict(session)

        # Escreve no disco com formatação legível (indent=2)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def load(self, session_id: str) -> Optional[Session]:
        # Carrega uma sessão do disco. Retorna None se não encontrar o arquivo.
        filepath = self.sessions_dir / f"{session_id}.json"

        if not filepath.exists():
            return None

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Reconstrói o objeto Session a partir dos dados brutos
        return self._session_from_dict(data)

    def list_sessions(self) -> List[str]:
        # f.stem pega o nome do arquivo sem a extensão .json
        return [f.stem for f in self.sessions_dir.glob("*.json")]

    def delete(self, session_id: str) -> bool:
        # Deleta uma sessão do disco. Retorna True se teve sucesso.
        filepath = self.sessions_dir / f"{session_id}.json"
        if filepath.exists():
            filepath.unlink()
            return True
        return False

    def exists(self, session_id: str) -> bool:
        # Verifica se o arquivo da sessão existe.
        return (self.sessions_dir / f"{session_id}.json").exists()

    def _session_to_dict(self, session: Session) -> dict:
        # Converte o objeto Session para um dicionário serializável.
        return {
            "id": session.id,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "metadata": session.metadata,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp
                }
                for msg in session.messages
            ]
        }

    def _session_from_dict(self, data: dict) -> Session:
        # Cria instância nova (gera novos IDs/datas por padrão)
        session = Session()

        # Sobrescreve com os dados carregados do arquivo
        session.id = data["id"]
        session.created_at = data["created_at"]
        session.updated_at = data["updated_at"]
        session.metadata = data["metadata"]

        # Reconstrói a lista de objetos Message
        session.messages = [
            Message(
                role=m["role"],
                content=m["content"],
                timestamp=m["timestamp"]
            )
            for m in data["messages"]
        ]

        return session