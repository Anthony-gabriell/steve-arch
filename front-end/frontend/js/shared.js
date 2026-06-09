// Constantes compartilhadas entre onboarding, dashboard e ajustar
const API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8000/api/v1/diagnostico'
  : 'https://steve-arch-production.up.railway.app/api/v1/diagnostico';

const AREA_LABELS = {
  marketing: 'Marketing Digital',
  financas: 'Finanças e Fintech',
  medicina: 'Medicina e Saúde',
  direito: 'Direito e Legaltech',
  logistica: 'Logística',
  rh: 'Recursos Humanos',
  administrativa: 'Administrativa'
};

const AREAS = [
  {value:'marketing',icon:'📈',label:'Marketing',sub:'Automação, growth, campanhas'},
  {value:'financas',icon:'💹',label:'Finanças',sub:'Fintech, dashboards, controles'},
  {value:'medicina',icon:'🏥',label:'Medicina e Saúde',sub:'Clínicas, telemedicina, gestão'},
  {value:'direito',icon:'⚖️',label:'Direito',sub:'Contratos, compliance, automação jurídica'},
  {value:'logistica',icon:'🚛',label:'Logística',sub:'Rastreamento, rotas, entregas'},
  {value:'rh',icon:'👥',label:'RH',sub:'Recrutamento, onboarding, gestão'},
  {value:'administrativa',icon:'🏢',label:'Administrativa',sub:'Processos internos, operações'}
];

const TOOLS = [
  {value:'lovable',icon:'🛠️',label:'Lovable',sub:'Geração de apps com IA',detail:'Lovable é uma das ferramentas mais eficientes para começar rápido. Ideal para MVPs e protótipos. O gargalo aparece quando o volume de usuários cresce e o banco de dados precisa escalar.'},
  {value:'n8n',icon:'🔗',label:'n8n',sub:'Automação de fluxos',detail:'n8n é referência em automação. Código aberto e muito flexível. Escala bem quando hospedado corretamente. Cuidado com hospedagem para alta demanda simultânea.'},
  {value:'supabase',icon:'🗄️',label:'Supabase',sub:'Banco de dados e auth',detail:'Supabase é uma das melhores escolhas para banco de dados escalável agora. Resolve banco, autenticação e armazenamento em uma plataforma.'},
  {value:'bubble',icon:'💬',label:'Bubble',sub:'No-code web apps',detail:'Bubble permite construir aplicações web complexas sem código. Ótimo para validação. Performance pode ser um gargalo em escala alta sem otimização adequada.'},
  {value:'cursor',icon:'⌨️',label:'Cursor / Replit',sub:'Desenvolvimento com IA',detail:'Ferramentas que aceleram o desenvolvimento com IA. Cursor para devs que já codificam, Replit para quem quer ambiente completo na nuvem.'},
  {value:'make',icon:'⚡',label:'Make / Zapier',sub:'Integração entre sistemas',detail:'Essenciais para conectar ferramentas sem código. Make é mais flexível e barato. Zapier é mais simples e tem mais integrações nativas.'},
  {value:'chatgpt',icon:'🤖',label:'ChatGPT / Claude',sub:'Assistentes de IA',detail:'Ferramentas generalistas de IA. Excelentes para geração de conteúdo, código e análise. Não substituem arquitetura técnica sólida mas aceleram muito o desenvolvimento.'}
];

const INVESTMENTS = [
  {value:'zero',label:'R$ 0',sub:'Somente ferramentas gratuitas'},
  {value:'ate100',label:'Até R$ 100/mês',sub:'Planos básicos de ferramentas'},
  {value:'100a500',label:'R$ 100 a 500/mês',sub:'Infraestrutura em crescimento'},
  {value:'500mais',label:'R$ 500+/mês',sub:'Escala real de infraestrutura'},
  {value:'depois',label:'Definir depois do faturamento',sub:'Calibrar quando já tiver receita'}
];

const USERS = [
  {value:'zero',icon:'🌱',label:'Ainda não lancei',sub:'Estou construindo agora'},
  {value:'1_50',icon:'👤',label:'1 a 50 usuários',sub:'Primeiros usuários validando'},
  {value:'50_500',icon:'👥',label:'50 a 500 usuários',sub:'Crescendo e precisando escalar'},
  {value:'500_5000',icon:'🚀',label:'500 a 5.000 usuários',sub:'Escala exigindo arquitetura sólida'},
  {value:'5000mais',icon:'🌐',label:'5.000+ usuários',sub:'Alta escala com gargalos reais'}
];

const DEDICATION = [
  {value:'menos5h',icon:'⏱️',label:'Menos de 5h por semana',sub:'Projeto paralelo ao trabalho'},
  {value:'5_20h',icon:'⏰',label:'5 a 20h por semana',sub:'Dedicação consistente'},
  {value:'20_40h',icon:'💪',label:'20 a 40h por semana',sub:'Foco quase integral'},
  {value:'fulltime',icon:'🔥',label:'Tempo integral',sub:'100% dedicado ao projeto'}
];

const INVESTMENT_LABELS = {
  zero: 'R$ 0 (somente gratuitas)',
  ate100: 'Até R$ 100/mês',
  '100a500': 'R$ 100 a 500/mês',
  '500mais': 'R$ 500+/mês',
  depois: 'Definir depois do faturamento'
};

const USER_LABELS = {
  zero: 'Ainda não lancei',
  '1_50': '1 a 50 usuários',
  '50_500': '50 a 500 usuários',
  '500_5000': '500 a 5.000 usuários',
  '5000mais': '5.000+ usuários'
};

const DEDICATION_LABELS = {
  menos5h: 'Menos de 5h por semana',
  '5_20h': '5 a 20h por semana',
  '20_40h': '20 a 40h por semana',
  fulltime: 'Tempo integral'
};

const TOOL_LABELS = {
  lovable: 'Lovable',
  n8n: 'n8n',
  supabase: 'Supabase',
  bubble: 'Bubble',
  cursor: 'Cursor / Replit',
  make: 'Make / Zapier',
  chatgpt: 'ChatGPT / Claude',
  nenhuma: 'Não conheço nenhuma'
};

function formatBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function getInputHash(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).slice(0, 32);
}

function limparCacheAnalise() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('steveDiagnostico')) {
      localStorage.removeItem(k);
    }
  });
  localStorage.removeItem('steveOnboarding');
}