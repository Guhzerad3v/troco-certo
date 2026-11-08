// Servidor do Troco Certo (Node.js puro, sem instalar nada)
const http = require('http');
const rotas = require('./rotas');

const PORTA = 3000;

const servidor = http.createServer(async function (req, res) {
  const url = new URL(req.url, 'http://localhost');

  // o que começa com /api vai para o rotas.js
  if (url.pathname.startsWith('/api/')) {
    await rotas.tratar(req, res, url);
  } else {
    res.writeHead(404);
    res.end('Pagina nao encontrada');
  }
});

servidor.listen(PORTA, function () {
  console.log('Troco Certo rodando em http://localhost:' + PORTA);
});
