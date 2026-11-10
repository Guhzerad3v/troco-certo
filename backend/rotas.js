// Rotas da API
// Cada rota é uma função. A função "tratar" (no final) decide qual chamar.
// Com MySQL todas as consultas são "await banco.query(sql, [valores])".
// Os ? continuam lá: o valor nunca é colado no SQL (protege contra SQL Injection).
const { banco } = require('./banco');
const auth = require('./auth');

const TIPOS = ['entrada', 'saida', 'imprevisto'];

// manda uma resposta em JSON para o navegador (e, se vier, um cookie)
function responder(res, status, dados, cookie) {
  const cabecalhos = { 'Content-Type': 'application/json; charset=utf-8' };
  if (cookie) {
    cabecalhos['Set-Cookie'] = cookie;
  }
  res.writeHead(status, cabecalhos);
  res.end(JSON.stringify(dados));
}

// junta os pedaços do corpo da requisição e transforma em objeto
function lerCorpo(req) {
  return new Promise(function (resolve) {
    let texto = '';
    req.on('data', function (pedaco) {
      texto += pedaco;
    });
    req.on('end', function () {
      try {
        resolve(JSON.parse(texto));
      } catch (erro) {
        resolve(null);
      }
    });
  });
}

// =============== CONTA ===============

// POST /api/cadastro   { nome, email, senha }
async function cadastrar(req, res) {
  const dados = await lerCorpo(req);
  if (!dados || !dados.nome || !dados.nome.trim()) {
    return responder(res, 400, { erro: 'Preencha o seu nome' });
  }
  if (!dados.email || !dados.email.includes('@')) {
    return responder(res, 400, { erro: 'Digite um e-mail válido' });
  }
  if (!dados.senha || dados.senha.length < 6) {
    return responder(res, 400, { erro: 'A senha precisa de pelo menos 6 caracteres' });
  }

  const nome = dados.nome.trim();
  const email = dados.email.trim().toLowerCase();

  const [jaExiste] = await banco.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (jaExiste.length > 0) {
    return responder(res, 400, { erro: 'Esse e-mail já tem uma conta' });
  }

  const [resultado] = await banco.query(
    'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
    [nome, email, auth.gerarHash(dados.senha)]
  );
  const id = resultado.insertId;

  // todo usuário novo ganha as categorias padrão e as configurações iniciais
  await banco.query('INSERT INTO categorias (usuario_id, nome, tipo) SELECT ?, nome, tipo FROM categorias_padrao ORDER BY id', [id]);
  await banco.query(
    "INSERT INTO configuracoes (usuario_id, chave, valor) VALUES (?, 'incluir_imprevistos', '1'), (?, 'reserva_pct', '10')",
    [id, id]
  );

  // já entra logado
  responder(res, 201, { nome, email }, auth.cookieDeEntrada(id));
}

// POST /api/login   { email, senha }
async function entrar(req, res) {
  const dados = await lerCorpo(req);
  const email = dados && dados.email ? dados.email.trim().toLowerCase() : '';

  const [linhas] = await banco.query('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?', [email]);
  const usuario = linhas[0];

  // mesma mensagem para "e-mail não existe" e "senha errada": não damos pistas
  if (!usuario || !dados || !dados.senha || !auth.conferirSenha(dados.senha, usuario.senha_hash)) {
    return responder(res, 401, { erro: 'E-mail ou senha incorretos' });
  }
  responder(res, 200, { nome: usuario.nome, email: usuario.email }, auth.cookieDeEntrada(usuario.id));
}

// POST /api/logout
function sair(res) {
  responder(res, 200, { ok: true }, auth.COOKIE_DE_SAIDA);
}

// GET /api/eu   (quem está logado: para o topo e a tela Conta)
async function quemSouEu(res, usuarioId) {
  const [linhas] = await banco.query('SELECT nome, email FROM usuarios WHERE id = ?', [usuarioId]);
  if (linhas.length === 0) {
    return responder(res, 401, { erro: 'Faça login para continuar' }, auth.COOKIE_DE_SAIDA);
  }
  responder(res, 200, linhas[0]);
}

