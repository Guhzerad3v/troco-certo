// MODO DEMONSTRAÇÃO (usado só no Vercel)
//
// No Vercel não existe servidor nem MySQL. Então esta função FAZ O PAPEL do
// back-end: recebe o mesmo pedido (método + endereço + dados) e responde igual
// ao backend/rotas.js, só que guardando tudo no localStorage do navegador.
// Assim o resto do front-end nem percebe a diferença.

const CHAVE_DEMO = 'troco-certo-demo';

// Os dados com que a demonstração começa (o exemplo de novembro/2026)
function dadosDeExemplo() {
  const categorias = [
    [1, 'Salário', 'entrada'], [2, 'Freelance', 'entrada'], [3, 'Outros', 'entrada'],
    [4, 'Moradia', 'saida'], [5, 'Alimentação', 'saida'], [6, 'Transporte', 'saida'], [7, 'Saúde', 'saida'],
    [8, 'Lazer', 'saida'], [9, 'Contas', 'saida'], [10, 'Outros', 'saida'],
    [11, 'Saúde', 'imprevisto'], [12, 'Conserto', 'imprevisto'], [13, 'Multa', 'imprevisto'], [14, 'Outros', 'imprevisto'],
  ].map(function (c) {
    return { id: c[0], nome: c[1], tipo: c[2] };
  });

  // [data, descrição, valor em centavos, id da categoria]
  const lancamentos = [
    ['2026-11-03', 'Farmácia', 4590, 7],
    ['2026-11-05', 'Salário', 350000, 1],
    ['2026-11-05', 'Aluguel', 120000, 4],
    ['2026-11-07', 'Mercado', 48990, 5],
    ['2026-11-10', 'Internet', 12990, 9],
    ['2026-11-12', 'Uber', 8000, 6],
    ['2026-11-14', 'Conserto da geladeira', 25000, 12],
    ['2026-11-18', 'Site para cliente', 60000, 2],
    ['2026-11-20', 'Cinema', 6500, 8],
    ['2026-11-22', 'Multa de trânsito', 13040, 13],
    ['2026-10-05', 'Salário', 350000, 1],
    ['2026-10-05', 'Aluguel', 120000, 4],
    ['2026-10-16', 'Mercado', 52300, 5],
  ].map(function (l, i) {
    const categoria = categorias.find(c => c.id === l[3]);
    return { id: i + 1, data: l[0], descricao: l[1], valor_centavos: l[2], categoria_id: l[3], tipo: categoria.tipo };
  });

  return {
    logado: false,
    conta: { nome: 'Ana Souza', email: 'ana@email.com' },
    categorias,
    lancamentos,
    config: { incluir_imprevistos: true, reserva_pct: 10 },
    proximoId: 100,
  };
}

function lerDemo() {
  try {
    const texto = localStorage.getItem(CHAVE_DEMO);
    if (texto) {
      return JSON.parse(texto);
    }
  } catch (erro) {
    // navegador sem localStorage: segue com os dados de exemplo
  }
  return dadosDeExemplo();
}

function guardarDemo(dados) {
  try {
    localStorage.setItem(CHAVE_DEMO, JSON.stringify(dados));
  } catch (erro) {
    // sem localStorage: os dados só duram até recarregar a página
  }
}

// botão "Restaurar dados de exemplo"
function restaurarDemo() {
  try {
    localStorage.removeItem(CHAVE_DEMO);
  } catch (erro) {}
}

// cria um erro igual ao que o api.js cria quando o servidor responde com erro
function falhar(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  throw erro;
}

// Confere um lançamento (mesmas regras do back-end) e descobre o tipo pela categoria
function conferirLancamentoDemo(db, dados) {
  if (!dados.descricao || !dados.descricao.trim()) falhar(400, 'Preencha a descrição');
  if (!(dados.valor_centavos > 0)) falhar(400, 'Digite um valor válido, ex.: 49,90');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data || '')) falhar(400, 'Escolha uma data');
  const categoria = db.categorias.find(c => c.id === dados.categoria_id);
  if (!categoria) falhar(400, 'Escolha uma categoria');
  return {
    tipo: categoria.tipo,
    descricao: dados.descricao.trim(),
    valor_centavos: dados.valor_centavos,
    categoria_id: dados.categoria_id,
    data: dados.data,
  };
}

