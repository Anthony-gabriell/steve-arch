"""
Centraliza todas as ferramentas (tools) disponíveis no Steve Arch.
Mapeia os nomes da API para as funções Python e organiza os schemas.

Ferramentas V1.0:
    architecture_validator  : valida se uma arquitetura aguenta escala
    stack_selector          : recomenda stack por contexto
    scale_projector         : projeta comportamento em diferentes volumes
    financial_projector     : estima potencial de monetização
"""

from typing import List, Dict, Callable, Any


# ─── IMPLEMENTAÇÕES DAS FERRAMENTAS ─────────────────────────────────────────
# V1.0: ferramentas implementadas como análise via prompt.
# Fase 2: cada uma pode virar uma chamada a serviço externo ou modelo especializado.

def execute_architecture_validator(tool_input: dict) -> str:
    """
    Valida se a arquitetura descrita aguenta o objetivo de escala.
    Recebe: solution_description, current_stack, scale_target.
    Retorna: diagnóstico estruturado com gargalos identificados.
    """
    solution = tool_input.get("solution_description", "não descrita")
    stack = tool_input.get("current_stack", "não informada")
    scale_target = tool_input.get("scale_target", "não definido")

    return (
        f"[architecture_validator] Analisando solução: '{solution}' | "
        f"Stack atual: {stack} | Objetivo de escala: {scale_target}. "
        f"Identifique os gargalos críticos considerando: banco de dados, "
        f"autenticação, infraestrutura, acoplamento e pontos únicos de falha."
    )


def execute_stack_selector(tool_input: dict) -> str:
    """
    Recomenda ferramentas e tecnologias baseado no contexto do usuário.
    Recebe: area, problem_description, known_tools, budget, timeline.
    Retorna: recomendação de stack com justificativa por componente.
    """
    area = tool_input.get("area", "geral")
    problem = tool_input.get("problem_description", "não descrito")
    known_tools = tool_input.get("known_tools", "nenhuma")
    budget = tool_input.get("budget", "não informado")
    timeline = tool_input.get("timeline", "não informado")

    return (
        f"[stack_selector] Área: {area} | Problema: '{problem}' | "
        f"Ferramentas conhecidas: {known_tools} | Budget: {budget} | Prazo: {timeline}. "
        f"Recomende stack considerando: curva de aprendizado, custo, escalabilidade "
        f"e adequação ao domínio. Justifique cada componente com base no contexto."
    )


def execute_scale_projector(tool_input: dict) -> str:
    """
    Projeta o comportamento da solução em diferentes volumes de usuários.
    Recebe: current_users, target_users, solution_type, current_stack.
    Retorna: análise de comportamento por threshold de crescimento.
    """
    current = tool_input.get("current_users", 0)
    target = tool_input.get("target_users", 1000)
    solution_type = tool_input.get("solution_type", "não especificado")
    stack = tool_input.get("current_stack", "não informada")

    return (
        f"[scale_projector] Usuários atuais: {current} | Alvo: {target} | "
        f"Tipo de solução: {solution_type} | Stack: {stack}. "
        f"Projete o comportamento em: 2x, 10x e 100x do volume atual. "
        f"Indique o que muda na infraestrutura em cada threshold e quando fazer cada upgrade."
    )


def execute_financial_projector(tool_input: dict) -> str:
    """
    Estima o potencial de monetização da solução em diferentes cenários.
    Recebe: solution_type, target_users, pricing_model, area.
    Retorna: projeção financeira em cenários conservador, realista e otimista.
    """
    solution_type = tool_input.get("solution_type", "não especificado")
    target_users = tool_input.get("target_users", 1000)
    pricing_model = tool_input.get("pricing_model", "não definido")
    area = tool_input.get("area", "geral")

    return (
        f"[financial_projector] Solução: {solution_type} | Usuários alvo: {target_users} | "
        f"Modelo de precificação: {pricing_model} | Área: {area}. "
        f"Estime receita em 3 cenários (conservador, realista, otimista) com: "
        f"receita mensal recorrente, custo de infraestrutura e margem líquida. "
        f"Baseie os números em benchmarks reais do mercado brasileiro."
    )


# ─── REGISTRY ────────────────────────────────────────────────────────────────

TOOL_REGISTRY: Dict[str, Callable[[dict], str]] = {
    "architecture_validator": execute_architecture_validator,
    "stack_selector":         execute_stack_selector,
    "scale_projector":        execute_scale_projector,
    "financial_projector":    execute_financial_projector,
}

