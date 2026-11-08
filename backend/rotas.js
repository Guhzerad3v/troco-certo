// Rotas da API
const banco = require('./banco');

// manda uma resposta em JSON para o navegador
function responder(res, status, dados) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
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

// GET /api/categorias?tipo=saida
function listarCategorias(res, url) {
  const tipo = url.searchParams.get('tipo');
  const categorias = banco.prepare('SELECT id, nome FROM categorias WHERE tipo = ? ORDER BY id').all(tipo);
  responder(res, 200, categorias);
}

// GET /api/lancamentos?mes=2026-11
function listarLancamentos(res, url) {
  const mes = url.searchParams.get('mes');
  const lancamentos = banco.prepare(`
    SELECT l.id, l.tipo, l.descricao, l.valor_centavos, l.data, c.nome AS categoria
    FROM lancamentos l
    JOIN categorias c ON c.id = l.categoria_id
    WHERE substr(l.data, 1, 7) = ?
    ORDER BY l.data DESC
  `).all(mes);
  responder(res, 200, lancamentos);
}

// POST /api/lancamentos
async function criarLancamento(req, res) {
  const dados = await lerCorpo(req);

  if (!dados || !dados.descricao || !dados.data) {
    return responder(res, 400, { erro: 'Preencha todos os campos' });
  }
  if (!(dados.valor_centavos > 0)) {
    return responder(res, 400, { erro: 'O valor precisa ser maior que zero' });
  }

  // os ? são trocados pelos valores com segurança (evita SQL Injection)
  try {
    banco.prepare(`
      INSERT INTO lancamentos (tipo, descricao, valor_centavos, categoria_id, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(dados.tipo, dados.descricao, dados.valor_centavos, dados.categoria_id, dados.data);
  } catch (erro) {
    // o banco recusou: tipo errado, categoria que não existe, data inválida...
    return responder(res, 400, { erro: 'Dados inválidos' });
  }

  responder(res, 201, { ok: true });
}

// escolhe a função certa olhando o método (GET, POST...) e o endereço
async function tratar(req, res, url) {
  const caminho = url.pathname;

  try {
    if (req.method === 'GET' && caminho === '/api/saude') {
      return responder(res, 200, { mensagem: 'Servidor funcionando' });
    }
    if (req.method === 'GET' && caminho === '/api/categorias') {
      return listarCategorias(res, url);
    }
    if (req.method === 'GET' && caminho === '/api/lancamentos') {
      return listarLancamentos(res, url);
    }
    if (req.method === 'POST' && caminho === '/api/lancamentos') {
      return await criarLancamento(req, res);
    }

    responder(res, 404, { erro: 'Rota não encontrada' });
  } catch (erro) {
    console.log(erro);
    responder(res, 500, { erro: 'Erro no servidor' });
  }
}

module.exports = { tratar };
