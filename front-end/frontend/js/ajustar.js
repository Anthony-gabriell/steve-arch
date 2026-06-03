// Página de revisão e edição rápida de respostas
let editingPayload = null;

function loadCurrent() {
  const raw = localStorage.getItem('steveOnboarding');
  if (!raw) {
    window.location.href = 'onboarding.html';
    return;
  }
  editingPayload = JSON.parse(raw);
  renderAll();
}

function formatToolsLabel(tools, toolOther) {
  if (!tools || tools.length === 0) return 'Nenhuma';
  if (tools.includes('nenhuma')) return 'Não conheço nenhuma';
  const names = tools.map(t => TOOL_LABELS[t] || t);
  if (toolOther) names.push(toolOther);
  return names.join(', ');
}

function renderAll() {
  const items = [
    { id: 'nomeSolucao', label: 'Nome da solução', value: editingPayload.nomeSolucao || '-', type: 'text' },
    { id: 'step1', label: 'Área de atuação', value: AREA_LABELS[editingPayload.step1] || '-', type: 'area' },
    { id: 'step2', label: 'Problema a resolver', value: editingPayload.step2 || '-', type: 'textarea' },
    { id: 'step3', label: 'Solução pensada', value: editingPayload.step3 || '-', type: 'textarea' },
    { id: 'tools', label: 'Ferramentas que conhece', value: formatToolsLabel(editingPayload.tools, editingPayload.toolOther), type: 'tools' },
    { id: 'step5', label: 'Investimento mensal', value: INVESTMENT_LABELS[editingPayload.step5] || '-', type: 'investment' },
    { id: 'step6', label: 'Usuários atuais', value: USER_LABELS[editingPayload.step6] || '-', type: 'users' },
    { id: 'step7', label: 'Dedicação semanal', value: DEDICATION_LABELS[editingPayload.step7] || '-', type: 'dedication' }
  ];

  document.getElementById('reviewList').innerHTML = items.map(item => `
    <div class="rev-item" data-id="${item.id}" data-type="${item.type}">
      <div class="rev-body">
        <div class="rev-label">${item.label}</div>
        <div class="rev-value">${escapeHtml(item.value)}</div>
      </div>
      <button class="rev-edit" onclick="openEditor('${item.id}','${item.type}')">Editar</button>
    </div>
  `).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function openEditor(id, type) {
  const modal = document.getElementById('editModal');
  const body = document.getElementById('editBody');
  let current;

  if (id === 'tools') current = editingPayload.tools || [];
  else current = editingPayload[id] || '';

  document.getElementById('editTitle').textContent = getFieldLabel(id);

  if (type === 'text') {
    body.innerHTML = `<input type="text" class="aj-input" id="editInput" maxlength="60" value="${escapeHtml(current)}" placeholder="Ex: MeuApp">`;
  } else if (type === 'textarea') {
    body.innerHTML = `<textarea class="aj-textarea" id="editInput" placeholder="Descreva em suas palavras">${escapeHtml(current)}</textarea>`;
  } else if (type === 'area') {
    body.innerHTML = AREAS.map(a => `<div class="aj-opt ${a.value === current ? 'selected' : ''}" data-val="${a.value}" onclick="selectOpt(this)"><span class="aj-icon">${a.icon}</span><div><div class="aj-opt-label">${a.label}</div><div class="aj-opt-sub">${a.sub}</div></div></div>`).join('');
  } else if (type === 'investment') {
    body.innerHTML = INVESTMENTS.map(a => `<div class="aj-opt ${a.value === current ? 'selected' : ''}" data-val="${a.value}" onclick="selectOpt(this)"><div><div class="aj-opt-label">${a.label}</div><div class="aj-opt-sub">${a.sub}</div></div></div>`).join('');
  } else if (type === 'users') {
    body.innerHTML = USERS.map(a => `<div class="aj-opt ${a.value === current ? 'selected' : ''}" data-val="${a.value}" onclick="selectOpt(this)"><span class="aj-icon">${a.icon}</span><div><div class="aj-opt-label">${a.label}</div><div class="aj-opt-sub">${a.sub}</div></div></div>`).join('');
  } else if (type === 'dedication') {
    body.innerHTML = DEDICATION.map(a => `<div class="aj-opt ${a.value === current ? 'selected' : ''}" data-val="${a.value}" onclick="selectOpt(this)"><span class="aj-icon">${a.icon}</span><div><div class="aj-opt-label">${a.label}</div><div class="aj-opt-sub">${a.sub}</div></div></div>`).join('');
  } else if (type === 'tools') {
    const sel = current || [];
    body.innerHTML = TOOLS.map(t => `<div class="aj-opt ${sel.includes(t.value) ? 'selected' : ''}" data-val="${t.value}" onclick="toggleTool(this)"><span class="aj-icon">${t.icon}</span><div><div class="aj-opt-label">${t.label}</div><div class="aj-opt-sub">${t.sub}</div></div></div>`).join('')
      + `<div class="aj-opt ${sel.includes('nenhuma') ? 'selected' : ''}" data-val="nenhuma" onclick="selectOnlyNone(this)"><span class="aj-icon">🔍</span><div><div class="aj-opt-label">Não conheço nenhuma</div></div></div>`;
  }

  modal.dataset.editId = id;
  modal.dataset.editType = type;
  modal.classList.add('open');
}

function getFieldLabel(id) {
  const map = { nomeSolucao: 'Nome da solução', step1: 'Área de atuação', step2: 'Problema', step3: 'Solução pensada', tools: 'Ferramentas', step5: 'Investimento mensal', step6: 'Usuários atuais', step7: 'Dedicação semanal' };
  return map[id] || id;
}

function selectOpt(el) {
  document.querySelectorAll('#editBody .aj-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

function toggleTool(el) {
  const noneEl = document.querySelector('#editBody .aj-opt[data-val="nenhuma"]');
  if (noneEl) noneEl.classList.remove('selected');
  el.classList.toggle('selected');
}

function selectOnlyNone(el) {
  document.querySelectorAll('#editBody .aj-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

function closeEditor() {
  document.getElementById('editModal').classList.remove('open');
}

function saveEditor() {
  const modal = document.getElementById('editModal');
  const id = modal.dataset.editId;
  const type = modal.dataset.editType;

  if (type === 'text' || type === 'textarea') {
    const val = document.getElementById('editInput').value.trim();
    if (!val) { alert('O campo não pode ficar vazio.'); return; }
    editingPayload[id] = val;
  } else if (type === 'tools') {
    const selected = Array.from(document.querySelectorAll('#editBody .aj-opt.selected')).map(e => e.dataset.val);
    if (selected.length === 0) { alert('Selecione pelo menos uma opção.'); return; }
    editingPayload.tools = selected;
    editingPayload.step4 = selected.join(',');
  } else {
    const sel = document.querySelector('#editBody .aj-opt.selected');
    if (!sel) { alert('Selecione uma opção.'); return; }
    editingPayload[id] = sel.dataset.val;
  }

  closeEditor();
  renderAll();
}

function gerarNovaAnalise() {
  // Limpa caches de diagnóstico (novo input vai gerar novo hash)
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('steveDiagnostico_')) localStorage.removeItem(k);
  });
  // Salva payload atualizado
  localStorage.setItem('steveOnboarding', JSON.stringify(editingPayload));
  window.location.href = 'minhas-analises.html';
}

loadCurrent();