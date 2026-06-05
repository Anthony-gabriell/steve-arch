// Lógica do dashboard de diagnóstico
let D = null;

const SCORE_LEVELS = [
  {min:0,max:30,label:'Precisa de base sólida',short:'Base inicial'},
  {min:31,max:60,label:'Base boa, ajustes críticos',short:'Boa, ajustes'},
  {min:61,max:80,label:'Pronto para crescer',short:'Pronto p/ crescer'},
  {min:81,max:100,label:'Arquitetura sólida',short:'Arquitetura sólida'}
];

function getLevel(s) { return SCORE_LEVELS.find(l => s >= l.min && s <= l.max) || SCORE_LEVELS[0]; }
function show(id, t = 'flex') { const e = document.getElementById(id); if (e) e.style.display = t; }
function hide(id) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }

function buildMilestonePath(data) {
  const pf = data.projecao_financeira;
  const currentReceita = (data.monetizacao_atual && data.monetizacao_atual.ja_cobra)
    ? (data.monetizacao_atual.ticket_atual * (data.monetizacao_atual.usuarios_pagantes || 1))
    : Math.max(50, Math.round(pf.cenario_conservador.receita_mensal / 8));
  const nodes = [
    { label: 'HOJE', tone: 'atual', users: 1, receita: currentReceita },
    { label: 'PRIMEIRO MARCO', tone: 'proximo', users: pf.cenario_conservador.usuarios, receita: pf.cenario_conservador.receita_mensal },
    { label: 'MARCO REALISTA', tone: 'futuro', users: pf.cenario_realista.usuarios, receita: pf.cenario_realista.receita_mensal },
    { label: 'POTENCIAL MÁXIMO', tone: 'peak', users: pf.cenario_otimista.usuarios, receita: pf.cenario_otimista.receita_mensal }
  ];
  const xs = [180, 540, 900, 1180];
  const y = 120;
  const connectors = nodes.slice(0, -1).map((n, i) => {
    const x1 = xs[i], x2 = xs[i + 1];
    const dash = i === 0 ? '' : 'stroke-dasharray="5 6"';
    const opacity = i === 0 ? '1' : '0.55';
    const color = i === 0 ? '#2EE8B0' : 'rgba(46,232,176,0.6)';
    return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="2" ${dash} stroke-linecap="round" opacity="${opacity}"/>`;
  }).join('');
  const shimmer = `<rect x="${xs[0]}" y="${y - 1}" width="${xs[1] - xs[0]}" height="2" fill="url(#shimmerGrad)" opacity="0.9"><animate attributeName="x" from="${xs[0]}" to="${xs[1] - 40}" dur="2.4s" repeatCount="indefinite"/></rect>`;
  document.getElementById('connectorGroup').innerHTML = connectors + shimmer;
  const nodesSvg = nodes.map((n, i) => {
    const x = xs[i];
    const isActive = n.tone === 'atual';
    const isPeak = n.tone === 'peak';
    const radius = isActive || isPeak ? 12 : 9;
    const fill = isActive ? '#2EE8B0' : isPeak ? 'rgba(46,232,176,0.2)' : 'rgba(46,232,176,0.06)';
    const stroke = isActive || isPeak ? '#2EE8B0' : 'rgba(46,232,176,0.5)';
    const strokeWidth = isActive ? 0 : 1.5;
    const pulse = isActive ? `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="#2EE8B0" stroke-width="1.2" opacity="0.7"><animate attributeName="r" values="${radius};${radius + 6}" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite"/></circle>` : '';
    const labelY = (i % 2 === 0) ? y - 44 : y + 56;
    return `${pulse}<circle cx="${x}" cy="${y}" r="${radius + 4}" fill="rgba(46,232,176,0.04)"/><circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="${isActive || isPeak ? 'url(#nodeGlow)' : ''}"/>${isActive ? `<circle cx="${x}" cy="${y}" r="4" fill="#060809"/>` : ''}<g transform="translate(${x}, ${labelY})"><text x="0" y="0" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="1.5" fill="${isActive ? '#2EE8B0' : isPeak ? '#2EE8B0' : '#8B9590'}">${n.label}</text><text x="0" y="14" text-anchor="middle" font-family="Outfit, sans-serif" font-size="13" font-weight="600" fill="#F8F9FA">${formatBRL(n.receita)}/mês</text><text x="0" y="28" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="0.5" fill="#5A6560">${n.users.toLocaleString('pt-BR')} ${n.users === 1 ? 'usuário' : 'usuários'}</text></g>`;
  }).join('');
  document.getElementById('nodesGroup').innerHTML = nodesSvg;
}

