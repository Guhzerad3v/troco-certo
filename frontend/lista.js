// Lista de lançamentos do mês e botões de trocar o mês

const tabela = document.getElementById('lista-lancamentos');

async function carregarLancamentos() {
  const lancamentos = await buscarLancamentos(mesSelecionado);

  if (lancamentos.length === 0) {
    tabela.innerHTML = '<tr><td>Nada por aqui ainda. Que tal começar cadastrando o seu salário?</td></tr>';
    return;
  }

  let linhas = '';
  for (const item of lancamentos) {
    const data = item.data.split('-'); // ["2026", "11", "05"]

    let sinal = '-';
    if (item.tipo === 'entrada') {
      sinal = '+';
    }

    linhas += `
      <tr>
        <td>${data[2]}/${data[1]}</td>
        <td>${escaparHtml(item.descricao)} <small>${item.categoria}</small></td>
        <td class="valor ${item.tipo}">${sinal} ${formatarReais(item.valor_centavos)}</td>
        <td><button type="button" class="excluir" title="Excluir" onclick="clicarExcluir(${item.id})">✕</button></td>
      </tr>`;
  }
  tabela.innerHTML = linhas;
}

async function clicarExcluir(id) {
  if (confirm('Excluir este lançamento?')) {
    await excluirLancamento(id);
    atualizarTela();
  }
}

document.getElementById('mes-anterior').addEventListener('click', function () {
  mesSelecionado = somarMeses(mesSelecionado, -1);
  atualizarTela();
});

document.getElementById('mes-seguinte').addEventListener('click', function () {
  mesSelecionado = somarMeses(mesSelecionado, 1);
  atualizarTela();
});
