"""
Routes do Steve Arch — FastAPI
Endpoint principal: recebe respostas do onboarding e retorna diagnóstico estruturado.
"""

import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from anthropic import Anthropic

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
client = Anthropic(api_key=settings.anthropic_api_key)

# ─── SCHEMAS ──────────────────────────────────────────────────────────────────

class OnboardingData(BaseModel):
    step1: Optional[str] = None   # área
    step2: Optional[str] = None   # problema
    step3: Optional[str] = None   # solução pensada
    step4: Optional[str] = None   # ferramentas (comma-separated)
    step5: Optional[str] = None   # investimento
    step6: Optional[str] = None   # usuários
    step7: Optional[str] = None   # dedicação
    toolOther: Optional[str] = None  # ferramenta customizada
    tools: Optional[list] = None  # lista de ferramentas selecionadas


class DiagnosticoResponse(BaseModel):
    resumo_executivo: str
    score_escalabilidade: int
    gargalos: list
    stack_recomendada: list
    solucoes_similares: list
    roadmap: list
    projecao_financeira: dict
    proximo_passo: str


# ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

AREA_MAP = {
    "marketing": "Marketing Digital",
    "financas": "Finanças e Fintech",
    "medicina": "Medicina e Saúde",
    "direito": "Direito e Legaltech",
    "logistica": "Logística",
    "rh": "Recursos Humanos",
    "administrativa": "Administrativa"
}

INVESTMENT_MAP = {
    "zero": "R$ 0 (somente ferramentas gratuitas)",
    "ate100": "Até R$ 100/mês",
    "100a500": "R$ 100 a R$ 500/mês",
    "500mais": "R$ 500+/mês",
    "depois": "A definir após faturamento"
}

USERS_MAP = {
    "zero": "Ainda não lançou",
    "1_50": "1 a 50 usuários",
    "50_500": "50 a 500 usuários",
    "500_5000": "500 a 5.000 usuários",
    "5000mais": "5.000+ usuários"
}

DEDICATION_MAP = {
    "menos5h": "Menos de 5h por semana",
    "5_20h": "5 a 20h por semana",
    "20_40h": "20 a 40h por semana",
    "fulltime": "Tempo integral"
}