function renderUAU(data, onboarding) {
  const area = AREA_LABELS[onboarding.step1] || '';
  const nome = onboarding.nomeSolucao || area || 'Sua Solução';
  document.title = 'Laudo Steve Arch ' + nome;
  document.getElementById('areaTag').textContent = area || 'Diagnóstico';
  document.getElementById('solutionName').textContent = nome.toUpperCase();
  document.getElementById('solutionResumo').textContent = data.resumo_executivo;
  const score = data.score_escalabilidade;
  const level = getLevel(score);
  document.getElementById('scoreStatus').textContent = data.score_label || level.label;
  document.getElementById('scoreNarrativa').textContent = data.score_narrativa || '';
  document.getElementById('scoreBarFill').style.width = score + '%';
  buildMilestonePath(data);
  const pf = data.projecao_financeira;
  document.getElementById('metricsRow').innerHTML = [
    {cls:'hero-card',icon:`<path d="M4.5 16.5L12 9l4.5 4.5L20 10"/><path d="M15 10h5v5"/>`,label:'Potencial de Faturamento',value:`${formatBRL(pf.cenario_otimista.receita_mensal)}<span class="unit">/mês</span>`,sub:`Com <strong>${pf.cenario_otimista.usuarios.toLocaleString('pt-BR')} usuários</strong> no plano recomendado`},
    {cls:'',icon:`<path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>`,label:'Pontos Críticos',value:data.gargalos.length+' pontos',sub:`<span class="urgent">${data.gargalos.filter(g=>g.severidade==='alta').length} urgentes</span>, ${data.gargalos.filter(g=>g.severidade!=='alta').length} monitorar`},
    {cls:'',icon:`<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>`,label:'Ferramentas Recomendadas',value:data.stack_recomendada.length+' ferramentas',sub:`<strong>${data.stack_recomendada.filter(s=>s.familiar).length}</strong> que você já conhece`}
  ].map(c => `<div class="metric-card ${c.cls}"><div class="metric-header"><svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${c.icon}</svg><span class="metric-label">${c.label}</span></div><div class="metric-value">${c.value}</div><div class="metric-sub">${c.sub}</div></div>`).join('');
  document.getElementById('nsText').textContent = data.proximo_passo;
}

function renderGarg(data) {
  document.getElementById('gargGrid').innerHTML = data.gargalos.map(g => `<div class="garg-card ${g.severidade}"><div class="garg-top"><span class="garg-titulo">${g.titulo}</span><span class="sev ${g.severidade}">${g.severidade === 'alta' ? 'Urgente' : g.severidade === 'media' ? 'Atenção' : 'Observar'}</span></div><p class="garg-desc">${g.descricao}</p><span class="garg-quando"><svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>${g.quando_aparece}</span></div>`).join('');
}

function renderStack(data) {
  document.getElementById('stackGrid').innerHTML = data.stack_recomendada.map(s => `<div class="stack-card"><div class="stack-top"><span class="stack-comp">${s.componente}</span><span class="stack-fam ${s.familiar ? 'sim' : 'nao'}">${s.familiar ? 'Você já conhece' : 'Novo para você'}</span></div><div class="stack-nome">${s.ferramenta}</div><p class="stack-just">${s.justificativa}</p><span class="stack-custo">${s.custo_estimado}/mês</span></div>`).join('');
}

function renderRoadmap(data) {
  let html = data.roadmap.map((f, i) => `<div class="rm-item" id="rm${i}" onclick="toggleRM(${i})"><div class="rm-top"><div class="rm-dot">${String(i + 1).padStart(2, '0')}</div><div class="rm-titulo">${f.titulo}</div><div class="rm-dur">${f.duracao}</div></div><div class="rm-card">${f.objetivos.map(o => `<div class="rm-obj">${o}</div>`).join('')}<div class="rm-entregavel">Resultado: ${f.entregavel}</div></div></div>`).join('');
  html += `<div class="rm-end"><div class="rm-end-dot"></div><div class="rm-end-text">Você chega em ${data.projecao_financeira.cenario_otimista.usuarios.toLocaleString('pt-BR')} usuários</div></div>`;
  document.getElementById('roadmapH').innerHTML = html;
  const rh = document.querySelector('.roadmap-h');
  if (data.roadmap.length <= 3) rh.style.justifyContent = 'center';
  if (data.roadmap.length > 0) document.getElementById('rm0').classList.add('open');
}

