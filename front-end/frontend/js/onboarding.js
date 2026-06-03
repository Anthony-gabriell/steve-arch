// Lógica do onboarding em 8 passos
const TOTAL_STEPS = 8;
const STEPS = [
  {id:1,question:'Como se chama<br><em>sua solução?</em>',label:'Digite o nome da sua solução',type:'name'},
  {id:2,question:'Qual área a sua<br><em>solução atende?</em>',label:'Selecione uma área',type:'single'},
  {id:3,question:'Qual problema você<br><em>quer resolver?</em>',label:'Descreva em suas palavras',type:'textarea',placeholder:'Ex: Advogados perdem horas gerando contratos manualmente. Quero automatizar esse processo...'},
  {id:4,question:'Qual solução você<br><em>já pensou?</em>',label:'Descreva sua ideia. Se ainda for um esboço, tudo bem. Eu te ajudo a refinar.',type:'textarea',placeholder:'Ex: Um sistema que gera contratos automaticamente a partir de um formulário preenchido pelo cliente...'},
  {id:5,question:'Quais ferramentas<br><em>você conhece?</em>',label:'Selecione as ferramentas que você conhece',type:'multi-tools'},
  {id:6,question:'O quanto você QUER<br><em>investir por mês?</em>',label:'Selecione o valor que pretende investir inicialmente na sua solução',type:'single'},
  {id:7,question:'Quantos usuários<br><em>você tem hoje?</em>',label:'Selecione sua situação atual',type:'single'},
  {id:8,question:'Quanto tempo você<br><em>dedica ao projeto?</em>',label:'Selecione sua disponibilidade semanal',type:'single',nextBtn:'Gerar Diagnóstico'}
];

const AREA_INSIGHTS = {
  marketing:{title:'Sobre Marketing Digital',text:'O marketing digital é a área que mais absorve automação de IA agora. Ferramentas como n8n conectam CRMs, WhatsApp e plataformas de anúncio em fluxos automáticos.'},
  financas:{title:'Sobre Soluções Financeiras',text:'Fintech é um dos mercados mais aquecidos no Brasil. Dashboards financeiros com dados em tempo real, automação de conciliação e análise de crédito têm muito espaço.'},
  medicina:{title:'Sobre Healthtech',text:'Soluções para clínicas e telemedicina crescem 30% ao ano no Brasil. Agendamento automatizado, prontuário eletrônico e triagem inteligente são as dores mais comuns.'},
  direito:{title:'Sobre Legaltech',text:'O setor jurídico carece de automação. Geração de contratos, análise de documentos e processos ainda dependem de trabalho manual intenso.'},
  logistica:{title:'Sobre Logtech',text:'Rastreamento em tempo real, otimização de rotas e gestão de frotas são as maiores demandas. Soluções de logística escalam rápido e exigem infraestrutura robusta desde cedo.'},
  rh:{title:'Sobre HRtech',text:'Triagem de candidatos, processo de entrada de novos funcionários e análise de desempenho estão sendo transformados por IA.'},
  administrativa:{title:'Sobre Automação Administrativa',text:'Processos administrativos têm alta repetição e baixo valor agregado, o que os torna ideais para automação.'}
};

const NAME_SUGGESTIONS = {
  marketing: ['CampanhaAI','LeadFlow','ContentBot','GrowthMind'],
  financas: ['FinTrack','ContaAI','FluxoFin','MoneyFlow'],
  medicina: ['ClinicaAI','SaudeFlow','MediTrack','ClinicBot'],
  direito: ['LexAI','ContratoFlow','JurisBot','LegalTrack'],
  logistica: ['LogiTrack','EntregaAI','FreteFlow','RouteBot'],
  rh: ['TalentAI','RecrutaFlow','PeopleBot','HireTrack'],
  administrativa: ['OpsFlow','GestorAI','ProcessBot','AdminTrack']
};