// O "servidor" da demonstração
async function servidorDemo(metodo, endereco, dados) {
  const db = lerDemo();
  const url = new URL(endereco, location.href);
  const caminho = url.pathname;
  const partes = caminho.split('/');      // '/api/lancamentos/5' vira ['', 'api', 'lancamentos', '5']
  const recurso = partes[2];
  const id = Number(partes[3]);
  dados = dados || {};

  // ---- conta (o login aceita qualquer e-mail com senha de 6+ letras) ----
  if (metodo === 'POST' && caminho === '/api/cadastro') {
    if (!dados.nome || !dados.nome.trim()) falhar(400, 'Preencha o seu nome');
    if (!dados.email || !dados.email.includes('@')) falhar(400, 'Digite um e-mail válido');
    if (!dados.senha || dados.senha.length < 6) falhar(400, 'A senha precisa de pelo menos 6 caracteres');
    db.conta = { nome: dados.nome.trim(), email: dados.email.trim().toLowerCase() };
    db.logado = true;
    guardarDemo(db);
    return db.conta;
  }
  if (metodo === 'POST' && caminho === '/api/login') {
    const email = (dados.email || '').trim().toLowerCase();
    if (!email.includes('@') || !dados.senha || dados.senha.length < 6) falhar(401, 'E-mail ou senha incorretos');
    if (email !== db.conta.email) {
      db.conta = { nome: email.split('@')[0], email };
    }
    db.logado = true;
    guardarDemo(db);
    return db.conta;
  }
  if (metodo === 'POST' && caminho === '/api/logout') {
    db.logado = false;
    guardarDemo(db);
    return { ok: true };
  }
  if (!db.logado) falhar(401, 'Faça login para continuar');

  if (metodo === 'GET' && caminho === '/api/eu') {
    return db.conta;
  }

  // ---- categorias ----
  if (metodo === 'GET' && caminho === '/api/categorias') {
    return db.categorias.map(function (c) {
      const usos = db.lancamentos.filter(l => l.categoria_id === c.id).length;
      return { id: c.id, nome: c.nome, tipo: c.tipo, usos };
    });
  }
  if (metodo === 'POST' && caminho === '/api/categorias') {
    const nome = (dados.nome || '').trim();
    if (!nome) falhar(400, 'Digite o nome da categoria (até 40 letras)');
    if (db.categorias.some(c => c.tipo === dados.tipo && c.nome.toLowerCase() === nome.toLowerCase())) {
      falhar(400, 'Essa categoria já existe');
    }
    db.categorias.push({ id: db.proximoId++, nome, tipo: dados.tipo });
    guardarDemo(db);
    return { ok: true };
  }
  if (metodo === 'DELETE' && recurso === 'categorias') {
    if (db.lancamentos.some(l => l.categoria_id === id)) {
      falhar(400, 'Essa categoria tem lançamentos e não pode ser apagada');
    }
    db.categorias = db.categorias.filter(c => c.id !== id);
    guardarDemo(db);
    return { ok: true };
  }

  // ---- lançamentos ----
  if (metodo === 'GET' && caminho === '/api/lancamentos') {
    const mes = url.searchParams.get('mes');
    return db.lancamentos
      .filter(l => l.data.slice(0, 7) === mes)
      .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
      .map(function (l) {
        const categoria = db.categorias.find(c => c.id === l.categoria_id);
        return Object.assign({}, l, { categoria: categoria ? categoria.nome : '—' });
      });
  }
  if (metodo === 'POST' && caminho === '/api/lancamentos') {
    const novo = conferirLancamentoDemo(db, dados);
    novo.id = db.proximoId++;
    db.lancamentos.push(novo);
    guardarDemo(db);
    return { ok: true };
  }
  if (metodo === 'PUT' && recurso === 'lancamentos') {
    const atualizado = conferirLancamentoDemo(db, dados);
    const indice = db.lancamentos.findIndex(l => l.id === id);
    if (indice === -1) falhar(404, 'Lançamento não encontrado');
    db.lancamentos[indice] = Object.assign({ id }, atualizado);
    guardarDemo(db);
    return { ok: true };
  }
  if (metodo === 'DELETE' && recurso === 'lancamentos') {
    db.lancamentos = db.lancamentos.filter(l => l.id !== id);
    guardarDemo(db);
    return { ok: true };
  }

  // ---- resumo e configurações ----
  if (metodo === 'GET' && caminho === '/api/resumo') {
    const doMes = db.lancamentos.filter(l => l.data.slice(0, 7) === url.searchParams.get('mes'));
    const somar = tipo => doMes.filter(l => l.tipo === tipo).reduce((total, l) => total + l.valor_centavos, 0);
    const entradas = somar('entrada');
    const saidas = somar('saida');
    const imprevistos = somar('imprevisto');
    let saldo = entradas - saidas;
    if (db.config.incluir_imprevistos) {
      saldo = saldo - imprevistos;
    }
    return {
      entradas, saidas, imprevistos, saldo,
      incluir_imprevistos: db.config.incluir_imprevistos,
      reserva_pct: db.config.reserva_pct,
      reserva_centavos: Math.round(entradas * db.config.reserva_pct / 100),
    };
  }
  if (metodo === 'GET' && caminho === '/api/configuracoes') {
    return db.config;
  }
  if (metodo === 'PUT' && caminho === '/api/configuracoes') {
    if (dados.incluir_imprevistos !== undefined) {
      db.config.incluir_imprevistos = !!dados.incluir_imprevistos;
    }
    if (dados.reserva_pct !== undefined) {
      const pct = Number(dados.reserva_pct);
      if (!Number.isInteger(pct) || pct < 0 || pct > 100) falhar(400, 'A reserva vai de 0 a 100');
      db.config.reserva_pct = pct;
    }
    guardarDemo(db);
    return db.config;
  }

  falhar(404, 'Rota não encontrada');
}