function toggleRM(i) {
  const el = document.getElementById(`rm${i}`);
  const was = el.classList.contains('open');
  document.querySelectorAll('.rm-item').forEach(e => e.classList.remove('open'));
  if (!was) el.classList.add('open');
}

function renderFin(data) {
  const pf = data.projecao_financeira;
  const cens = [{key:'cenario_conservador',label:'Conservador',css:'conservador'},{key:'cenario_realista',label:'Realista',css:'realista'},{key:'cenario_otimista',label:'Otimista',css:'otimista'}];
  document.getElementById('finGrid').innerHTML = cens.map(c => {
    const d = pf[c.key];
    return `<div class="fin-card ${c.css}"><span class="fin-cenario">${c.label}</span><div class="fin-receita">${formatBRL(d.receita_mensal)}<span>/mês</span></div><div class="fin-usuarios">${d.usuarios.toLocaleString('pt-BR')} usuários</div><div class="fin-rows"><div class="fin-row"><span>Custo de operação</span><strong>${formatBRL(d.custo_infra)}/mês</strong></div><div class="fin-row"><span>Margem</span><strong>${d.margem}%</strong></div></div></div>`;
  }).join('');
  document.getElementById('finModelo').innerHTML = `<div><span class="fin-modelo-label">Como cobrar</span><div class="fin-modelo-val">${pf.modelo_sugerido}</div></div><div><span class="fin-modelo-label">Valor sugerido por cliente</span><div class="fin-ticket">${formatBRL(pf.ticket_medio_sugerido)}</div></div>`;
}

function renderRiscos(data) {
  if (!data.riscos_fundamentais || !data.riscos_fundamentais.length) {
    document.querySelector('#riscoGrid').closest('.block').style.display = 'none'; return;
  }
  document.getElementById('riscoGrid').innerHTML = data.riscos_fundamentais.map(r => `<div class="risco-card ${r.severidade}"><div class="risco-top"><span class="risco-titulo">${r.titulo}</span><span class="sev ${r.severidade}">${r.severidade === 'alta' ? 'Crítico' : r.severidade === 'media' ? 'Atenção' : 'Observar'}</span></div><p class="risco-desc">${r.descricao}</p><div class="risco-miti">${r.mitigacao}</div></div>`).join('');
}

function renderFila(data) {
  if (!data.proximos_passos_fila || !data.proximos_passos_fila.length) {
    document.querySelector('#filaList').closest('.block').style.display = 'none'; return;
  }
  document.getElementById('filaList').innerHTML = data.proximos_passos_fila.map((p, i) => `<div class="fila-item ${i === 0 ? 'atual' : ''}"><div class="fila-num">${p.ordem || i + 1}</div><div class="fila-body"><div class="fila-titulo">${p.titulo}</div><div class="fila-desc">${p.descricao}</div><div class="fila-crit">Concluído quando: ${p.criterio_conclusao}</div></div></div>`).join('');
}

function renderDashboard(data, onboarding) {
  D = data;
  renderUAU(data, onboarding);
  renderGarg(data);
  renderStack(data);
  renderRoadmap(data);
  renderFin(data);
  renderRiscos(data);
  renderFila(data);
  renderCronograma(data);
  hide('loadingState');
  show('dashboard', 'block');
}