def build_diagnostic_prompt(data: OnboardingData) -> str:
    area = AREA_MAP.get(data.step1, data.step1 or "não informada")
    problema = data.step2 or "não descrito"
    solucao = data.step3 or "não descrita"
    ferramentas = ", ".join(data.tools) if data.tools and data.tools != ["nenhuma"] else "nenhuma conhecida"
    if data.toolOther:
        ferramentas += f", {data.toolOther}"
    investimento = INVESTMENT_MAP.get(data.step5, data.step5 or "não informado")
    usuarios = USERS_MAP.get(data.step6, data.step6 or "não informado")
    dedicacao = DEDICATION_MAP.get(data.step7, data.step7 or "não informada")

    return f"""You are Steve Arch, an expert solution architect specialized in scalable systems for non-technical founders and vibe coders.

A user has completed the onboarding process. Here is their complete context:

**Area:** {area}
**Problem they want to solve:** {problema}
**Solution they thought of:** {solucao}
**Tools they know:** {ferramentas}
**Monthly investment available:** {investimento}
**Current users:** {usuarios}
**Weekly dedication:** {dedicacao}

Your task is to generate a complete architectural diagnosis of this solution.

CRITICAL INSTRUCTIONS:
1. Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation outside the JSON.
2. Be specific and technical — not generic. Base everything on the user's actual context.
3. Never use em dashes (—) in any text. Use periods or commas instead.
4. Write all text fields in Brazilian Portuguese.
5. The score_escalabilidade must be an honest assessment (0-100) based on current tools and architecture.
6. NEVER use technical jargon without explaining it in plain terms. Apply these replacements throughout all text fields:
   - OCR → "leitura automática de documentos"
   - billing → "cobrança automática"
   - multi-tenant → "separação de dados por cliente"
   - deploy → "publicar no ar"
   - API → "conexão entre sistemas"
   - backend → "servidor"
   - frontend → "tela do usuário"
   - cache → "dados salvos temporariamente"
   - rate limit → "limite de uso simultâneo"
   - pipeline → "fluxo automatizado"
   - Always write as if explaining to someone who has never programmed. Be technical in depth but simple in language.

Return this exact JSON structure:

{{
  "resumo_executivo": "2-3 sentences summarizing the solution, its main strength, and the critical challenge to overcome",
  "score_escalabilidade": <integer 0-100>,
  "gargalos": [
    {{
      "titulo": "short gargalo title",
      "descricao": "specific explanation of why this will break at scale",
      "severidade": "alta" | "media" | "baixa",
      "quando_aparece": "at what user volume this becomes critical"
    }}
  ],
  "stack_recomendada": [
    {{
      "componente": "what this component does (ex: banco de dados, autenticacao)",
      "ferramenta": "recommended tool name",
      "justificativa": "why this tool for this specific context",
      "custo_estimado": "estimated monthly cost in BRL",
      "familiar": true | false
    }}
  ],
  "solucoes_similares": [
    {{
      "descricao": "brief description of a similar solution pattern (no specific company names)",
      "gargalo_que_enfrentou": "what scalability problem this type of solution typically faces",
      "como_resolveu": "how this type of solution typically solved it"
    }}
  ],
  "roadmap": [
    {{
      "fase": "Fase 1",
      "titulo": "phase title",
      "duracao": "estimated duration",
      "objetivos": ["objective 1", "objective 2"],
      "entregavel": "what is delivered at end of this phase"
    }}
  ],
  "projecao_financeira": {{
    "cenario_conservador": {{
      "usuarios": <integer>,
      "receita_mensal": <integer in BRL>,
      "custo_infra": <integer in BRL>,
      "margem": <integer percentage>
    }},
    "cenario_realista": {{
      "usuarios": <integer>,
      "receita_mensal": <integer in BRL>,
      "custo_infra": <integer in BRL>,
      "margem": <integer percentage>
    }},
    "cenario_otimista": {{
      "usuarios": <integer>,
      "receita_mensal": <integer in BRL>,
      "custo_infra": <integer in BRL>,
      "margem": <integer percentage>
    }},
    "modelo_sugerido": "suggested monetization model for this solution",
    "ticket_medio_sugerido": <integer in BRL>
  }},
  "proximo_passo": "one single specific action the user must take right now. Not a list. One thing."
}}"""


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@router.post("/diagnostico", response_class=JSONResponse)
async def gerar_diagnostico(data: OnboardingData):
    """
    Recebe as respostas do onboarding e retorna o diagnóstico completo do Steve Arch.
    Chama a Anthropic API com extended thinking para análise profunda.
    """
    try:
        prompt = build_diagnostic_prompt(data)

        response = client.messages.create(
            model=settings.model_name,
            max_tokens=4000,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        raw_text = response.content[0].text.strip()

        # Remove markdown fences se existirem
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        diagnostico = json.loads(raw_text)

        # Valida campos obrigatórios
        required_fields = [
            "resumo_executivo", "score_escalabilidade", "gargalos",
            "stack_recomendada", "solucoes_similares", "roadmap",
            "projecao_financeira", "proximo_passo"
        ]
        for field in required_fields:
            if field not in diagnostico:
                raise ValueError(f"Campo ausente no diagnóstico: {field}")

        # Garante que o score é inteiro entre 0 e 100
        diagnostico["score_escalabilidade"] = max(0, min(100, int(diagnostico["score_escalabilidade"])))

        return JSONResponse(content=diagnostico)

    except json.JSONDecodeError as e:
        logger.error(f"Erro ao parsear JSON do diagnóstico: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar diagnóstico. Tente novamente."
        )
    except ValueError as e:
        logger.error(f"Diagnóstico incompleto: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erro inesperado no diagnóstico: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno. Tente novamente em alguns instantes."
        )


@router.get("/health")
async def health_check():
    """Verifica se o backend está funcionando."""
    return {"status": "ok", "service": "Steve Arch API"}


@router.get("/areas")
async def listar_areas():
    """Retorna as áreas disponíveis para o onboarding."""
    return {"areas": list(AREA_MAP.values())}