// =============== CATEGORIAS ===============

// GET /api/categorias   (com quantos lançamentos cada uma tem)
async function listarCategorias(res, usuarioId) {
  const [categorias] = await banco.query(`
    SELECT c.id, c.nome, c.tipo, COUNT(l.id) AS usos
    FROM categorias c
    LEFT JOIN lancamentos l ON l.categoria_id = c.id
    WHERE c.usuario_id = ?
    GROUP BY c.id, c.nome, c.tipo
    ORDER BY c.id
  `, [usuarioId]);
  responder(res, 200, categorias);
}

// POST /api/categorias   { nome, tipo }
async function criarCategoria(req, res, usuarioId) {
  const dados = await lerCorpo(req);
  if (!dados || !TIPOS.includes(dados.tipo)) {
    return responder(res, 400, { erro: 'Tipo inválido' });
  }
  if (!dados.nome || !dados.nome.trim() || dados.nome.length > 40) {
    return responder(res, 400, { erro: 'Digite o nome da categoria (até 40 letras)' });
  }
  try {
    await banco.query('INSERT INTO categorias (usuario_id, nome, tipo) VALUES (?, ?, ?)', [usuarioId, dados.nome.trim(), dados.tipo]);
  } catch (erro) {
    // o UNIQUE do banco não deixa repetir nome no mesmo tipo
    return responder(res, 400, { erro: 'Essa categoria já existe' });
  }
  responder(res, 201, { ok: true });
}

// DELETE /api/categorias/5   (só apaga se não tiver lançamentos)
async function excluirCategoria(res, usuarioId, id) {
  const [uso] = await banco.query('SELECT COUNT(*) AS total FROM lancamentos WHERE categoria_id = ?', [id]);
  if (uso[0].total > 0) {
    return responder(res, 400, { erro: 'Essa categoria tem lançamentos e não pode ser apagada' });
  }
  const [resultado] = await banco.query('DELETE FROM categorias WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  if (resultado.affectedRows === 0) {
    return responder(res, 404, { erro: 'Categoria não encontrada' });
  }
  responder(res, 200, { ok: true });
}

// =============== LANÇAMENTOS ===============

// GET /api/lancamentos?mes=2026-11
async function listarLancamentos(res, url, usuarioId) {
  const mes = url.searchParams.get('mes');
  const [lancamentos] = await banco.query(`
    SELECT l.id, l.tipo, l.descricao, l.valor_centavos, l.data, l.categoria_id, c.nome AS categoria
    FROM lancamentos l
    JOIN categorias c ON c.id = l.categoria_id
    WHERE l.usuario_id = ? AND DATE_FORMAT(l.data, '%Y-%m') = ?
    ORDER BY l.data DESC, l.id DESC
  `, [usuarioId, mes]);
  responder(res, 200, lancamentos);
}

// Confere os dados de um lançamento (usado no criar e no editar).
// Devolve uma mensagem de erro, ou null se estiver tudo certo.
// Também descobre o tipo: ele vem da categoria escolhida.
async function conferirLancamento(dados, usuarioId) {
  if (!dados || !dados.descricao || !dados.descricao.trim()) {
    return 'Preencha a descrição';
  }
  if (!(dados.valor_centavos > 0)) {
    return 'Digite um valor válido, ex.: 49,90';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data || '')) {
    return 'Escolha uma data';
  }
  const [linhas] = await banco.query('SELECT tipo FROM categorias WHERE id = ? AND usuario_id = ?', [dados.categoria_id, usuarioId]);
  if (linhas.length === 0) {
    return 'Escolha uma categoria';
  }
  dados.tipo = linhas[0].tipo;
  return null;
}