function exportPDF() {
  if (!D) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const onboarding = JSON.parse(localStorage.getItem('steveOnboarding') || '{}');
  const nome = (onboarding.nomeSolucao || 'Solucao').trim();
  const area = AREA_LABELS[onboarding.step1] || '';
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const parseWeeks = (dur) => { const n = (dur.match(/\d+/g) || ['4']).map(Number); return n.reduce((a,b)=>a+b,0)/n.length; };
  const sevLabel = (s) => ({ alta:'CRITICO', media:'ATENCAO', baixa:'OBSERVAR' })[s] || 'OBSERVAR';

  const M = { left: 24, right: 186, top: 26, bottom: 266 };
  const CW = M.right - M.left;
  const LH = 4.6;
  let y = M.top;

  const INK = [28, 32, 36], BODY = [55, 60, 64], MUTE = [120, 126, 130], HAIR = [210, 215, 218];
  const ACCENT = [13, 110, 82];
  const NEON = [46, 232, 176];
  const RED = [196, 52, 70], AMBER = [176, 120, 22], GREEN = [13, 110, 82];
  const MONO = 'courier';

  const setF = (font, style, size, color) => { doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...color); };
  const sevColor = s => ({ alta: RED, media: AMBER, baixa: GREEN })[s] || GREEN;

  function runhead() {
    setF(MONO, 'normal', 8, MUTE);
    doc.text('STEVE ARCH', M.left, 15);
    doc.text(`DIAG-ARCH/${nome.toUpperCase()}`, M.right, 15, { align: 'right' });
    doc.setDrawColor(...NEON); doc.setLineWidth(0.8); doc.line(M.left, 17.5, M.left + 16, 17.5);
    doc.setDrawColor(...HAIR); doc.setLineWidth(0.2); doc.line(M.left + 18, 17.5, M.right, 17.5);
  }
  function footer(n) {
    doc.setDrawColor(...NEON); doc.setLineWidth(0.8); doc.line(M.left, 271, M.left + 16, 271);
    doc.setDrawColor(...HAIR); doc.setLineWidth(0.2); doc.line(M.left + 18, 271, M.right, 271);
    setF(MONO, 'normal', 8, MUTE);
    doc.text('Steve Arch', M.left, 276);
    doc.text(`[Pagina ${n}]`, M.right, 276, { align: 'right' });
  }
  function newPage() { doc.addPage(); runhead(); y = M.top; }
  function need(h) { if (y + h > M.bottom) newPage(); }

  function para(text, { size = 9.5, color = BODY, indent = 0, gap = LH * 0.7 } = {}) {
    if (!text) return;
    setF(MONO, 'normal', size, color);
    doc.splitTextToSize(String(text), CW - indent).forEach(l => { need(LH); doc.text(l, M.left + indent, y); y += LH; });
    y += gap;
  }
  function section(num, title) {
    need(15); y += 3;
    setF(MONO, 'bold', 11, INK);
    doc.text(`${num}.  ${title}`, M.left, y);
    y += 2.5;
    doc.setDrawColor(...NEON); doc.setLineWidth(0.9); doc.line(M.left, y, M.left + 20, y);
    doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(M.left + 22, y, M.right, y);
    y += 6;
  }
  function subsec(num, title) {
    need(9); y += 1.5;
    setF(MONO, 'bold', 9.5, ACCENT);
    doc.text(`${num}  ${title}`, M.left, y); y += 5;
  }

  // ─── CAPA ───
  doc.setFillColor(9, 12, 11); doc.rect(0, 0, 210, 297, 'F');
  doc.setDrawColor(...NEON); doc.setLineWidth(1.2);
  doc.line(20, 20, 36, 20); doc.line(20, 20, 20, 36);
  doc.line(190, 277, 174, 277); doc.line(190, 277, 190, 261);

  setF(MONO, 'bold', 9, NEON); doc.text('STEVE ARCH', 28, 42, { charSpace: 2 });
  setF(MONO, 'normal', 8, [140, 148, 144]); doc.text('ENGENHARIA DE SOFTWARE', 28, 48, { charSpace: 1 });

  setF(MONO, 'normal', 9, [120, 128, 124]);

  setF(MONO, 'bold', 30, [255, 255, 255]);
  const nameLines = doc.splitTextToSize(nome.toUpperCase(), 150);
  let cy = 130; nameLines.forEach(l => { doc.text(l, 28, cy); cy += 13; });
  doc.setDrawColor(...NEON); doc.setLineWidth(1); doc.line(28, cy - 4, 28 + 22, cy - 4);
  cy += 4;
  setF(MONO, 'normal', 11, NEON); doc.text(area, 28, cy); cy += 14;

  setF(MONO, 'normal', 7.5, [100, 108, 104]);
  doc.text('Este documento e um ativo tecnico.', 28, 268, { charSpace: 0.3 });

  // ─── PAGINA 1 ───
  newPage();
  setF(MONO, 'normal', 9, BODY);
  const metaL = ['Steve Arch Engineering', 'Categoria: Diagnostico Tecnico', 'Documento: DIAG-ARCH-001', `Emitido: ${hoje}`];
  const metaR = ['Solucao: ' + nome, 'Dominio: ' + area, 'Status: ' + D.score_label, 'Versao: 1.0'];
  let mh = y;
  metaL.forEach((t, i) => doc.text(t, M.left, mh + i * 5));
  metaR.forEach((t, i) => { const w = doc.getTextWidth(t); doc.text(t, M.right - w, mh + i * 5); });
  y = mh + metaL.length * 5 + 4;
  doc.setDrawColor(...NEON); doc.setLineWidth(0.8); doc.line(M.left, y, M.left + 20, y);
  doc.setDrawColor(...INK); doc.setLineWidth(0.4); doc.line(M.left + 22, y, M.right, y);
  y += 12;

  setF(MONO, 'bold', 15, INK);
  const tl = doc.splitTextToSize(`Diagnostico de Escalabilidade: ${nome}`, CW);
  tl.forEach(l => { const w = doc.getTextWidth(l); doc.text(l, M.left + (CW - w) / 2, y); y += 7; });
  y += 6;

  setF(MONO, 'bold', 9.5, INK); doc.text('Resumo deste documento', M.left, y); y += 5.5;
  para(D.resumo_executivo);
  y += 2;

  setF(MONO, 'bold', 9.5, INK); doc.text('Indice', M.left, y); y += 5.5;
  const toc = ['1. Problema', '2. Solucao proposta', '3. Diagnostico tecnico', '4. Projecao financeira', '5. Roadmap', '6. Plano de execucao', '7. Conclusao'];
  setF(MONO, 'normal', 9, BODY);
  toc.forEach(t => { need(LH); doc.text(t, M.left + 4, y); y += LH; });
  y += 2;

  // ─── SEÇÕES ───
  section('1', 'Problema');
  para(`Declaracao do usuario: "${onboarding.step2}"`, { color: MUTE });
  D.problema_detalhado.split(/\n\n+/).forEach(p => para(p.trim()));

  section('2', 'Solucao proposta');
  para(`Declaracao do usuario: "${onboarding.step3}"`, { color: MUTE });
  D.solucao_detalhada.split(/\n\n+/).forEach(p => para(p.trim()));

  section('3', 'Diagnostico tecnico');
  subsec('3.1', 'Gargalos de escalabilidade');
  D.gargalos.forEach((g, i) => {
    need(16);
    setF(MONO, 'bold', 9.5, INK);
    const head = `[G-${i + 1}] ${g.titulo}  `;
    doc.text(head, M.left, y);
    const hw = doc.getTextWidth(head);
    setF(MONO, 'bold', 9.5, sevColor(g.severidade));
    doc.text(`<${sevLabel(g.severidade)}>`, M.left + hw, y);
    y += 5;
    para(g.descricao, { indent: 6, gap: LH * 0.3 });
    para(`Ponto de inflexao: ${g.quando_aparece}`, { indent: 6, color: MUTE });
  });
  subsec('3.2', 'Stack tecnica recomendada');
  asciiTable(['COMPONENTE', 'FERRAMENTA', 'CUSTO', 'FAM'], [0.28, 0.40, 0.16, 0.16],
    D.stack_recomendada.map(s => [s.componente, s.ferramenta, s.custo_estimado, s.familiar ? 'sim' : 'nao']));
  subsec('3.3', 'Riscos fundamentais');
  D.riscos_fundamentais.forEach((r, i) => {
    need(18);
    setF(MONO, 'bold', 9.5, INK);
    const head = `[R-${i + 1}] ${r.titulo}  `;
    doc.text(head, M.left, y);
    const hw = doc.getTextWidth(head);
    setF(MONO, 'bold', 9.5, sevColor(r.severidade));
    doc.text(`<${sevLabel(r.severidade)}>`, M.left + hw, y);
    y += 5;
    para(r.descricao, { indent: 6, gap: LH * 0.3 });
    para(`> Mitigacao: ${r.mitigacao}`, { indent: 6, color: ACCENT });
  });

  section('4', 'Projecao financeira');
  para(`Modelo: ${D.projecao_financeira.modelo_sugerido}`, {});
  para(`Ticket por cliente: ${formatBRL(D.projecao_financeira.ticket_medio_sugerido)}`, { gap: LH });
  const pf = D.projecao_financeira;
  asciiTable(['CENARIO', 'USERS', 'RECEITA/MES', 'CUSTO/MES', 'MARGEM'], [0.26, 0.16, 0.22, 0.20, 0.16],
    [
      ['conservador', pf.cenario_conservador.usuarios.toString(), formatBRL(pf.cenario_conservador.receita_mensal), formatBRL(pf.cenario_conservador.custo_infra), pf.cenario_conservador.margem + '%'],
      ['realista', pf.cenario_realista.usuarios.toString(), formatBRL(pf.cenario_realista.receita_mensal), formatBRL(pf.cenario_realista.custo_infra), pf.cenario_realista.margem + '%'],
      ['otimista', pf.cenario_otimista.usuarios.toString(), formatBRL(pf.cenario_otimista.receita_mensal), formatBRL(pf.cenario_otimista.custo_infra), pf.cenario_otimista.margem + '%']
    ]);

  section('5', 'Roadmap');
  D.roadmap.forEach((f, i) => {
    subsec(`5.${i + 1}`, `${f.titulo} [${f.duracao}]`);
    f.objetivos.forEach(o => para(`* ${o}`, { indent: 4, gap: LH * 0.2 }));
    para(`=> Entregavel: ${f.entregavel}`, { indent: 4, color: ACCENT, gap: LH });
  });

  section('6', 'Plano de execucao');
  D.proximos_passos_fila.forEach(p => {
    need(16);
    setF(MONO, 'bold', 9.5, INK);
    doc.text(`STEP ${String(p.ordem).padStart(2, '0')}: ${p.titulo}`, M.left, y); y += 5;
    para(p.descricao, { indent: 6, gap: LH * 0.3 });
    setF(MONO, 'bold', 8.5, ACCENT); doc.text('[OK quando]', M.left + 6, y);
    const ow = doc.getTextWidth('[OK quando] ');
    setF(MONO, 'normal', 9, MUTE);
    const okLines = doc.splitTextToSize(p.criterio_conclusao, CW - 6 - ow);
    okLines.forEach((l, idx) => { if (idx > 0) { need(LH); } doc.text(l, M.left + 6 + ow, y); if (idx < okLines.length - 1) y += LH; });
    y += LH + LH * 0.7;
  });

  section('7', 'Conclusao');
  para(`${nome} classificada como "${D.score_label}". ${D.score_narrativa}`);
  para(`Acao imediata: ${D.proximo_passo}`);
  para('Este documento e um ativo tecnico permanente. Exporte o Markdown e anexe a qualquer assistente de IA para aprofundamento.', { color: MUTE });

  function asciiTable(headers, widths, rows) {
    const cw = widths.map(w => w * CW);
    const lh = 4.3;
    need(16);
    doc.setDrawColor(...NEON); doc.setLineWidth(0.6); doc.line(M.left, y, M.right, y); y += 4;
    setF(MONO, 'bold', 8, INK);
    let cx = M.left; headers.forEach((h, i) => { doc.text(h, cx + 1.5, y); cx += cw[i]; }); y += 1.5;
    doc.setDrawColor(...INK); doc.setLineWidth(0.25); doc.line(M.left, y, M.right, y); y += 4;
    setF(MONO, 'normal', 8, BODY);
    rows.forEach(row => {
      const cells = row.map((c, i) => doc.splitTextToSize(String(c), cw[i] - 3));
      const maxL = Math.max(...cells.map(l => l.length));
      const rh = maxL * lh;
      need(rh + 2);
      cx = M.left; cells.forEach((lines, i) => { lines.forEach((l, li) => doc.text(l, cx + 1.5, y + li * lh)); cx += cw[i]; });
      y += rh + 1.5;
    });
    doc.setDrawColor(...INK); doc.setLineWidth(0.25); doc.line(M.left, y, M.right, y); y += 6;
  }

  const tp = doc.internal.getNumberOfPages();
  for (let i = 2; i <= tp; i++) { doc.setPage(i); footer(i - 1); }
  doc.save(`Diagnostico_${nome.replace(/\s+/g, '_')}_SteveArch.pdf`);
}