# Fase 2:
# "rag_retriever": execute_rag_retriever,
# "compliance_checker": execute_compliance_checker,


# ─── SCHEMAS ─────────────────────────────────────────────────────────────────

TOOL_SCHEMAS: List[Dict[str, Any]] = [
    {
        "name": "architecture_validator",
        "description": (
            "Valida se a arquitetura de uma solução aguenta o objetivo de escala definido. "
            "Identifica gargalos críticos em banco de dados, autenticação, infraestrutura, "
            "acoplamento de componentes e pontos únicos de falha."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "solution_description": {
                    "type": "string",
                    "description": "Descrição da solução a ser validada."
                },
                "current_stack": {
                    "type": "string",
                    "description": "Ferramentas e tecnologias usadas atualmente."
                },
                "scale_target": {
                    "type": "string",
                    "description": "Objetivo de escala (ex: '50 para 1000 usuários em 3 meses')."
                },
            },
            "required": ["solution_description"],
        },
    },
    {
        "name": "stack_selector",
        "description": (
            "Recomenda ferramentas e tecnologias baseado no contexto específico do usuário: "
            "área de atuação, problema a resolver, ferramentas já conhecidas, budget e prazo."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "area": {
                    "type": "string",
                    "description": "Área de atuação (Marketing, Medicina, Direito, Finanças, Logística, RH, Administrativa)."
                },
                "problem_description": {
                    "type": "string",
                    "description": "Descrição do problema que a solução resolve."
                },
                "known_tools": {
                    "type": "string",
                    "description": "Ferramentas que o usuário já conhece ou usa."
                },
                "budget": {
                    "type": "string",
                    "description": "Budget disponível para infraestrutura e ferramentas."
                },
                "timeline": {
                    "type": "string",
                    "description": "Prazo disponível para implementação."
                },
            },
            "required": ["problem_description"],
        },
    },
    {
        "name": "scale_projector",
        "description": (
            "Projeta o comportamento da solução em diferentes volumes de usuários. "
            "Indica o que muda na infraestrutura em cada threshold de crescimento "
            "e quando fazer cada upgrade."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "current_users": {
                    "type": "integer",
                    "description": "Número atual de usuários."
                },
                "target_users": {
                    "type": "integer",
                    "description": "Número alvo de usuários."
                },
                "solution_type": {
                    "type": "string",
                    "description": "Tipo de solução (dashboard, app, automação, API, etc)."
                },
                "current_stack": {
                    "type": "string",
                    "description": "Stack tecnológica atual."
                },
            },
            "required": ["target_users"],
        },
    },
    {
        "name": "financial_projector",
        "description": (
            "Estima o potencial de monetização da solução em cenários conservador, "
            "realista e otimista. Projeta receita mensal recorrente, custo de "
            "infraestrutura e margem líquida baseado em benchmarks do mercado."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "solution_type": {
                    "type": "string",
                    "description": "Tipo de solução (SaaS, marketplace, B2B, B2C, etc)."
                },
                "target_users": {
                    "type": "integer",
                    "description": "Número alvo de usuários ou clientes."
                },
                "pricing_model": {
                    "type": "string",
                    "description": "Modelo de precificação (assinatura mensal, por uso, freemium, etc)."
                },
                "area": {
                    "type": "string",
                    "description": "Área de atuação da solução."
                },
            },
            "required": ["solution_type", "target_users"],
        },
    },
]

# Fase 2:
# RAG_RETRIEVER_SCHEMA,
# COMPLIANCE_CHECKER_SCHEMA,


# ─── DESPACHADOR ─────────────────────────────────────────────────────────────

def dispatch(tool_name: str, tool_input: dict) -> str:
    """
    Localiza e executa a ferramenta solicitada pelo agente.
    Retorna o resultado como string para o histórico da conversa.
    """
    tool_fn = TOOL_REGISTRY.get(tool_name)

    if not tool_fn:
        return (
            f"Erro: A ferramenta '{tool_name}' não está registrada no Steve Arch. "
            f"Ferramentas disponíveis: {', '.join(TOOL_REGISTRY.keys())}."
        )

    try:
        return tool_fn(tool_input)
    except Exception as e:
        return f"Erro crítico ao executar '{tool_name}': {str(e)}"