const PROBLEM_CHIPS = {
  marketing: ["Dificuldade em medir o retorno de campanhas","Criação de conteúdo não escala","Leads chegam sem qualificação","Atendimento manual no WhatsApp","Dependência de uma única plataforma de ads"],
  financas: ["Falta de visão macro dos gastos","Conciliação manual entre contas","Categorização demora muito","Difícil entender pra onde vai o dinheiro","Vários bancos sem unificação"],
  medicina: ["Agendamento manual consome a recepção","Prontuário em papel ou planilha","Pacientes faltam sem aviso","Comunicação pós consulta inexistente","Difícil rastrear histórico clínico"],
  direito: ["Triagem de casos demora demais","Petições repetitivas tomam tempo","Clientes pedem atualizações constantes","Controle de prazos manual e arriscado","Pesquisa de jurisprudência demorada"],
  logistica: ["Rastreamento de entregas é manual","Roteirização ineficiente","Sem visibilidade do status em tempo real","Comunicação com motoristas via WhatsApp","Difícil prever atrasos"],
  rh: ["Triagem de currículos é manual","Onboarding de novos funcionários demora","Pesquisas de clima sem ação prática","Folha de ponto descentralizada","Comunicação interna fragmentada"],
  administrativa: ["Tarefas repetitivas consomem tempo","Documentos espalhados em vários lugares","Aprovações dependem de email manual","Sem visão consolidada de processos","Erros frequentes por falta de padrão"]
};

const SOLUTION_CHIPS = {
  marketing: ["Dashboard centralizado de métricas","Automação de campanhas com IA","Chatbot de qualificação de leads","Gerador de conteúdo personalizado"],
  financas: ["App de controle financeiro pessoal","Dashboard web com gráficos e categorias","Integração com Open Finance","Categorização automática com IA"],
  medicina: ["Sistema de agendamento online","Prontuário eletrônico simplificado","Lembretes automáticos por WhatsApp","Portal de acompanhamento do paciente"],
  direito: ["Gerador de petições com IA","Painel de prazos centralizado","Triagem automatizada de casos","Portal de atualização para clientes"],
  logistica: ["Painel de rastreamento em tempo real","Roteirizador automático","App para motoristas com status","Previsão de atraso com IA"],
  rh: ["Triagem inteligente de currículos","Plataforma de onboarding guiado","Sistema de pesquisa de clima","Hub de comunicação interna"],
  administrativa: ["Automação de tarefas repetitivas","Hub centralizado de documentos","Fluxo de aprovação digital","Dashboard de processos operacionais"]
};

const AREA_R = {marketing:["Marketing é onde mais vejo soluções escaláveis nascendo agora.","Boa escolha. Ferramentas de IA estão transformando essa área rapidamente."],financas:["Finanças é a área que mais cresce em adoção de IA no Brasil agora.","Precisa de atenção especial em dados sensíveis e regulação."],medicina:["Saúde é uma das áreas com maior impacto real para soluções tecnológicas.","Soluções médicas precisam de cuidado extra com proteção de dados."],direito:["Jurídico está em plena transformação digital. Ótimo momento para entrar.","Área com muito processo manual ainda. Espaço enorme para automação."],logistica:["Logística é onde gargalos técnicos aparecem mais rápido com o crescimento.","Boa área. Escala exige atenção especial em infraestrutura."],rh:["RH está sendo completamente redesenhado por IA nos últimos dois anos.","Boa escolha. Empresas de todos os tamanhos precisam disso."],administrativa:["Processos administrativos são os que mais se beneficiam de automação.","Boa área para começar. Problema claro, usuário bem definido."]};
const ZERO_BUDGET = ['Sem problemas, podemos calibrar isso depois.','Entendido. Você pode ajustar o orçamento quando quiser.','Tranquilo. Essa questão pode ser alterada mais tarde.','Beleza. Definimos isso quando já tiver faturando.','Ok. Se mudar de ideia é só atualizar o orçamento depois.'];
const INVEST_R = {ate100:['Boa escolha para começar. Dá pra construir muito com esse orçamento.'],'100a500':['Com esse investimento dá pra construir algo que aguenta escala real.'],'500mais':['Ótimo. Esse investimento abre opções de infraestrutura de alta qualidade.'],depois:['Faz sentido. Começa grátis, investe quando validar.']};
const USER_R = {zero:['Ótimo. Vamos começar do zero e escalar essa solução.'],'1_50':['Fase ideal para solidificar a base antes da escala.'],'50_500':['Crescendo. Aqui os gargalos começam a aparecer de verdade.'],'500_5000':['Fase crítica. Vamos mapear o que precisa ser reforçado.'],'5000mais':['Alta escala. Aqui os gargalos são caros e urgentes.']};
const PROBLEM_R = ['Entendido. Contexto claro ajuda a identificar os gargalos certos.','Boa descrição. Vou usar isso para calibrar o diagnóstico.','Anotado. Esse contexto é fundamental para a análise.'];
const SOLUTION_R = ['Interessante. Vou considerar essa abordagem na análise de viabilidade.','Boa visão. Agora vou mapear os pontos críticos dessa solução.','Entendido. Isso vai orientar as recomendações de ferramentas.'];
const TOOLS_R = ['Ferramentas registradas. Vou calibrar as recomendações com base no que você já conhece.','Anotado. Essas ferramentas vão guiar as sugestões.'];
const DEDIC_R = {menos5h:['Entendido. Vou calibrar o plano para um ritmo realista.'],'5_20h':['Boa disponibilidade. Suficiente para avançar bem.'],'20_40h':['Ótimo ritmo. Com esse foco dá pra mover muito rápido.'],fulltime:['Tempo integral. Vamos montar algo ambicioso e sólido.']};
const NAME_R = ['Ótimo nome. Vamos construir o diagnóstico dessa solução.','Perfeito. Agora vou analisar cada detalhe dessa solução.','Excelente. Começo a estruturar o diagnóstico agora.','Registrado. Vamos ver o que essa solução tem de potencial.'];

