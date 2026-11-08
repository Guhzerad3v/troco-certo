// Rotas da API

// manda uma resposta em JSON para o navegador
function responder(res, status, dados) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(dados));
}

// escolhe a função certa olhando o método (GET, POST...) e o endereço
async function tratar(req, res, url) {
  const caminho = url.pathname;

  try {
    if (req.method === 'GET' && caminho === '/api/saude') {
      return responder(res, 200, { mensagem: 'Servidor funcionando' });
    }

    responder(res, 404, { erro: 'Rota não encontrada' });
  } catch (erro) {
    console.log(erro);
    responder(res, 500, { erro: 'Erro no servidor' });
  }
}

module.exports = { tratar };
