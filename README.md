# Steve Arch

> Um arquiteto de soluções com IA para founders não técnicos e vibe coders.

Steve Arch é uma ferramenta que transforma respostas de onboarding em um diagnóstico técnico estruturado, comparável a uma sessão de consultoria de arquitetura de software. O objetivo não é competir com ferramentas de vibe coding, mas complementá-las: enquanto essas ferramentas constroem, o Steve dá direção.

---

## O que o Steve entrega

Três pilares fundamentais em cada diagnóstico:

**Diagnóstico**: onde a solução está e para onde pode ir

**Direção**: o caminho técnico correto para escalar

**Processos**: padrões que tornam a solução sustentável

O output é um documento estruturado que o usuário pode levar para qualquer IA generativa e obter resultados dramaticamente mais específicos e úteis.

---

## Funcionalidades

- Onboarding guiado em 8 etapas com perguntas estratégicas sobre a solução
- Diagnóstico gerado por IA com 8 seções: resumo executivo, score de escalabilidade, gargalos, stack recomendada, soluções similares, roadmap, projeção financeira e próximo passo
- Dashboard interativo com visualizações, badges de urgência, roadmap por fases e projeção em três cenários
- Exportação em Markdown com bloco de contexto pronto para colar em qualquer IA
- Interface responsiva com identidade visual própria

---

## Stack

**Frontend**
- HTML, CSS, JavaScript vanilla
- Hospedado na Vercel com roteamento limpo via `vercel.json`
- Domínio customizado: `stevearch.com.br`

**Backend**
- Python com FastAPI e Uvicorn
- Hospedado no Railway
- Endpoint principal: `POST /api/v1/diagnostico`

**IA**
- Anthropic Claude via API

**Formulários**
- Formspree

---

## Estrutura do Projeto

```
steve-arch/
├── html/
│   ├── index.html
│   ├── onboarding.html
│   ├── dashboard.html
│   ├── minhas-analises.html
│   ├── contato.html
│   └── ...
├── css/
├── js/
├── vercel.json
└── backend/
    └── main.py
```

---

## Como rodar localmente

**Frontend**

```bash
# Sem instalação, abra direto no navegador
# Nota: clean URLs funcionam apenas no Vercel, não localmente
open html/index.html
```

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Variável de ambiente necessária:

```
ANTHROPIC_API_KEY=sua_chave_aqui
```

---

## Aprendizados do Projeto

### Arquitetura e Deploy

**CORS exige as duas variantes do domínio**
Ao configurar um domínio customizado, `allow_origins` no FastAPI precisa incluir tanto `https://stevearch.com.br` quanto `https://www.stevearch.com.br`. Faltando qualquer uma, as requisições bloqueiam.

**`vercel.json` com `rewrites` apenas**
A diretiva `cleanUrls` conflita com a estrutura de subdiretório `html/`. O roteamento limpo funciona corretamente usando apenas o bloco `rewrites`. Nunca adicionar `cleanUrls`.

**Clean URLs funcionam no Vercel, não localmente**
Aceito como inconveniente, não é bug a corrigir.

**Redirecionamentos internos com path absoluto**
`window.location.href = '/onboarding'` e não `'onboarding.html'`. Com roteamento limpo, o caminho relativo quebra.

### JavaScript

**IIFE e escopo**
Quando o script principal está dentro de uma IIFE, toda função nova precisa ser declarada dentro dela também. Declarar fora faz com que chamadas internas não encontrem a função, quebrando features aparentemente não relacionadas (como o hamburger menu).

**Elementos siblings no DOM**
Dois modais ou elementos paralelos precisam ser siblings no HTML, nunca aninhados um dentro do outro. Aninhar quebra comportamento e estilização de ambos.

**Redirects internos**
Trocar modal por link direto (`/contato`) é mais simples e menos propenso a erro do que manter lógica de modal para ações secundárias.

### Produto

**Diferenciação está no processo, não no agente**
O valor do Steve Arch não é ser mais um agente de IA. É o processo estruturado e o documento de output que o usuário carrega para outras ferramentas. Essa distinção é fundamental para o posicionamento.

**Validar antes de monetizar**
V1 lançado gratuitamente para coletar feedback real antes de implementar Stripe, planos e créditos.

**Recorrência natural do produto**
Cada nova ideia ou feature relevante justifica uma nova sessão. O modelo de uso recorrente emerge do próprio produto.

**Prompt sem jargão e sem travessão**
Instruir o modelo a nunca usar jargão técnico sem tradução e nunca usar travessão (`--`) melhora consistência do output e adequação ao público não técnico.

---

## Identidade Visual

| Token | Valor |
|---|---|
| Background | `#060809` |
| Accent | `#2EE8B0` |
| Fonte | Outfit |
| Voz | Primeira pessoa, direto |

---

## Status

V1 em beta público. Projeto desenvolvido como TCC e projeto do clube de programação da ATECH com mais de 8.000 membros.

V2 planejado com autenticação (Supabase), pagamentos (Stripe) e sistema de créditos.

---

## Autor

Gabriel Anthony
[stevearch.com.br](https://stevearch.com.br)