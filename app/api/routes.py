"""
Endpoint principal: recebe respostas do onboarding e retorna diagnóstico estruturado.
"""

import json
import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from anthropic import Anthropic
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
client = Anthropic(api_key=settings.anthropic_api_key)

# chave real IP do user no proxy para evitar compartilhamento, definido 1/dia
def get_real_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

# Rate limiter: 1 diagnosticos por IP por dia
limiter = Limiter(key_func=get_real_ip)


# aqui temos tds os schemas

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
    nomeSolucao: Optional[str] = None  # solution name from onboarding step 0
    ja_cobra: Optional[bool] = None
    ticket_atual: Optional[float] = None  # current price in BRL
    usuarios_pagantes: Optional[int] = None


class DiagnosticoResponse(BaseModel):
    resumo_executivo: str
    score_escalabilidade: int
    score_label: str
    score_narrativa: str
    problema_detalhado: str
    solucao_detalhada: str
    gargalos: list
    stack_recomendada: list
    roadmap: list
    projecao_financeira: dict
    proximo_passo: str
    proximos_passos_fila: list
    riscos_fundamentais: list
    solucoes_similares: Optional[list] = None


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

    monetizacao_info = ""
    if data.ja_cobra:
        monetizacao_info = f"""
**Already charging:** Yes
**Current ticket:** R$ {data.ticket_atual or 'not specified'}/user
**Paying users:** {data.usuarios_pagantes or 'not specified'}"""
    else:
        monetizacao_info = "**Already charging:** No"

    monetizacao_instrucao = ""
    if data.ja_cobra:
        monetizacao_instrucao = (
            "\n8. Use the declared ticket and paying users as anchors for the "
            "financial projection instead of generic assumptions."
        )

    return f"""You are Steve Arch, an expert solution architect specialized in scalable systems for non-technical founders and vibe coders.

A user has completed the onboarding process. Here is their complete context:

**Area:** {area}
**Problem they want to solve:** {problema}
**Solution they thought of:** {solucao}
**Tools they know:** {ferramentas}
**Monthly investment available:** {investimento}
**Current users:** {usuarios}
**Weekly dedication:** {dedicacao}
{monetizacao_info}

Your task is to generate a complete architectural diagnosis of this solution.

CRITICAL INSTRUCTIONS:
1. Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation outside the JSON.
2. Be specific and technical, not generic. Base everything on the user's actual context.
3. Never use em dashes in any text. Use periods or commas instead.
4. Write all text fields in Brazilian Portuguese.
5. The score_escalabilidade must be an honest assessment (0-100) based on current tools and architecture.
6. NEVER use technical jargon without explaining it in plain terms. Apply these replacements throughout all text fields:
7. For problema_detalhado and solucao_detalhada, write technically dense prose. Minimum 400 characters each, maximum 900 characters each. Use paragraph breaks (\n\n) between paragraphs. No bullet lists, no markdown, just plain text with paragraph breaks.
   - OCR é "leitura automática de documentos"
   - billing é "cobrança automática"
   - multi-tenant é "separação de dados por cliente"
   - deploy é "publicar no ar"
   - API é "conexão entre sistemas"
   - backend é "servidor"
   - frontend é "tela do usuário"
   - cache é "dados salvos temporariamente"
   - rate limit é "limite de uso simultâneo"
   - pipeline é "fluxo automatizado"
   - Always write as if explaining to someone who has never programmed. Be technical in depth but simple in language.
7. Map score_escalabilidade to one of exactly these labels in score_label: 'Precisa de base sólida' (0-30), 'Boa base, ajustes críticos' (31-60), 'Pronto para crescer' (61-80), 'Arquitetura sólida' (81-100).{monetizacao_instrucao}

Return this exact JSON structure:

{{
  "resumo_executivo": "2-3 sentences summarizing the solution, its main strength, and the critical challenge to overcome",
  "score_escalabilidade": <integer 0-100>,
  "score_label": "one of exactly: 'Precisa de base sólida' | 'Boa base, ajustes críticos' | 'Pronto para crescer' | 'Arquitetura sólida', mapped from the score ranges above. No number shown to user.",
  "score_narrativa": "one contextual sentence, max 140 chars, explaining why the solution got this label. Example: 'Resolve dor real mas precisa de fundação técnica antes de pensar em escala.'",
  "problema_detalhado": "2-3 paragraphs analyzing the problem in depth. Why it is a real and recurring pain, in what context it manifests most strongly, who suffers most from it, and what makes it technically complex to solve. Write as an architect explaining the problem to a non-technical founder. Be specific to the user's area and described pain. Each paragraph separated by \\n\\n. No bullet lists, only flowing prose.",
  "solucao_detalhada": "2-3 paragraphs evaluating the proposed solution. Whether the approach makes technical sense, what its strengths are given the user's tools and budget, where it will likely succeed early, and what specific architectural decisions need attention. Write as an architect doing a peer review. Be specific, no generic startup advice. Each paragraph separated by \\n\\n. No bullet lists, only flowing prose.",
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
  "riscos_fundamentais": [
    {{
      "titulo": "risk title",
      "descricao": "what can go wrong even if execution is good",
      "mitigacao": "one concrete action to reduce this risk",
      "severidade": "alta" | "media" | "baixa"
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
  "proximo_passo": "one single specific action the user must take right now. Not a list. One thing.",
  "proximos_passos_fila": [
    {{
      "ordem": 1,
      "titulo": "step title",
      "descricao": "what to do",
      "criterio_conclusao": "how the user knows this step is done"
    }}
  ]
}}

ADDITIONAL FIELD GUIDANCE:
- riscos_fundamentais: surface 2 to 4 fundamental risks that could kill the solution even if built well. Be honest, not motivational. Examples: weak retention in free apps, market saturation, regulatory risk, dependency on single channel.
- proximos_passos_fila: generate 4 to 6 sequential next steps. Each step unlocks the next. The first step must match proximo_passo in substance. Each step has a clear completion criterion."""


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@router.post("/diagnostico", response_class=JSONResponse)
@limiter.limit("3/day")
async def gerar_diagnostico(request: Request, data: OnboardingData):
    """
    Recebe as respostas do onboarding e retorna o diagnóstico completo do Steve Arch.
    Rate limit: 1 diagnósticos por IP por dia.
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

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        diagnostico = json.loads(raw_text)

        required_fields = [
            "resumo_executivo", "score_escalabilidade", "score_label",
            "score_narrativa", "problema_detalhado", "solucao_detalhada",
            "gargalos", "stack_recomendada", "roadmap",
            "projecao_financeira", "proximo_passo", "proximos_passos_fila",
            "riscos_fundamentais"
        ]
        for field in required_fields:
            if field not in diagnostico:
                raise ValueError(f"Campo ausente no diagnóstico: {field}")

        diagnostico["score_escalabilidade"] = max(0, min(100, int(diagnostico["score_escalabilidade"])))

        valid_labels = [
            "Precisa de base sólida",
            "Boa base, ajustes críticos",
            "Pronto para crescer",
            "Arquitetura sólida"
        ]
        if diagnostico.get("score_label") not in valid_labels:
            s = diagnostico["score_escalabilidade"]
            if s <= 30: diagnostico["score_label"] = valid_labels[0]
            elif s <= 60: diagnostico["score_label"] = valid_labels[1]
            elif s <= 80: diagnostico["score_label"] = valid_labels[2]
            else: diagnostico["score_label"] = valid_labels[3]

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
    return {"status": "ok", "service": "Steve Arch API"}


@router.get("/areas")
async def listar_areas():
    return {"areas": list(AREA_MAP.values())}