function exportMD() {
  if (!D) return;
  const onboarding = JSON.parse(localStorage.getItem('steveOnboarding') || '{}');
  const nome = onboarding.nomeSolucao || 'Solucao';
  const area = AREA_LABELS[onboarding.step1] || '';
  const pf = D.projecao_financeira;
  let md = `# Laudo Técnico de Arquitetura: ${nome}\n> Gerado pelo Steve Arch, Arquiteto de Soluções Escaláveis\n\n---\n\n`;
  md += `## 1. Identificação da Solução\n\n| Campo | Informação |\n|---|---|\n| Nome | ${nome} |\n| Área | ${area} |\n| Avaliação de Escalabilidade | ${D.score_label} |\n\n`;
  md += `## 2. Resumo Executivo\n\n${D.resumo_executivo}\n\n`;
  md += `## 3. Ação Imediata Recomendada\n\n${D.proximo_passo}\n\n---\n\n`;
  md += `## 4. Plano de execução\n\n`;
  D.proximos_passos_fila.forEach(p => { md += `### ${p.ordem}. ${p.titulo}\n\n${p.descricao}\n\n**Concluído quando:** ${p.criterio_conclusao}\n\n`; });
  md += `---\n\n## 5. Diagnóstico Técnico, Gargalos de Escalabilidade\n\n`;
  D.gargalos.forEach((g, i) => { md += `### 5.${i + 1}. ${g.titulo}\n\n- **Severidade:** ${g.severidade === 'alta' ? 'Alta (Urgente)' : g.severidade === 'media' ? 'Média (Atenção)' : 'Baixa (Monitorar)'}\n- **Quando aparece:** ${g.quando_aparece}\n- **Descrição:** ${g.descricao}\n\n`; });
  md += `---\n\n## 6. Stack Técnica Recomendada\n\n| Componente | Ferramenta | Familiar | Custo/mês | Justificativa |\n|---|---|---|---|---|\n`;
  D.stack_recomendada.forEach(s => { md += `| ${s.componente} | ${s.ferramenta} | ${s.familiar ? 'Sim' : 'Não'} | ${s.custo_estimado} | ${s.justificativa} |\n`; });
  md += `\n---\n\n## 7. Roadmap de Implementação\n\n`;
  D.roadmap.forEach((f, i) => { md += `### Etapa ${i + 1}: ${f.titulo} (${f.duracao})\n\n**Objetivos:**\n`; f.objetivos.forEach(o => { md += `- ${o}\n`; }); md += `\n**Resultado esperado:** ${f.entregavel}\n\n`; });
  md += `---\n\n## 8. Riscos fundamentais\n\n`;
  D.riscos_fundamentais.forEach((r, i) => { md += `### 8.${i + 1}. ${r.titulo}\n\n- **Severidade:** ${r.severidade === 'alta' ? 'Crítico' : r.severidade === 'media' ? 'Atenção' : 'Observar'}\n- **Descrição:** ${r.descricao}\n- **Como mitigar:** ${r.mitigacao}\n\n`; });
  md += `---\n\n## 9. Projeção Financeira\n\n**Modelo:** ${pf.modelo_sugerido}\n**Valor por cliente:** ${formatBRL(pf.ticket_medio_sugerido)}\n\n| Cenário | Usuários | Receita Mensal | Custo de Operação | Margem |\n|---|---|---|---|---|\n`;
  md += `| Conservador | ${pf.cenario_conservador.usuarios} | ${formatBRL(pf.cenario_conservador.receita_mensal)} | ${formatBRL(pf.cenario_conservador.custo_infra)} | ${pf.cenario_conservador.margem}% |\n`;
  md += `| Realista | ${pf.cenario_realista.usuarios} | ${formatBRL(pf.cenario_realista.receita_mensal)} | ${formatBRL(pf.cenario_realista.custo_infra)} | ${pf.cenario_realista.margem}% |\n`;
  md += `| Otimista | ${pf.cenario_otimista.usuarios} | ${formatBRL(pf.cenario_otimista.receita_mensal)} | ${formatBRL(pf.cenario_otimista.custo_infra)} | ${pf.cenario_otimista.margem}% |\n\n`;
  md += `---\n\n## 10. Contexto para uso em IA\n\n> Cole o bloco abaixo em qualquer IA para receber respostas cirúrgicas:\n\n\`\`\`\n`;
  md += `Atue como CTO técnico deste projeto. Use o contexto abaixo como verdade absoluta sobre o estado atual. Sua missão é detalhar a implementação completa: arquitetura técnica, integração entre as ferramentas sugeridas, ordem de execução do backlog dentro do prazo, e os pontos de decisão que vão aparecer no caminho. Quando faltar informação, pergunte antes de assumir.\n\n`;
  md += `Contexto da minha solução:\n\nNome: ${nome}\nÁrea: ${area}\nProblema: ${onboarding.step2 || 'não informado'}\nSolução proposta: ${onboarding.step3 || 'não informado'}\nFerramentas: ${onboarding.tools?.join(', ') || 'não informado'}\nAvaliação: ${D.score_label}\nGargalos principais: ${D.gargalos.map(g => g.titulo).join(', ')}\nRiscos principais: ${D.riscos_fundamentais.map(r => r.titulo).join(', ')}\nStack recomendada: ${D.stack_recomendada.map(s => s.ferramenta).join(', ')}\nPróximo passo: ${D.proximos_passos_fila[0]?.titulo || D.proximo_passo}\n\`\`\`\n\n---\n*Laudo gerado pelo Steve Arch em ${new Date().toLocaleDateString('pt-BR')}*\n`;
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${nome.replace(/\s+/g, '-').toLowerCase()}-laudo-steve-arch.md`; a.click();
  URL.revokeObjectURL(url);
}

// CRONOGRAMA DE EXECUÇÃO
function renderCronograma(data) {
  if (!data.proximos_passos_fila || !data.proximos_passos_fila.length) {
    const wrap = document.querySelector('.chat-cronograma-wrap');
    if (wrap) wrap.style.gridTemplateColumns = '1fr';
    const cw = document.querySelector('.cronograma-wrap');
    if (cw) cw.style.display = 'none';
    return;
  }

  const cacheKey = getCronogramaKey();
  const saved = JSON.parse(localStorage.getItem(cacheKey) || '{}');

  const list = document.getElementById('cronogramaList');
  list.innerHTML = data.proximos_passos_fila.map((p, i) => {
    const id = `step_${i}`;
    const done = saved[id] === true;
    return `
      <div class="crono-item ${done ? 'done' : ''}" data-id="${id}" onclick="toggleCrono('${id}')" style="animation-delay: ${i * 0.06}s">
        <div class="crono-checkbox">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#060809" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="crono-body">
          <div class="crono-num">ETAPA ${String(p.ordem || i + 1).padStart(2, '0')}</div>
          <div class="crono-title">${p.titulo}</div>
        </div>
      </div>
    `;
  }).join('');

  updateCronogramaProgress();
}

function getCronogramaKey() {
  const onboarding = JSON.parse(localStorage.getItem('steveOnboarding') || '{}');
  return 'steveCronograma_' + getInputHash(onboarding);
}

function toggleCrono(id) {
  const cacheKey = getCronogramaKey();
  const saved = JSON.parse(localStorage.getItem(cacheKey) || '{}');
  saved[id] = !saved[id];
  localStorage.setItem(cacheKey, JSON.stringify(saved));

  const item = document.querySelector(`.crono-item[data-id="${id}"]`);
  if (item) item.classList.toggle('done');

  updateCronogramaProgress();
}

function updateCronogramaProgress() {
  const items = document.querySelectorAll('.crono-item');
  const done = document.querySelectorAll('.crono-item.done').length;
  const total = items.length;
  const pct = total ? (done / total * 100) : 0;

  const progressEl = document.getElementById('cronogramaProgress');
  const barEl = document.getElementById('cronogramaBar');

  if (progressEl) progressEl.textContent = `${done} / ${total}`;
  if (barEl) barEl.style.width = pct + '%';
}

function resetCronograma() {
  const cacheKey = getCronogramaKey();
  localStorage.removeItem(cacheKey);
  document.querySelectorAll('.crono-item').forEach(el => el.classList.remove('done'));
  updateCronogramaProgress();
}

async function init() {
  const raw = localStorage.getItem('steveOnboarding');
  if (!raw) { hide('loadingState'); show('emptyState'); return; }
  const onboarding = JSON.parse(raw);
  const cacheKey = 'steveDiagnostico_' + getInputHash(onboarding);
  Object.keys(localStorage).forEach(k => { if (k.startsWith('steveDiagnostico_') && k !== cacheKey) localStorage.removeItem(k); });
  localStorage.removeItem('steveDiagnostico');
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { renderDashboard(JSON.parse(cached), onboarding); return; }
    catch (e) { localStorage.removeItem(cacheKey); }
  }
  try {
    const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(onboarding) });
    if (res.status === 429) {
      hide('loadingState'); show('emptyState');
      document.querySelector('.empty-title').textContent = 'Limite diário atingido';
      document.querySelector('.empty-sub').textContent = 'Você já fez 3 análises hoje. Volte amanhã para fazer novas análises.';
      return;
    }
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    renderDashboard(data, onboarding);
  } catch (err) {
    hide('loadingState'); show('emptyState');
    document.querySelector('.empty-title').textContent = 'Erro ao gerar diagnóstico';
    document.querySelector('.empty-sub').textContent = 'Verifique se o servidor está rodando e tente novamente.';
  }
}

(function animateLogo() {
  const el = document.getElementById('atech-full-ma');
  if (!el) return;
  const text = 'STEVE ARCH';
  let i = 0;
  el.style.opacity = '1';
  function type() {
    if (i < text.length) { el.textContent = text.substring(0, i + 1); i++; setTimeout(type, 120); }
    else { setTimeout(erase, 1200); }
  }
  function erase() {
    let j = text.length;
    function del() {
      if (j > 0) { el.textContent = text.substring(0, j); j--; setTimeout(del, 80); }
      else { el.textContent = ''; i = 0; setTimeout(type, 500); }
    }
    del();
  }
  type();
})();

init();