let currentStep = 1, answers = {}, selectedTools = [];
let jaCobra = null, ticketAtual = null, usuariosPagantes = null;

function rand(a) { return a[Math.floor(Math.random() * a.length)]; }
function setReady(v) { document.getElementById('btnNext').classList.toggle('ready', !!v); }

function addMsg(text, isUser = false, delay = 0) {
  const t = document.getElementById('typingEl');
  setTimeout(() => {
    if (!isUser) {
      t.classList.add('on');
      setTimeout(() => { t.classList.remove('on'); _app(text, false); }, 680);
    } else {
      _app(text, true);
    }
  }, delay);
}

function _app(text, isUser) {
  const c = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = 'msg' + (isUser ? ' user' : '');
  d.innerHTML = `<div class="msg-av">${isUser ? 'Eu' : 'Steve'}</div><div class="msg-bubble${isUser ? ' user' : ''}">${text}</div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function renderStep() {
  const s = STEPS[currentStep - 1];
  const sq = document.getElementById('stepQuestion');
  sq.innerHTML = s.question;
  sq.style.animation = 'none';
  sq.offsetHeight;
  sq.style.animation = 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both';
  document.getElementById('optionsLabel').textContent = s.label;
  document.getElementById('progressFill').style.width = ((currentStep - 1) / TOTAL_STEPS * 100) + '%';
  document.getElementById('progressCount').textContent = currentStep + ' / ' + TOTAL_STEPS;
  document.getElementById('btnNext').textContent = s.nextBtn || 'Continuar';
  setReady(false);
  const c = document.getElementById('optionsContent');
  c.innerHTML = '';

  if (s.type === 'name') {
    const wrap = document.createElement('div'); wrap.className = 'name-step';
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'name-input-big'; inp.id = 'nameInput';
    inp.placeholder = 'Ex: MeuApp, ContaFlow, JurisAI...'; inp.maxLength = 60;
    inp.oninput = () => { answers.nomeSolucao = inp.value.trim(); setReady(inp.value.trim().length > 1); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.trim().length > 1) document.getElementById('btnNext').click(); });
    wrap.appendChild(inp);
    const sl = document.createElement('p'); sl.className = 'name-suggest-label'; sl.textContent = 'Sugestões de nome (clique para usar)'; wrap.appendChild(sl);
    const sugs = document.createElement('div'); sugs.className = 'name-suggestions'; sugs.id = 'nameSugs';
    const defaultSugs = ['SolutionAI', 'IdeaFlow', 'ScaleUp', 'StartApp'];
    defaultSugs.forEach(s => {
      const btn = document.createElement('span'); btn.className = 'name-sug'; btn.textContent = s;
      btn.onclick = () => { inp.value = s; answers.nomeSolucao = s; setReady(true); inp.focus(); };
      sugs.appendChild(btn);
    });
    wrap.appendChild(sugs); c.appendChild(wrap);
    setTimeout(() => inp.focus(), 80);
  }

  if (s.type === 'single') {
    const items = currentStep === 2 ? AREAS : currentStep === 6 ? INVESTMENTS : currentStep === 7 ? USERS : DEDICATION;
    items.forEach((item, i) => {
      const d = document.createElement('div'); d.className = 'opt'; d.style.animationDelay = (i * 0.04) + 's'; d.dataset.value = item.value;
      d.onclick = () => selectSingle(d, item);
      d.innerHTML = `${item.icon ? `<span class="opt-icon">${item.icon}</span>` : ''}<div class="opt-content"><div class="opt-label">${item.label}</div>${item.sub ? `<div class="opt-sub">${item.sub}</div>` : ''}</div><span class="opt-check">✓</span>`;
      c.appendChild(d);
    });
    if (currentStep === 7) {
      jaCobra = null; ticketAtual = null; usuariosPagantes = null;
      const mb = document.createElement('div'); mb.className = 'monetiz-block'; mb.id = 'monetizBlock';
      mb.innerHTML = `<p class="section-label">Já cobra dos seus usuários?</p><div class="monetiz-toggle"><button type="button" class="monetiz-opt" data-val="sim">Sim</button><button type="button" class="monetiz-opt" data-val="nao">Ainda não</button></div><div class="charge-fields" id="chargeFields"><label class="monetiz-label">Quanto cobra por usuário? (R$)</label><input type="number" min="0" step="0.01" class="steve-input" id="ticketInput" placeholder="Ex: 49.90"><label class="monetiz-label">Quantos pagantes você tem?</label><input type="number" min="0" step="1" class="steve-input" id="payingInput" placeholder="Ex: 120"></div>`;
      c.appendChild(mb);
      mb.querySelectorAll('.monetiz-opt').forEach(b => {
        b.onclick = () => {
          mb.querySelectorAll('.monetiz-opt').forEach(x => x.classList.remove('selected'));
          b.classList.add('selected');
          const cf = mb.querySelector('#chargeFields');
          if (b.dataset.val === 'sim') { jaCobra = true; cf.classList.add('open'); }
          else { jaCobra = false; cf.classList.remove('open'); ticketAtual = null; usuariosPagantes = null;
            const ti = mb.querySelector('#ticketInput'), pi = mb.querySelector('#payingInput'); if (ti) ti.value = ''; if (pi) pi.value = '';
          }
        };
      });
      const ti = mb.querySelector('#ticketInput'), pi = mb.querySelector('#payingInput');
      ti.oninput = () => { ticketAtual = ti.value !== '' ? parseFloat(ti.value) : null; };
      pi.oninput = () => { usuariosPagantes = pi.value !== '' ? parseInt(pi.value, 10) : null; };
    }
  }

  if (s.type === 'textarea') {
    if (currentStep === 3 && answers.step2) {
      const ins = AREA_INSIGHTS[answers.step2];
      if (ins) { const b = document.createElement('div'); b.className = 'insight-box'; b.innerHTML = `<span class="insight-label">📡 ${ins.title}</span><p class="insight-text">${ins.text}</p>`; c.appendChild(b); }
    }
    const chipSet = currentStep === 3 ? PROBLEM_CHIPS : currentStep === 4 ? SOLUTION_CHIPS : null;
    const chips = chipSet && answers.step2 ? chipSet[answers.step2] : null;
    const ta = document.createElement('textarea'); ta.className = 'steve-textarea'; ta.placeholder = s.placeholder || ''; ta.id = 'taInput';
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (ta.value.trim().length > 15) document.getElementById('btnNext').click(); } });
    ta.oninput = () => { answers[`step${currentStep}`] = ta.value.trim(); setReady(ta.value.trim().length > 15); };

    if (chips && chips.length) {
      const chipWrap = document.createElement('div'); chipWrap.className = 'chip-wrap';
      chips.forEach((txt, i) => {
        const chip = document.createElement('span'); chip.className = 'chip'; chip.textContent = txt; chip.style.animationDelay = (i * 0.04) + 's';
        chip.onclick = () => {
          chipWrap.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
          chip.classList.add('selected');
          ta.disabled = false; ta.value = txt;
          answers[`step${currentStep}`] = txt; setReady(true);
        };
        chipWrap.appendChild(chip);
      });
      c.appendChild(chipWrap);
      ta.disabled = true; c.appendChild(ta);
      const describe = document.createElement('span'); describe.className = 'describe-link'; describe.textContent = 'Descrever do meu jeito';
      describe.onclick = () => {
        chipWrap.style.display = 'none'; describe.style.display = 'none';
        ta.disabled = false; ta.value = ''; answers[`step${currentStep}`] = ''; setReady(false);
        setTimeout(() => ta.focus(), 60);
      };
      c.appendChild(describe);
      const h = document.createElement('p'); h.className = 'input-hint'; h.textContent = 'Escolha uma opção acima ou descreva do seu jeito.'; c.appendChild(h);
    } else {
      c.appendChild(ta);
      const h = document.createElement('p'); h.className = 'input-hint'; h.textContent = 'Enter para enviar. Shift+Enter para nova linha.'; c.appendChild(h);
      setTimeout(() => ta.focus(), 80);
    }
  }

  if (s.type === 'multi-tools') {
    selectedTools = [];
    TOOLS.forEach((tool, i) => {
      const d = document.createElement('div'); d.className = 'opt'; d.style.animationDelay = (i * 0.04) + 's'; d.dataset.value = tool.value;
      d.onclick = e => { if (e.target.closest('.opt-expand-btn')) return; toggleTool(d, tool); };
      d.innerHTML = `<span class="opt-icon">${tool.icon}</span><div class="opt-content"><div class="opt-label">${tool.label}</div><div class="opt-sub">${tool.sub}</div><button class="opt-expand-btn" data-tool="${tool.value}"><svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Saiba mais</button><div class="opt-detail" id="detail-${tool.value}">${tool.detail}</div></div><span class="opt-check">✓</span>`;
      c.appendChild(d);
    });
    const sl = document.createElement('p'); sl.className = 'section-label'; sl.textContent = 'Usa outra ferramenta? Escreva abaixo'; c.appendChild(sl);
    const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'steve-input'; inp.placeholder = 'Ex: Voiceflow, Dify, Flowise...';
    inp.oninput = () => { answers.toolOther = inp.value.trim(); if (inp.value.trim().length > 0) setReady(true); }; c.appendChild(inp);
    const none = document.createElement('div'); none.className = 'opt'; none.style.marginTop = '8px'; none.dataset.value = 'nenhuma';
    none.innerHTML = `<span class="opt-icon">🔍</span><div class="opt-content"><div class="opt-label">Não conheço nenhuma</div><div class="opt-sub">Vou sugerir as melhores para o seu contexto</div></div><span class="opt-check">✓</span>`;
    none.onclick = () => selectNone(none); c.appendChild(none);
    c.querySelectorAll('.opt-expand-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation(); const key = btn.dataset.tool; const det = document.getElementById(`detail-${key}`); const open = det.classList.contains('open');
        c.querySelectorAll('.opt-detail').forEach(d => d.classList.remove('open'));
        c.querySelectorAll('.opt-expand-btn').forEach(b => { b.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Saiba mais'; });
        if (!open) { det.classList.add('open'); btn.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Fechar'; }
      });
    });
  }
}

function selectSingle(el, item) {
  document.querySelectorAll('#optionsContent .opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected'); answers[`step${currentStep}`] = item.value; setReady(true);
  if (currentStep === 2) {
    addMsg(item.label, true, 50); addMsg(rand(AREA_R[item.value] || AREA_R.administrativa), false, 200);
  }
  if (currentStep === 7) {
    const mb = document.getElementById('monetizBlock');
    if (mb) {
      if (item.value === 'zero') {
        mb.classList.remove('open');
        jaCobra = null; ticketAtual = null; usuariosPagantes = null;
        mb.querySelectorAll('.monetiz-opt').forEach(x => x.classList.remove('selected'));
        const cf = mb.querySelector('#chargeFields'); if (cf) cf.classList.remove('open');
        const ti = mb.querySelector('#ticketInput'), pi = mb.querySelector('#payingInput'); if (ti) ti.value = ''; if (pi) pi.value = '';
      } else {
        mb.classList.add('open');
      }
    }
  }
}

function toggleTool(el, tool) {
  document.querySelectorAll('#optionsContent .opt[data-value="nenhuma"]').forEach(o => o.classList.remove('selected'));
  selectedTools = selectedTools.filter(t => t !== 'nenhuma');
  const sel = el.classList.contains('selected');
  if (sel) { el.classList.remove('selected'); selectedTools = selectedTools.filter(t => t !== tool.value); }
  else { el.classList.add('selected'); selectedTools.push(tool.value); }
  answers.step5 = selectedTools.join(','); setReady(selectedTools.length > 0);
}

function selectNone(el) {
  document.querySelectorAll('#optionsContent .opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected'); selectedTools = ['nenhuma']; answers.step5 = 'nenhuma'; setReady(true);
}

function nextStep() {
  if (currentStep === 1) {
    const nome = answers.nomeSolucao || '';
    if (nome) { addMsg(nome, true, 0); addMsg(rand(NAME_R), false, 200); }
  }
  if (currentStep === 3) { const v = answers.step3 || ''; if (v) { addMsg(v.length > 100 ? v.substring(0, 100) + '...' : v, true, 0); addMsg(rand(PROBLEM_R), false, 200); } }
  if (currentStep === 4) { const v = answers.step4 || ''; if (v) { addMsg(v.length > 100 ? v.substring(0, 100) + '...' : v, true, 0); addMsg(rand(SOLUTION_R), false, 200); } }
  if (currentStep === 5) {
    if (selectedTools.includes('nenhuma')) { addMsg('Não conheço nenhuma ferramenta ainda', true, 0); addMsg('Sem problemas. Vou mapear as ferramentas certas para o seu contexto.', false, 200); }
    else if (selectedTools.length > 0) {
      const toolLabels = selectedTools.map(v => TOOLS.find(t => t.value === v)?.label || v);
      const other = answers.toolOther ? `, ${answers.toolOther}` : '';
      addMsg(`Ferramentas: ${toolLabels.join(', ')}${other}`, true, 0); addMsg(rand(TOOLS_R), false, 200);
    }
  }
  if (currentStep === 6) {
    const v = answers.step6;
    if (v) {
      const lab = { zero: 'R$ 0 por mês', ate100: 'Até R$ 100 por mês', '100a500': 'R$ 100 a 500 por mês', '500mais': 'R$ 500 ou mais por mês', depois: 'Definir depois do faturamento' };
      addMsg(lab[v] || v, true, 0); if (v === 'zero') { addMsg(rand(ZERO_BUDGET), false, 200); } else { const r = INVEST_R[v]; if (r) addMsg(rand(r), false, 200); }
    }
  }
  if (currentStep === 7) {
    const v = answers.step7;
    if (v) {
      const lab = { zero: 'Ainda não lancei', '1_50': '1 a 50 usuários', '50_500': '50 a 500 usuários', '500_5000': '500 a 5.000 usuários', '5000mais': '5.000 ou mais usuários' };
      addMsg(lab[v] || v, true, 0); const r = USER_R[v]; if (r) addMsg(rand(r), false, 200);
    }
  }
  if (currentStep === 8) {
    const v = answers.step8;
    if (v) {
      const lab = { menos5h: 'Menos de 5h por semana', '5_20h': '5 a 20h por semana', '20_40h': '20 a 40h por semana', fulltime: 'Tempo integral' };
      addMsg(lab[v] || v, true, 0); const r = DEDIC_R[v]; if (r) addMsg(rand(r), false, 200);
      submitOnboarding(); return;
    }
  }
  currentStep++;
  setTimeout(() => { renderStep(); const ns = STEPS[currentStep - 1]; addMsg(ns.label + '.', false, 450); }, 350);
}

function submitOnboarding() {
  setTimeout(() => {
    document.getElementById('loadingOverlay').classList.add('on');
    const payload = {
      nomeSolucao: answers.nomeSolucao,
      step1: answers.step2, step2: answers.step3, step3: answers.step4,
      step4: answers.step5, step5: answers.step6, step6: answers.step7, step7: answers.step8,
      toolOther: answers.toolOther, tools: selectedTools,
      ja_cobra: jaCobra, ticket_atual: ticketAtual, usuarios_pagantes: usuariosPagantes
    };
    localStorage.setItem('steveOnboarding', JSON.stringify(payload));
    setTimeout(() => { window.location.href = 'minhas-analises.html'; }, 4000);
  }, 900);
}

renderStep();