// Formulário de novo lançamento

const campoTipo = document.getElementById('campo-tipo');
const campoCategoria = document.getElementById('campo-categoria');
const campoData = document.getElementById('campo-data');

// coloca no select as categorias do tipo escolhido
async function carregarCategorias() {
  const categorias = await buscarCategorias(campoTipo.value);
  let opcoes = '';
  for (const categoria of categorias) {
    opcoes += `<option value="${categoria.id}">${categoria.nome}</option>`;
  }
  campoCategoria.innerHTML = opcoes;
}

// sugere uma data dentro do mês que está aberto
function preencherData() {
  if (mesSelecionado === mesDeHoje()) {
    const dia = String(new Date().getDate()).padStart(2, '0');
    campoData.value = mesSelecionado + '-' + dia;
  } else {
    campoData.value = mesSelecionado + '-01';
  }
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
      tipo: campoTipo.value,
      descricao: document.getElementById('campo-descricao').value,
      valor_centavos: valor,
      categoria_id: Number(campoCategoria.value),
      data: campoData.value,
    });
  } catch (erro) {
    mostrarMensagem('Erro: ' + erro.message);
    return;
  }

  document.getElementById('campo-descricao').value = '';
  document.getElementById('campo-valor').value = '';
  mesSelecionado = campoData.value.slice(0, 7); // vai para o mês do lançamento
  mostrarMensagem('Pronto, lançamento salvo!');
  atualizarTela();
});

campoTipo.addEventListener('change', carregarCategorias);
carregarCategorias();