// POST /api/lancamentos   { categoria_id, descricao, valor_centavos, data }
async function criarLancamento(req, res, usuarioId) {
  const dados = await lerCorpo(req);
  const erro = await conferirLancamento(dados, usuarioId);
  if (erro) {
    return responder(res, 400, { erro });
  }
  try {
    await banco.query(`
      INSERT INTO lancamentos (usuario_id, tipo, descricao, valor_centavos, categoria_id, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [usuarioId, dados.tipo, dados.descricao.trim(), dados.valor_centavos, dados.categoria_id, dados.data]);
  } catch (e) {
    // o banco recusou (por exemplo, 31/02 não é uma data de verdade)
    return responder(res, 400, { erro: 'Dados inválidos' });
  }
  responder(res, 201, { ok: true });
}

// PUT /api/lancamentos/5   (mesmas regras do criar)
async function editarLancamento(req, res, usuarioId, id) {
  const dados = await lerCorpo(req);
  const erro = await conferirLancamento(dados, usuarioId);
  if (erro) {
    return responder(res, 400, { erro });
  }
  let resultado;
  try {
    [resultado] = await banco.query(`
      UPDATE lancamentos
      SET tipo = ?, descricao = ?, valor_centavos = ?, categoria_id = ?, data = ?
      WHERE id = ? AND usuario_id = ?
    `, [dados.tipo, dados.descricao.trim(), dados.valor_centavos, dados.categoria_id, dados.data, id, usuarioId]);
  } catch (e) {
    return responder(res, 400, { erro: 'Dados inválidos' });
  }
  if (resultado.affectedRows === 0) {
    return responder(res, 404, { erro: 'Lançamento não encontrado' });
  }
  responder(res, 200, { ok: true });
}

// DELETE /api/lancamentos/5
async function excluirLancamento(res, usuarioId, id) {
  const [resultado] = await banco.query('DELETE FROM lancamentos WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  if (resultado.affectedRows === 0) {
    return responder(res, 404, { erro: 'Lançamento não encontrado' });
  }
  responder(res, 200, { ok: true });
}

// =============== RESUMO E CONFIGURAÇÕES ===============

// Lê as configurações do usuário e devolve { incluir_imprevistos, reserva_pct }
async function lerConfiguracoes(usuarioId) {
  const [linhas] = await banco.query('SELECT chave, valor FROM configuracoes WHERE usuario_id = ?', [usuarioId]);
  const config = { incluir_imprevistos: true, reserva_pct: 10 };
  for (const linha of linhas) {
    if (linha.chave === 'incluir_imprevistos') config.incluir_imprevistos = linha.valor === '1';
    if (linha.chave === 'reserva_pct') config.reserva_pct = Number(linha.valor);
  }
  return config;
}

async function salvarConfiguracao(usuarioId, chave, valor) {
  // cria a linha, ou atualiza se ela já existir
  await banco.query(
    'INSERT INTO configuracoes (usuario_id, chave, valor) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE valor = ?',
    [usuarioId, chave, valor, valor]
  );
}

// GET /api/resumo?mes=2026-11
async function resumoDoMes(res, url, usuarioId) {
  const mes = url.searchParams.get('mes');

  // a view do banco já soma o mês; se não tem nada no mês, usamos zeros
  const [linhas] = await banco.query(
    'SELECT entradas, saidas, imprevistos FROM vw_resumo_mensal WHERE usuario_id = ? AND mes = ?',
    [usuarioId, mes]
  );
  // o MySQL devolve somas como texto, por isso o Number()
  const entradas = Number(linhas.length ? linhas[0].entradas : 0);
  const saidas = Number(linhas.length ? linhas[0].saidas : 0);
  const imprevistos = Number(linhas.length ? linhas[0].imprevistos : 0);

  const config = await lerConfiguracoes(usuarioId);

  // se a opção estiver ligada, os imprevistos também descontam do saldo
  let saldo = entradas - saidas;
  if (config.incluir_imprevistos) {
    saldo = saldo - imprevistos;
  }

  responder(res, 200, {
    entradas,
    saidas,
    imprevistos,
    saldo,
    incluir_imprevistos: config.incluir_imprevistos,
    reserva_pct: config.reserva_pct,
    reserva_centavos: Math.round(entradas * config.reserva_pct / 100),
  });
}

// GET /api/configuracoes
async function buscarConfiguracoes(res, usuarioId) {
  responder(res, 200, await lerConfiguracoes(usuarioId));
}

// PUT /api/configuracoes   { incluir_imprevistos: true } e/ou { reserva_pct: 15 }
async function salvarConfiguracoes(req, res, usuarioId) {
  const dados = await lerCorpo(req);
  if (!dados) {
    return responder(res, 400, { erro: 'Dados inválidos' });
  }
  if (dados.incluir_imprevistos !== undefined) {
    await salvarConfiguracao(usuarioId, 'incluir_imprevistos', dados.incluir_imprevistos ? '1' : '0');
  }
  if (dados.reserva_pct !== undefined) {
    const pct = Number(dados.reserva_pct);
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
      return responder(res, 400, { erro: 'A reserva vai de 0 a 100' });
    }
    await salvarConfiguracao(usuarioId, 'reserva_pct', String(pct));
  }
  responder(res, 200, await lerConfiguracoes(usuarioId));
}

// =============== QUAL ROTA CHAMAR ===============

async function tratar(req, res, url) {
  const metodo = req.method;
  const caminho = url.pathname;

  // ex.: "/api/lancamentos/5" vira ['', 'api', 'lancamentos', '5']
  const partes = caminho.split('/');
  const recurso = partes[2];
  const id = Number(partes[3]);

  try {
    // ---- rotas abertas (não precisam de login) ----
    if (metodo === 'GET' && caminho === '/api/saude') {
      return responder(res, 200, { mensagem: 'Servidor funcionando' });
    }
    if (metodo === 'POST' && caminho === '/api/cadastro') {
      return await cadastrar(req, res);
    }
    if (metodo === 'POST' && caminho === '/api/login') {
      return await entrar(req, res);
    }
    if (metodo === 'POST' && caminho === '/api/logout') {
      return sair(res);
    }

    // ---- daqui para baixo, só com login ----
    const usuarioId = auth.usuarioDaSessao(req);
    if (!usuarioId) {
      return responder(res, 401, { erro: 'Faça login para continuar' });
    }

    if (metodo === 'GET' && caminho === '/api/eu') {
      return await quemSouEu(res, usuarioId);
    }

    if (metodo === 'GET' && caminho === '/api/categorias') {
      return await listarCategorias(res, usuarioId);
    }
    if (metodo === 'POST' && caminho === '/api/categorias') {
      return await criarCategoria(req, res, usuarioId);
    }
    if (metodo === 'DELETE' && recurso === 'categorias' && id) {
      return await excluirCategoria(res, usuarioId, id);
    }

    if (metodo === 'GET' && caminho === '/api/lancamentos') {
      return await listarLancamentos(res, url, usuarioId);
    }
    if (metodo === 'POST' && caminho === '/api/lancamentos') {
      return await criarLancamento(req, res, usuarioId);
    }
    if (metodo === 'PUT' && recurso === 'lancamentos' && id) {
      return await editarLancamento(req, res, usuarioId, id);
    }
    if (metodo === 'DELETE' && recurso === 'lancamentos' && id) {
      return await excluirLancamento(res, usuarioId, id);
    }

    if (metodo === 'GET' && caminho === '/api/resumo') {
      return await resumoDoMes(res, url, usuarioId);
    }
    if (metodo === 'GET' && caminho === '/api/configuracoes') {
      return await buscarConfiguracoes(res, usuarioId);
    }
    if (metodo === 'PUT' && caminho === '/api/configuracoes') {
      return await salvarConfiguracoes(req, res, usuarioId);
    }

    responder(res, 404, { erro: 'Rota não encontrada' });
  } catch (erro) {
    console.log(erro);
    responder(res, 500, { erro: 'Erro no servidor' });
  }
}

module.exports = { tratar };
