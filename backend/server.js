// Servidor do Troco Certo (Node.js puro, sem instalar nada)
const http = require('http');
const fs = require('fs');
const path = require('path');
const rotas = require('./rotas');
const { prepararBanco } = require('./banco');

const PORTA = 3000;
const PASTA_FRONT = path.join(__dirname, '..', 'frontend');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

// manda para o navegador um arquivo da pasta frontend
function servirArquivo(caminho, res) {
  if (caminho === '/') {
    caminho = '/index.html';
  }
  const arquivo = path.join(PASTA_FRONT, caminho);

  // não deixa pegar arquivos de fora da pasta frontend
  if (!arquivo.startsWith(PASTA_FRONT + path.sep)) {
    res.writeHead(403);
    return res.end('Proibido');
  }

  fs.readFile(arquivo, function (erro, conteudo) {
    if (erro) {
      res.writeHead(404);
      return res.end('Pagina nao encontrada');
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'text/plain' });
    res.end(conteudo);
  });
}

const servidor = http.createServer(async function (req, res) {
  const url = new URL(req.url, 'http://localhost');

  // o que começa com /api vai para o rotas.js
  if (url.pathname.startsWith('/api/')) {
    await rotas.tratar(req, res, url);
  } else {
    servirArquivo(url.pathname, res);
  }
});

// Antes de ligar: confere o .env e prepara o banco (cria as tabelas se precisar)
if (!process.env.DB_NOME || !process.env.SEGREDO_SESSAO) {
  console.log('Falta o arquivo backend/.env. Copie o .env.exemplo para .env e preencha.');
  process.exit(1);
}

prepararBanco()
  .then(function () {
    servidor.listen(PORTA, function () {
      console.log('Troco Certo rodando em http://localhost:' + PORTA);
    });
  })
  .catch(function (erro) {
    console.log('Não consegui conectar no MySQL. Confira se ele está ligado e se o .env está certo.');
    console.log('Detalhe: ' + erro.message);
    process.exit(1);
  });
