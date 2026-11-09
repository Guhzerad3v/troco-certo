// Conversa com o back-end usando fetch

async function requisitar(metodo, endereco, dados) {
  const opcoes = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
  };
  if (dados) {
    opcoes.body = JSON.stringify(dados);
  }

  const resposta = await fetch(endereco, opcoes);
  const json = await resposta.json();

  // se o servidor respondeu com erro, mostra a mensagem dele
  if (!resposta.ok) {
    throw new Error(json.erro);
  }
  return json;
}

function buscarCategorias(tipo) {
  return requisitar('GET', '/api/categorias?tipo=' + tipo);
}

function buscarLancamentos(mes) {
  return requisitar('GET', '/api/lancamentos?mes=' + mes);
}

function criarLancamento(dados) {
  return requisitar('POST', '/api/lancamentos', dados);
}

function excluirLancamento(id) {
  return requisitar('DELETE', '/api/lancamentos/' + id);
}

function buscarResumo(mes) {
  return requisitar('GET', '/api/resumo?mes=' + mes);
}

function salvarConfiguracoes(dados) {
  return requisitar('PUT', '/api/configuracoes', dados);
}
