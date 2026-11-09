// Resumo do mês e a opção de descontar os imprevistos

function escrever(id, texto) {
  document.getElementById(id).textContent = texto;
}

async function carregarResumo() {
  const resumo = await buscarResumo(mesSelecionado);

  escrever('total-entradas', formatarReais(resumo.entradas));
  escrever('total-saidas', formatarReais(resumo.saidas));
  escrever('total-imprevistos', formatarReais(resumo.imprevistos));
  escrever('saldo', formatarReais(resumo.saldo));

  document.getElementById('incluir-imprevistos').checked = resumo.incluir_imprevistos;
}

document.getElementById('incluir-imprevistos').addEventListener('change', async function (evento) {
  await salvarConfiguracoes({ incluir_imprevistos: evento.target.checked });
  atualizarTela();
});
