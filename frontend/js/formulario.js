// Formulário de novo lançamento

const campoCategoria = document.getElementById('campo-categoria');

// coloca as categorias no select, separadas por tipo (cada tipo vira um optgroup)
async function carregarCategorias() {
  const categorias = await buscarCategorias();
  const grupos = { entrada: 'Entradas', saida: 'Saídas', imprevisto: 'Imprevistos' };

  let opcoes = '';
  for (const tipo in grupos) {
    opcoes += `<optgroup label="${grupos[tipo]}">`;
    for (const categoria of categorias) {
      if (categoria.tipo === tipo) {
        opcoes += `<option value="${categoria.id}">${categoria.nome}</option>`;
      }
    }
    opcoes += '</optgroup>';
  }
  campoCategoria.innerHTML = opcoes;
}

// o lançamento entra no mês que está na tela: com o dia de hoje, se for o mês atual
function dataDoLancamento() {
  if (mesSelecionado === mesDeHoje()) {
    const dia = String(new Date().getDate()).padStart(2, '0');
    return mesSelecionado + '-' + dia;
  }
  return mesSelecionado + '-01';
}

document.getElementById('formulario').addEventListener('submit', async function (evento) {
  evento.preventDefault(); // não deixa a página recarregar

  const valor = paraCentavos(document.getElementById('campo-valor').value);
  if (!(valor > 0)) {
    mostrarMensagem('Digite um valor válido, ex.: 49,90');
    return;
  }

  try {
    await criarLancamento({
      categoria_id: Number(campoCategoria.value),
      descricao: document.getElementById('campo-descricao').value,
      valor_centavos: valor,
      data: dataDoLancamento(),
    });
  } catch (erro) {
    mostrarMensagem('Erro: ' + erro.message);
    return;
  }

  document.getElementById('campo-descricao').value = '';
  document.getElementById('campo-valor').value = '';
  mostrarMensagem('Pronto, lançamento salvo!');
  atualizarTela();
});

carregarCategorias();
