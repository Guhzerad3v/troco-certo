// Conversa com o back-end usando fetch.
//
// No Vercel não tem servidor: lá a página entra no MODO DEMONSTRAÇÃO e quem
// responde é o servidorDemo() do api-demo.js, com dados guardados no navegador.
// (Para testar o modo demonstração no computador, abra a página com ?demo no fim.)
const MODO_DEMO = location.hostname.endsWith('vercel.app') || location.search.includes('demo');

async function requisitar(metodo, endereco, dados) {
  if (MODO_DEMO) {
    return servidorDemo(metodo, endereco, dados);
  }

  const opcoes = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
  };
  if (dados) {
    opcoes.body = JSON.stringify(dados);
  }

  // o cookie de login vai junto sozinho, porque a página e a API estão no mesmo endereço
  const resposta = await fetch(endereco, opcoes);
  const json = await resposta.json();

  // se o servidor respondeu com erro (400, 401, 404...), vira um erro com a mensagem dele
  if (!resposta.ok) {
    const erro = new Error(json.erro);
    erro.status = resposta.status;
    throw erro;
  }
  return json;
}

// ---- conta ----
function cadastrar(dados) { return requisitar('POST', '/api/cadastro', dados); }
function fazerLogin(dados) { return requisitar('POST', '/api/login', dados); }
function fazerLogout() { return requisitar('POST', '/api/logout'); }
function buscarEu() { return requisitar('GET', '/api/eu'); }

// ---- categorias ----
function buscarCategorias() { return requisitar('GET', '/api/categorias'); }
function criarCategoria(dados) { return requisitar('POST', '/api/categorias', dados); }
function excluirCategoria(id) { return requisitar('DELETE', '/api/categorias/' + id); }

// ---- lançamentos ----
function buscarLancamentos(mes) { return requisitar('GET', '/api/lancamentos?mes=' + mes); }
function criarLancamento(dados) { return requisitar('POST', '/api/lancamentos', dados); }
function editarLancamento(id, dados) { return requisitar('PUT', '/api/lancamentos/' + id, dados); }
function excluirLancamento(id) { return requisitar('DELETE', '/api/lancamentos/' + id); }

// ---- resumo e configurações ----
function buscarResumo(mes) { return requisitar('GET', '/api/resumo?mes=' + mes); }
function salvarConfiguracoes(dados) { return requisitar('PUT', '/api/configuracoes', dados); }
