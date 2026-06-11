"""
Função que constrói o system prompt final combinando base + fragmentos.
É o único arquivo que sabe "quais pedaços usar em qual situação".
"""

from typing import Optional, Dict, Any
from app.prompts.base import STEVE_BASE_SYSTEM_PROMPT
from app.prompts.fragments import (
    REASONING_TRANSPARENCY_FRAGMENT,
    RAG_CONTEXT_FRAGMENT,
    AREA_CONTEXT_FRAGMENT,
    TOOL_USAGE_FRAGMENT,
)


def build_system_prompt(
    include_reasoning_transparency: bool = True,
    include_tool_usage: bool = False,
    include_rag_context: bool = False,
    rag_context: Optional[str] = None,
    include_area_context: bool = False,
    area_context: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Monta o System Prompt final de forma modular.
    Começamos com a base imutável (o DNA do Steve Arch).
    """

    parts = [STEVE_BASE_SYSTEM_PROMPT]

    # Transparência de raciocínio Steve mostra o raciocínio antes da resposta
    if include_reasoning_transparency:
        parts.append(REASONING_TRANSPARENCY_FRAGMENT)

    # Instruções de uso de ferramentas (diagnóstico, validação, projeção)
    if include_tool_usage:
        parts.append(TOOL_USAGE_FRAGMENT)

    # Contexto RAG — documentação técnica da área do usuário (fase 2)
    if include_rag_context and rag_context:
        formatted_rag = RAG_CONTEXT_FRAGMENT.format(context=rag_context)
        parts.append(formatted_rag)

    # Contexto de área — injeta especificidades da área selecionada no onboarding
    if include_area_context and area_context:
        formatted_area = AREA_CONTEXT_FRAGMENT.format(
            area=area_context.get("area", "geral"),
            restrictions=area_context.get("restrictions", "nenhuma identificada"),
            common_tools=area_context.get("common_tools", "não especificado"),
        )
        parts.append(formatted_area)

    return "\n\n".join(parts)


def get_basic_system_prompt() -> str:
    """
    Atalho para o V1.0 do Steve Arch.
    Ativa apenas o necessário para a fase inicial: DNA + Raciocínio + Ferramentas.
    """
    return build_system_prompt(
        include_reasoning_transparency=True,
        include_tool_usage=True,
        include_rag_context=False,
        include_area_context=False,
    )


def get_area_system_prompt(area: str, common_tools: str, restrictions: str = "") -> str:
    """
    Atalho para análise com contexto de área específica.
    Usado quando o usuário seleciona uma área no onboarding.
    """
    return build_system_prompt(
        include_reasoning_transparency=True,
        include_tool_usage=True,
        include_area_context=True,
        area_context={
            "area": area,
            "common_tools": common_tools,
            "restrictions": restrictions,
        },
    )