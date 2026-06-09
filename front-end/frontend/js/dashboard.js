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
  const { jsPDF } = window.jspdf;

  function calcMaturidade(score, label) {
    const FAIXAS = {
      "Precisa de base sólida":     { categoria: "Fundacao",     min: 1, max: 2  },
      "Boa base, ajustes críticos": { categoria: "Estruturacao", min: 3, max: 5  },
      "Pronto para crescer":        { categoria: "Escala",       min: 6, max: 8  },
      "Arquitetura sólida":         { categoria: "Maturidade",   min: 9, max: 10 },
    };
    const faixa = FAIXAS[label] || FAIXAS["Precisa de base sólida"];
    const bruto = Math.round((Number(score) || 0) / 10);
    const nivel = Math.max(faixa.min, Math.min(faixa.max, bruto));
    return { nivel, categoria: faixa.categoria, label, texto: `Nivel ${nivel} de 10 \u00b7 ${faixa.categoria}` };
  }

  function parseSemanas(str) {
    if (!str) return 4;
    const matches = String(str).match(/(\d+)/g);
    if (!matches) return 4;
    const nums = matches.map(Number);
    if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
    return nums[0];
  }

  function severidadeTag(sev) {
    const s = String(sev || "").toLowerCase();
    if (s === "alta" || s === "critica" || s === "critico") return { tag: "<CRITICO>", cor: [196, 52, 70] };
    if (s === "media" || s === "medio") return { tag: "<ATENCAO>", cor: [176, 120, 22] };
    return { tag: "<OBSERVAR>", cor: [13, 110, 82] };
  }

  function dataExtensoPtBr(d) {
    const meses = ["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
    return `${String(d.getDate()).padStart(2, "0")} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }

  const onboarding = JSON.parse(localStorage.getItem("steveOnboarding") || "{}");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE_W = 210, PAGE_H = 297;
  const M = { left: 24, right: 186, top: 26, bottom: 266 };
  const CW = M.right - M.left;
  const LH = 4.6;

  const INK = [28, 32, 36], BODY = [55, 60, 64], MUTE = [120, 126, 130];
  const HAIR = [210, 215, 218], ACCENT = [13, 110, 82], NEON = [46, 232, 176];
  const COVER_BG = [9, 12, 11];

  const MAT = calcMaturidade(D.score_escalabilidade, D.score_label);
  const runningHeaderText = `STEVE ARCH DIAG-ARCH/${(onboarding.nomeSolucao || "DOC").toUpperCase()}`;

  let y = 0, page = 0;

  function setFont(style = "normal", size = 9) { doc.setFont("courier", style); doc.setFontSize(size); }
  function setColor(rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setDrawColor(rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
  function setFillColor(rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }

  function fileteNeon(x, yPos, len = 6) {
    setDrawColor(NEON); doc.setLineWidth(0.6); doc.line(x, yPos, x + len, yPos); doc.setLineWidth(0.2);
  }

  function hr(yPos, withFilete = true) {
    if (withFilete) fileteNeon(M.left, yPos, 6);
    setDrawColor(HAIR); doc.setLineWidth(0.2);
    doc.line(M.left + (withFilete ? 7 : 0), yPos, M.right, yPos);
  }

  function cabecalho() {
    fileteNeon(M.left, 18, 6);
    setDrawColor(HAIR); doc.setLineWidth(0.2); doc.line(M.left + 7, 18, M.right, 18);
    setFont("bold", 8.5); setColor(INK);
    doc.text(runningHeaderText, M.left + 7, 15);
  }

  function rodape() {
    if (page < 1) return;
    setDrawColor(HAIR); doc.setLineWidth(0.2); doc.line(M.left, M.bottom + 6, M.right, M.bottom + 6);
    setFont("normal", 7.5); setColor(MUTE);
    doc.text("Steve Arch", M.left, M.bottom + 10);
    const pageLabel = `[Pagina ${page}]`;
    doc.text(pageLabel, M.right - doc.getTextWidth(pageLabel), M.bottom + 10);
  }

  function newPage() { rodape(); doc.addPage(); page += 1; cabecalho(); y = M.top + 4; }
  function need(h) { if (y + h > M.bottom) newPage(); }

  function tituloSecao(num, txt) {
    need(14); y += 4;
    fileteNeon(M.left, y - 2, 6);
    setDrawColor(HAIR); doc.setLineWidth(0.2); doc.line(M.left + 7, y - 2, M.right, y - 2);
    setFont("bold", 11); setColor(INK);
    doc.text(`${num}. ${txt}`, M.left, y + 3);
    y += 8;
  }

  function subtitulo(txt) {
    need(8); y += 2;
    setFont("bold", 9.5); setColor(INK);
    doc.text(txt, M.left, y);
    y += LH + 1;
  }

  function paragrafo(txt) {
    const linhas = doc.splitTextToSize(txt, CW);
    for (const linha of linhas) {
      need(LH);
      setFont("normal", 9); setColor(BODY);
      doc.text(linha, M.left, y);
      y += LH;
    }
  }

  function paragrafoMultiplo(txt) {
    const partes = String(txt || "").split(/\n\n+/);
    for (let i = 0; i < partes.length; i++) { paragrafo(partes[i].trim()); if (i < partes.length - 1) y += LH * 0.4; }
  }

  function bulletItem(txt) {
    const linhas = doc.splitTextToSize(txt, CW - 6);
    for (let i = 0; i < linhas.length; i++) {
      need(LH);
      setFont("normal", 9); setColor(BODY);
      doc.text(i === 0 ? "*" : " ", M.left, y);
      doc.text(linhas[i], M.left + 4, y);
      y += LH;
    }
  }

  function severidadeInline(xPos, yPos, sev) {
    const { tag, cor } = severidadeTag(sev);
    setFont("bold", 9); setColor(cor);
    doc.text(tag, xPos, yPos);
    setColor(BODY);
  }

  function renderCapa() {
    page = 0;
    setFillColor(COVER_BG); doc.rect(0, 0, PAGE_W, PAGE_H, "F");
    setDrawColor(NEON); doc.setLineWidth(0.8);
    const tick = 10;
    doc.line(M.left, M.top, M.left + tick, M.top);
    doc.line(M.left, M.top, M.left, M.top + tick);
    doc.line(M.right - tick, M.top, M.right, M.top);
    doc.line(M.right, M.top, M.right, M.top + tick);
    doc.line(M.left, M.bottom + 6, M.left + tick, M.bottom + 6);
    doc.line(M.left, M.bottom + 6 - tick, M.left, M.bottom + 6);
    doc.line(M.right - tick, M.bottom + 6, M.right, M.bottom + 6);
    doc.line(M.right, M.bottom + 6 - tick, M.right, M.bottom + 6);
    doc.setLineWidth(0.2);
    setFont("bold", 22); setColor(NEON);
    const marca = "STEVE ARCH";
    doc.text(marca, (PAGE_W - doc.getTextWidth(marca)) / 2, 50);
    setFont("normal", 10); setColor([200, 210, 205]);
    const sub = "ENGENHARIA DE SOFTWARE";
    doc.text(sub, (PAGE_W - doc.getTextWidth(sub)) / 2, 57);
    const nome = (onboarding.nomeSolucao || "Solucao").toUpperCase();
    setFont("bold", 32); setColor([240, 245, 242]);
    doc.text(nome, (PAGE_W - doc.getTextWidth(nome)) / 2, 160);
    const dominio = AREA_LABELS[onboarding.step1] || "Tecnologia";
    setFont("normal", 11); setColor([170, 180, 175]);
    doc.text(dominio, (PAGE_W - doc.getTextWidth(dominio)) / 2, 170);
    setFont("normal", 9); setColor([170, 180, 175]);
    const rod = "Ativo tecnico";
    doc.text(rod, (PAGE_W - doc.getTextWidth(rod)) / 2, M.bottom);
  }

  function renderPagina1Corpo() {
    doc.addPage(); page = 1; cabecalho(); y = M.top + 4;
    const colW = (CW - 8) / 2;
    const xCol1 = M.left;
    const xCol2 = M.left + colW + 8;
    const linhasMeta = [
      { label: "Categoria:",  valor: "Diagnostico Tecnico", col: 1 },
      { label: "Documento:",  valor: "DIAG-ARCH-001",       col: 1 },
      { label: "Emitido:",    valor: dataExtensoPtBr(new Date()), col: 1 },
      { label: "Solucao:",    valor: onboarding.nomeSolucao || "Solucao", col: 2 },
      { label: "Dominio:",    valor: AREA_LABELS[onboarding.step1] || "Tecnologia", col: 2 },
      { label: "Maturidade:", valor: MAT.texto, col: 2 },
      { label: "Versao:",     valor: "1.0", col: 1 },
    ];
    const col1 = linhasMeta.filter(l => l.col === 1);
    const col2 = linhasMeta.filter(l => l.col === 2);
    function escreveLinhaMeta(x, yPos, label, valor) {
      setFont("normal", 8.5); setColor(MUTE);
      doc.text(label, x, yPos);
      const wLabel = doc.getTextWidth(label);
      setColor(INK);
      doc.text(valor, x + wLabel + 2, yPos);
    }
    let yMeta = y;
    const maxLinhas = Math.max(col1.length, col2.length);
    for (let i = 0; i < maxLinhas; i++) {
      if (col1[i]) escreveLinhaMeta(xCol1, yMeta, col1[i].label, col1[i].valor);
      if (col2[i]) escreveLinhaMeta(xCol2, yMeta, col2[i].label, col2[i].valor);
      yMeta += LH;
    }
    y = yMeta + 2;
    hr(y); y += 5;
    setFont("bold", 13); setColor(INK);
    const tit = `Diagnostico de Escalabilidade: ${onboarding.nomeSolucao || "Solucao"}`;
    doc.text(tit, (PAGE_W - doc.getTextWidth(tit)) / 2, y + 3);
    y += 11;
    subtitulo("Resumo deste documento");
    paragrafo(D.resumo_executivo || "");
    y += 2;
    subtitulo("Indice");
    const indice = ["1. Problema","2. Solucao proposta","3. Diagnostico tecnico","4. Projecao financeira","5. Roadmap","6. Plano de execucao","7. Conclusao"];
    setFont("normal", 9); setColor(BODY);
    for (const item of indice) { need(LH); doc.text(item, M.left, y); y += LH; }
  }

  function renderProblema() {
    tituloSecao("1", "Problema");
    setFont("italic", 9); setColor(MUTE);
    paragrafo(`Declaracao do usuario: "${onboarding.step2 || ""}"`);
    y += 1;
    paragrafoMultiplo(D.problema_detalhado || "");
  }

  function renderSolucao() {
    tituloSecao("2", "Solucao proposta");
    setFont("italic", 9); setColor(MUTE);
    paragrafo(`Declaracao do usuario: "${onboarding.step3 || ""}"`);
    y += 1;
    paragrafoMultiplo(D.solucao_detalhada || "");
  }

  function renderDiagnostico() {
    tituloSecao("3", "Diagnostico tecnico");
    subtitulo("3.1 Gargalos de escalabilidade");
    (D.gargalos || []).forEach((g, i) => {
      need(LH * 4);
      setFont("bold", 9); setColor(INK);
      const tituloG = `[G-${i + 1}] ${g.titulo} `;
      doc.text(tituloG, M.left, y);
      severidadeInline(M.left + doc.getTextWidth(tituloG), y, g.severidade);
      y += LH;
      paragrafo(g.descricao || "");
      if (g.quando_aparece) {
        setFont("italic", 8.5); setColor(MUTE); need(LH);
        doc.text(`Ponto de inflexao: ${g.quando_aparece}`, M.left, y); y += LH;
      }
      y += 1;
    });
    y += 1;
    subtitulo("3.2 Stack tecnica recomendada");
    renderTabelaStack(D.stack_recomendada || []);
    y += 2;
    subtitulo("3.3 Riscos fundamentais");
    (D.riscos_fundamentais || []).forEach((r, i) => {
      need(LH * 5);
      setFont("bold", 9); setColor(INK);
      const tituloR = `[R-${i + 1}] ${r.titulo} `;
      doc.text(tituloR, M.left, y);
      severidadeInline(M.left + doc.getTextWidth(tituloR), y, r.severidade);
      y += LH;
      paragrafo(r.descricao || "");
      if (r.mitigacao) {
        const linhasMit = doc.splitTextToSize(`> Mitigacao: ${r.mitigacao}`, CW - 4);
        for (const lm of linhasMit) {
          need(LH);
          setFont("normal", 9); setColor(BODY);
          doc.text(lm, M.left + 2, y);
          y += LH;
        }
      }
      y += 1;
    });
  }

  function renderTabelaStack(stack) {
  y += 4;
  fileteNeon(M.left, y - 1, 6);
  setDrawColor(HAIR);
  doc.line(M.left + 7, y - 1, M.right, y - 1);

  setFont("bold", 8.5);
  setColor(INK);
  const cols = { comp: 0, ferr: 58, custo: 120 };
  const wCusto = (M.right - M.left) - cols.custo;
  doc.text("COMPONENTE", M.left + cols.comp, y + 4);
  doc.text("FERRAMENTA", M.left + cols.ferr, y + 4);
  doc.text("CUSTO", M.left + cols.custo, y + 4);
  y += 9;
  setDrawColor(HAIR);
  doc.line(M.left, y - 2, M.right, y - 2);

  setFont("normal", 8.5);
  setColor(BODY);
  y += 1.5;
  for (const item of stack) {
    const comp = (item.componente || "").substring(0, 28);
    const ferr = (item.ferramenta || "").substring(0, 34);
    const custo = item.custo_estimado || "R$ 0";
    const custoLinhas = doc.splitTextToSize(custo, wCusto);
    const nLinhas = custoLinhas.length;
    need(LH * nLinhas);
    setFont("normal", 8.5);
    setColor(BODY);
    doc.text(comp, M.left + cols.comp, y);
    doc.text(ferr, M.left + cols.ferr, y);
    for (let i = 0; i < nLinhas; i++) {
      doc.text(custoLinhas[i], M.left + cols.custo, y + i * LH);
    }
    y += LH * nLinhas;
  }
}

  function renderProjecao() {
    tituloSecao("4", "Projecao financeira");
    const pf = D.projecao_financeira || {};
    setFont("normal", 9); setColor(BODY);
    if (pf.modelo_sugerido) paragrafo(`Modelo: ${pf.modelo_sugerido}`);
    if (pf.ticket_medio_sugerido) paragrafo(`Ticket por cliente: ${formatBRL(pf.ticket_medio_sugerido)}`);
    y += 2;
    fileteNeon(M.left, y - 1, 6);
    setDrawColor(HAIR); doc.line(M.left + 7, y - 1, M.right, y - 1);
    setFont("bold", 8.5); setColor(INK);
    const cols = { cen: 0, us: 45, rec: 80, cus: 120, mar: 152 };
    doc.text("CENARIO", M.left + cols.cen, y + 4);
    doc.text("USERS", M.left + cols.us, y + 4);
    doc.text("RECEITA/MES", M.left + cols.rec, y + 4);
    doc.text("CUSTO/MES", M.left + cols.cus, y + 4);
    doc.text("MARGEM", M.left + cols.mar, y + 4);
    y += 9;
    setDrawColor(HAIR); doc.line(M.left, y - 2, M.right, y - 2);
    setFont("normal", 8.5); setColor(BODY);
    y += 1.5;
    const linhas = [
      { nome: "conservador", c: pf.cenario_conservador },
      { nome: "realista", c: pf.cenario_realista },
      { nome: "otimista", c: pf.cenario_otimista },
    ];
    for (const ln of linhas) {
      if (!ln.c) continue;
      need(LH);
      doc.text(ln.nome, M.left + cols.cen, y);
      doc.text(String(ln.c.usuarios || ""), M.left + cols.us, y);
      doc.text(typeof ln.c.receita_mensal === "number" ? formatBRL(ln.c.receita_mensal) : String(ln.c.receita_mensal || ""), M.left + cols.rec, y);
      doc.text(typeof ln.c.custo_infra === "number" ? formatBRL(ln.c.custo_infra) : String(ln.c.custo_infra || ""), M.left + cols.cus, y);
      doc.text(String(ln.c.margem || ""), M.left + cols.mar, y);
      y += LH;
    }
  }

  function renderRoadmapPDF() {
    tituloSecao("5", "Roadmap");
    const fases = (D.roadmap || []).map(r => ({
      titulo: r.titulo, duracao: r.duracao,
      semanas: parseSemanas(r.duracao), objetivos: r.objetivos || [], entregavel: r.entregavel || "",
    }));
    if (fases.length > 0) {
      const totalSemanas = fases.reduce((s, f) => s + f.semanas, 0);
      const gx0 = M.left + 10, gx1 = M.right, gw = gx1 - gx0, rowH = 5;
      const ganttH = rowH * fases.length + 14;
      need(ganttH);
      const ticks = [0];
      let acc = 0;
      for (const f of fases) { acc += f.semanas; ticks.push(acc); }
      const yEixo = y + 3;
      setDrawColor(HAIR); doc.setLineWidth(0.2);
      for (let xPx = gx0; xPx <= gx1; xPx += 1.5) doc.circle(xPx, yEixo, 0.12, "F");
      setFont("normal", 7.5); setColor(MUTE);
      ticks.forEach((t, i) => {
        const xt = gx0 + (t / totalSemanas) * gw;
        const lab = String(t);
        const wLab = doc.getTextWidth(lab);
        let xLab;
        if (i === 0) xLab = xt;
        else if (i === ticks.length - 1) xLab = xt - wLab;
        else xLab = xt - wLab / 2;
        doc.text(lab, xLab, yEixo - 1.5);
        setDrawColor(MUTE); doc.setLineWidth(0.3);
        doc.line(xt, yEixo - 0.7, xt, yEixo + 0.7);
      });
      let yBarra = yEixo + 4;
      fases.forEach((f, i) => {
        const inicioSem = ticks[i];
        const x0 = gx0 + (inicioSem / totalSemanas) * gw;
        const wBar = (f.semanas / totalSemanas) * gw;
        setFont("bold", 8.5); setColor(INK);
        doc.text(String(i + 1), M.left, yBarra + 2.2);
        setFillColor(NEON); doc.rect(x0, yBarra, wBar, 2.2, "F");
        yBarra += rowH;
      });
      setFont("normal", 7.5); setColor(MUTE);
      const lab = "SEMANAS";
      doc.text(lab, gx0 + gw / 2 - doc.getTextWidth(lab) / 2, yBarra + 2.5);
      y = yBarra + 7;
    }
    fases.forEach((f, i) => {
      need(LH * 5);
      setFont("bold", 9.5); setColor(INK);
      doc.text(`5.${i + 1} ${f.titulo} [${f.duracao}]`, M.left, y);
      y += LH;
      f.objetivos.forEach(o => bulletItem(o));
      if (f.entregavel) {
        const linhasE = doc.splitTextToSize(`=> Entregavel: ${f.entregavel}`, CW);
        for (const le of linhasE) {
          need(LH);
          setFont("normal", 9); setColor(BODY);
          doc.text(le, M.left, y);
          y += LH;
        }
      }
      y += 1.5;
    });
  }

  function renderPlanoExecucao() {
    tituloSecao("6", "Plano de execucao");
    const passos = D.proximos_passos_fila || [];
    subtitulo("6.1 Matriz de execucao");
    fileteNeon(M.left, y - 1, 6);
    setDrawColor(HAIR); doc.line(M.left + 7, y - 1, M.right, y - 1);
    setFont("bold", 8.5); setColor(INK);
    const cols = { step: 0, acao: 14, pronto: 75 };
    doc.text("STEP", M.left + cols.step, y + 4);
    doc.text("ACAO", M.left + cols.acao, y + 4);
    doc.text("DEFINICAO DE PRONTO", M.left + cols.pronto, y + 4);
    y += 9;
    setDrawColor(HAIR); doc.line(M.left, y - 2, M.right, y - 2);
    setFont("normal", 8.5); setColor(BODY);
    y += 1.5;
    const wAcao = cols.pronto - cols.acao - 2;
    const wPronto = CW - cols.pronto - 2;
    passos.forEach(p => {
      const stepStr = String(p.ordem).padStart(2, "0");
      const acaoLinhas = doc.splitTextToSize(p.titulo || "", wAcao);
      const prontoLinhas = doc.splitTextToSize(p.criterio_conclusao || "", wPronto);
      const nLinhas = Math.max(acaoLinhas.length, prontoLinhas.length);
      need(LH * nLinhas + 1);
      for (let i = 0; i < nLinhas; i++) {
        if (i === 0) doc.text(stepStr, M.left + cols.step, y);
        if (acaoLinhas[i]) doc.text(acaoLinhas[i], M.left + cols.acao, y);
        if (prontoLinhas[i]) doc.text(prontoLinhas[i], M.left + cols.pronto, y);
        y += LH;
      }
      y += 0.5;
    });
    y += 3;
    subtitulo("6.2 Detalhamento por etapa");
    passos.forEach(p => {
      need(LH * 5);
      setFont("bold", 9); setColor(INK);
      const stepStr = String(p.ordem).padStart(2, "0");
      doc.text(`STEP ${stepStr}: ${p.titulo}`, M.left, y);
      y += LH;
      if (p.descricao) paragrafo(p.descricao);
      if (p.criterio_conclusao) {
        const linhasC = doc.splitTextToSize(`[OK quando] ${p.criterio_conclusao}`, CW);
        for (const lc of linhasC) {
          need(LH);
          setFont("normal", 9); setColor(ACCENT);
          doc.text(lc, M.left, y);
          y += LH;
        }
      }
      y += 1.5;
    });
  }

  function renderConclusao() {
    tituloSecao("7", "Conclusao");
    const nome = onboarding.nomeSolucao || "A solucao";
    const aberturaConclusao =
      `${nome} apresenta maturidade arquitetural ${MAT.texto}. ` +
      `Esta classificacao reflete o estado atual da arquitetura proposta ` +
      `diante dos vetores de risco e gargalos identificados nas secoes 3 e 4. ` +
      `O numero indica o estagio dentro da faixa "${MAT.categoria}" e nao deve ` +
      `ser lido como nota absoluta, mas como referencia de quanto da fundacao ` +
      `tecnica ja esta no lugar para o proximo salto de escala.`;
    paragrafo(aberturaConclusao);
    if (D.score_narrativa) { y += 1; paragrafo(D.score_narrativa); }
    function pickCritico(arr) {
      if (!arr || !arr.length) return null;
      const critico = arr.find(x => /alta|critic/.test(String(x.severidade || "").toLowerCase()));
      return critico || arr[0];
    }
    const gCrit = pickCritico(D.gargalos);
    const rCrit = pickCritico(D.riscos_fundamentais);
    const ultimaFase = D.roadmap && D.roadmap.length ? D.roadmap[D.roadmap.length - 1] : null;
    const recPorFaixa = {
      Fundacao: "deve tratar a consolidacao da fundacao tecnica como pre-requisito inegociavel antes de qualquer esforco de crescimento",
      Estruturacao: "tem uma base utilizavel, mas precisa endurecer os pontos estruturais antes de acelerar a escala",
      Escala: "esta tecnicamente apta a crescer, mantendo atencao continua aos vetores de carga ja mapeados",
      Maturidade: "apresenta arquitetura madura e pode priorizar otimizacao e diferenciacao competitiva",
    };
    let fechamento = `Em sintese, ${nome} ${recPorFaixa[MAT.categoria] || recPorFaixa.Fundacao}. `;
    if (gCrit) {
      const idx = D.gargalos.indexOf(gCrit) + 1;
      fechamento += `O vetor critico de curto prazo e o gargalo [G-${idx}] ${gCrit.titulo}` +
        (gCrit.quando_aparece ? `, com ponto de inflexao previsto em ${gCrit.quando_aparece}` : "") + ". ";
    }
    if (rCrit) {
      const idx = D.riscos_fundamentais.indexOf(rCrit) + 1;
      fechamento += `No plano estrutural, o maior risco e [R-${idx}] ${rCrit.titulo}, ` +
        `enderecado pela mitigacao descrita na secao 3.3. `;
    }
    if (ultimaFase && ultimaFase.entregavel) {
      fechamento += `Superados esses pontos, o roadmap projeta como horizonte de chegada: ${ultimaFase.entregavel}.`;
    }
    y += 1; paragrafo(fechamento);
    y += 3;
    setFont("italic", 9); setColor(MUTE);
  }

  renderCapa();
  renderPagina1Corpo();
  renderProblema();
  renderSolucao();
  renderDiagnostico();
  renderProjecao();
  renderRoadmapPDF();
  renderPlanoExecucao();
  renderConclusao();
  rodape();

  const slug = (onboarding.nomeSolucao || "Solucao").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");
  doc.save(`Diagnostico_${slug}_SteveArch.pdf`);
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