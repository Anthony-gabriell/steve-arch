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
  const M = { left: 22, right: 188, top: 25, bottom: 270 };
  let y = M.top;
  const CYAN_NEON = [46, 232, 176], CYAN_INK = [14, 125, 93], DARK_INK = [10, 14, 13], GRAY_TEXT = [55, 65, 60], GRAY_META = [90, 101, 96];

  function drawHeader() {
    doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('STEVE ARCH', M.left, 14, { charSpace: 1.2 });
    const rightText = 'DIAGNOSTICO TECNICO';
    const rightTextWidth = doc.getTextWidth(rightText) + (rightText.length * 1.2);
    doc.text(rightText, M.right - rightTextWidth, 14, { charSpace: 1.2 });
    doc.setDrawColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setLineWidth(0.2); doc.line(M.left, 17, M.right, 17);
  }
  function newPage() { doc.addPage(); drawHeader(); y = M.top + 6; }
  function checkSpace(needed) { if (y + needed > M.bottom) newPage(); }
  function sectionTitle(num, title) {
    y += 4; checkSpace(26);
    doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`SECAO ${num}`, M.left, y, { charSpace: 1.5 }); y += 8;
    doc.setTextColor(DARK_INK[0], DARK_INK[1], DARK_INK[2]); doc.setFontSize(17); doc.setFont('helvetica', 'bold');
    doc.text(title, M.left, y); y += 3;
    doc.setDrawColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setLineWidth(0.6); doc.line(M.left, y, M.left + 30, y); y += 11;
  }
  function subTitle(text) { checkSpace(10); y += 3; doc.setTextColor(10, 14, 13); doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(text, M.left, y); y += 6; }
  function paragraph(text, size = 9.5, color = [55, 65, 60]) {
    if (!text) return;
    doc.setTextColor(color[0], color[1], color[2]); doc.setFontSize(size); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(text), M.right - M.left);
    lines.forEach(line => { checkSpace(5.5); doc.text(line, M.left, y); y += 5; });
    y += 1.5;
  }
  function metaRow(label, value) {
    checkSpace(8); doc.setTextColor(GRAY_META[0], GRAY_META[1], GRAY_META[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), M.left, y, { charSpace: 1 });
    const valueX = M.left + 50; const valueMaxWidth = M.right - valueX;
    doc.setTextColor(DARK_INK[0], DARK_INK[1], DARK_INK[2]); doc.setFontSize(10);
    const valueLines = doc.splitTextToSize(String(value), valueMaxWidth);
    valueLines.forEach((line, idx) => { if (idx > 0) { y += 5; checkSpace(5); } doc.text(line, valueX, y); });
    y += 6.5;
  }
  function severityTag(severity) {
    const labels = { alta: 'CRITICO', media: 'ATENCAO', baixa: 'OBSERVAR' };
    const colors = { alta: [255, 77, 109], media: [255, 179, 71], baixa: CYAN_INK };
    const sc = colors[severity] || CYAN_INK;
    doc.setTextColor(sc[0], sc[1], sc[2]); doc.setFontSize(7);
    doc.text(labels[severity] || 'OBSERVAR', M.left, y, { charSpace: 1.5 }); y += 5;
  }

  doc.setFillColor(8, 11, 10); doc.rect(0, 0, 210, 297, 'F');
  doc.setDrawColor(46, 232, 176); doc.setLineWidth(0.3); doc.line(M.left, 30, 50, 30);
  doc.setTextColor(46, 232, 176); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('STEVE ARCH', M.left, 36, { charSpace: 3 });
  doc.setTextColor(160, 168, 165); doc.setFontSize(9);
  doc.text('ARQUITETO DE SOLUCOES ESCALAVEIS', M.left, 42, { charSpace: 2 });
  doc.setTextColor(140, 150, 145); doc.setFontSize(10);
  doc.text('DIAGNOSTICO TECNICO', M.left, 130, { charSpace: 2.5 });
  doc.setTextColor(255, 255, 255); doc.setFontSize(34); doc.setFont('helvetica', 'bold');
  const nameUpper = nome.toUpperCase();
  const nameLines = doc.splitTextToSize(nameUpper, 175);
  nameLines.forEach((ln, i) => doc.text(ln, M.left, 150 + (i * 13)));
  doc.setDrawColor(46, 232, 176); doc.setLineWidth(0.5); doc.line(M.left, 175, M.left + 25, 175);
  doc.setTextColor(160, 168, 165); doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text(area, M.left, 184);
  doc.setTextColor(90, 101, 96); doc.setFontSize(9);
  doc.text('Analise arquitetural completa . ' + D.score_label, M.left, 192);
  doc.setTextColor(90, 101, 96); doc.setFontSize(8);
  const dt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Gerado em ${dt}`, M.left, 270);
  doc.text('Este documento e um ativo tecnico. Use livremente.', M.left, 276);

  newPage();
  sectionTitle('01', 'A Solucao');
  metaRow('Nome', nome); metaRow('Area de atuacao', area); metaRow('Avaliacao', D.score_label);
  y += 2; paragraph(D.score_narrativa, 10); y += 2;
  subTitle('Resumo executivo'); paragraph(D.resumo_executivo);

  y += 5; sectionTitle('02', 'O Problema Identificado');
  doc.setTextColor(GRAY_META[0], GRAY_META[1], GRAY_META[2]); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
  const userProblem = doc.splitTextToSize(`"${onboarding.step2 || 'Nao informado'}"`, M.right - M.left);
  userProblem.forEach(line => { checkSpace(5); doc.text(line, M.left, y); y += 5; });
  y += 4; doc.setFont('helvetica', 'normal');
  const problemaText = D.problema_detalhado || 'Detalhamento nao disponivel.';
  problemaText.split(/\n\n+/).forEach((p, i, arr) => { paragraph(p.trim(), 10, DARK_INK); if (i < arr.length - 1) y += 2; });

  y += 5; sectionTitle('03', 'A Solucao Proposta');
  doc.setTextColor(GRAY_META[0], GRAY_META[1], GRAY_META[2]); doc.setFontSize(9); doc.setFont('helvetica', 'italic');
  const userSolution = doc.splitTextToSize(`"${onboarding.step3 || 'Nao informada'}"`, M.right - M.left);
  userSolution.forEach(line => { checkSpace(5); doc.text(line, M.left, y); y += 5; });
  y += 4; doc.setFont('helvetica', 'normal');
  const solucaoText = D.solucao_detalhada || 'Analise nao disponivel.';
  solucaoText.split(/\n\n+/).forEach((p, i, arr) => { paragraph(p.trim(), 10, DARK_INK); if (i < arr.length - 1) y += 2; });

  y += 5; sectionTitle('04', 'Diagnostico Tecnico');
  subTitle('4.1 Gargalos de escalabilidade');
  D.gargalos.forEach((g, i) => {
    checkSpace(20); doc.setTextColor(10, 14, 13); doc.setFontSize(10.5); doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${g.titulo}`, M.left, y); y += 5;
    severityTag(g.severidade); paragraph(g.descricao, 9);
    doc.setTextColor(90, 101, 96); doc.setFontSize(8); checkSpace(5);
    doc.text(`Quando aparece: ${g.quando_aparece}`, M.left, y); y += 7;
  });
  subTitle('4.2 Stack tecnica recomendada');
  D.stack_recomendada.forEach((s) => {
    checkSpace(20); doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(7.5);
    doc.text(s.componente.toUpperCase(), M.left, y, { charSpace: 1.5 }); y += 4.5;
    doc.setTextColor(10, 14, 13); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(s.ferramenta, M.left, y); y += 5;
    paragraph(s.justificativa, 9);
    doc.setTextColor(90, 101, 96); doc.setFontSize(8); checkSpace(5);
    doc.text(`Custo estimado: ${s.custo_estimado}    ${s.familiar ? '(voce ja conhece)' : '(novo para voce)'}`, M.left, y); y += 7;
  });
  subTitle('4.3 Riscos fundamentais');
  D.riscos_fundamentais.forEach((r, i) => {
    checkSpace(24); doc.setTextColor(10, 14, 13); doc.setFontSize(10.5); doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${r.titulo}`, M.left, y); y += 5;
    severityTag(r.severidade); paragraph(r.descricao, 9);
    doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(7.5);
    doc.text('MITIGACAO', M.left, y, { charSpace: 1.5 }); y += 4.5;
    paragraph(r.mitigacao, 9); y += 2;
  });

  y += 5; sectionTitle('05', 'Projecao Financeira');
  const pf = D.projecao_financeira;
  metaRow('Modelo sugerido', pf.modelo_sugerido); metaRow('Valor por cliente', formatBRL(pf.ticket_medio_sugerido));
  y += 4;
  ['conservador', 'realista', 'otimista'].forEach((tipo) => {
    const c = pf['cenario_' + tipo]; checkSpace(16);
    const isReal = tipo === 'realista';
    doc.setTextColor(isReal ? CYAN_INK[0] : GRAY_META[0], isReal ? CYAN_INK[1] : GRAY_META[1], isReal ? CYAN_INK[2] : GRAY_META[2]);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(`CENARIO ${tipo.toUpperCase()}${isReal ? ' . MAIS PROVAVEL' : ''}`, M.left, y, { charSpace: 1.2 }); y += 5.5;
    doc.setTextColor(10, 14, 13); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`${c.usuarios.toLocaleString('pt-BR')} usuarios . Receita ${formatBRL(c.receita_mensal)}/mes`, M.left, y); y += 5;
    doc.setTextColor(55, 65, 60); doc.setFontSize(9);
    doc.text(`Custo operacional ${formatBRL(c.custo_infra)}/mes . Margem ${c.margem}%`, M.left, y); y += 8;
  });

  y += 5; sectionTitle('06', 'Roadmap Tecnico');
  D.roadmap.forEach((f, i) => {
    checkSpace(28); doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(`ETAPA ${i + 1}`, M.left, y, { charSpace: 1.8 });
    const duracaoText = `DURACAO ${f.duracao.toUpperCase()}`;
    doc.setTextColor(GRAY_META[0], GRAY_META[1], GRAY_META[2]); doc.setFontSize(7.5);
    const duracaoWidth = doc.getTextWidth(duracaoText) + (duracaoText.length * 1.3);
    doc.text(duracaoText, M.right - duracaoWidth, y, { charSpace: 1.3 }); y += 5;
    doc.setTextColor(10, 14, 13); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(f.titulo, M.left, y); y += 6;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 60);
    f.objetivos.forEach(o => {
      checkSpace(5.5);
      const objLines = doc.splitTextToSize('. ' + o, M.right - M.left - 4);
      objLines.forEach(line => { checkSpace(5); doc.text(line, M.left + 2, y); y += 4.8; });
    });
    y += 2; doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(7.5);
    doc.text('ENTREGA DESTA ETAPA', M.left, y, { charSpace: 1.5 }); y += 4.5;
    paragraph(f.entregavel, 9); y += 3;
  });

  y += 5; sectionTitle('07', 'Plano de Execucao');
  paragraph('A sequencia exata de passos para sair de onde voce esta hoje ate o primeiro marco da sua solucao.');
  y += 2;
  D.proximos_passos_fila.forEach((p) => {
    checkSpace(24); doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(String(p.ordem).padStart(2, '0'), M.left, y);
    doc.setTextColor(10, 14, 13); doc.setFontSize(11.5);
    doc.text(p.titulo, M.left + 9, y); y += 5.5;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 60);
    paragraph(p.descricao, 9);
    doc.setTextColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setFontSize(7.5);
    doc.text('CONCLUIDO QUANDO', M.left, y, { charSpace: 1.5 }); y += 4.5;
    doc.setTextColor(55, 65, 60); doc.setFontSize(9); paragraph(p.criterio_conclusao, 9); y += 3;
  });

  y += 5; sectionTitle('08', 'Conclusao');
  paragraph(`${nome} esta classificada como "${D.score_label}". ${D.score_narrativa}`); y += 1;
  paragraph(`A acao imediata recomendada e: ${D.proximo_passo}`); y += 1;
  paragraph('Este diagnostico e seu ativo tecnico permanente. Use o arquivo .MD exportavel separadamente em qualquer assistente de IA para aprofundar qualquer ponto deste documento e receber respostas cirurgicas sobre sua solucao.');

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(GRAY_META[0], GRAY_META[1], GRAY_META[2]); doc.setFontSize(7);
    doc.text(`${i - 1} / ${totalPages - 1}`, 105, 283, { align: 'center' });
    doc.setDrawColor(CYAN_INK[0], CYAN_INK[1], CYAN_INK[2]); doc.setLineWidth(0.15); doc.line(M.left, 280, M.right, 280);
  }
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