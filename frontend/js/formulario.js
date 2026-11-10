// Formulário: criar e editar lançamentos.
// No celular ele vira um painel que sobe de baixo (botão "+ Lançamento").

// Escolhe o tipo (Entrada / Saída / Imprevisto): marca o botão e filtra as categorias
function escolherTipo(tipo) {
  estado.tipo = tipo;
  document.querySelectorAll('[data-tipo]').forEach(function (botao) {
    botao.setAttribute('aria-pressed', botao.dataset.tipo === tipo ? 'true' : 'false');
  });
  preencherCategorias();
}

// Coloca no select só as categorias do tipo escolhido
function preencherCategorias(idEscolhido) {
  let opcoes = '';
  for (const categoria of estado.categorias) {
    if (categoria.tipo === estado.tipo) {
      opcoes += `<option value="${categoria.id}">${escaparHtml(categoria.nome)}</option>`;
    }
  }
  pegar('campo-categoria').innerHTML = opcoes;
  if (idEscolhido) {
    pegar('campo-categoria').value = idEscolhido;
  }
}

// Data que já vem no campo: o dia clicado no calendário, senão hoje
// (se a tela estiver no mês atual), senão o dia 01 do mês da tela
function dataPadrao() {
  if (estado.dia) return estado.dia;
  if (estado.mes === mesDeHoje()) return hojeTexto();
  return estado.mes + '-01';
}

function atualizarDataPadrao() {
  if (!estado.editandoId) {
    pegar('campo-data').value = dataPadrao();
  }
}

// "Editar" (no celular: tocar na linha) joga o lançamento no formulário
function editar(id) {
  const item = estado.lancamentos.find(l => l.id === id);
  if (!item) return;

  estado.editandoId = id;
  escolherTipo(item.tipo);
  preencherCategorias(item.categoria_id);
  pegar('campo-data').value = item.data;
  pegar('campo-descricao').value = item.descricao;
  pegar('campo-valor').value = (item.valor_centavos / 100).toFixed(2).replace('.', ',');

  pegar('form-titulo').textContent = 'Editar lançamento';
  pegar('botao-salvar').textContent = 'Salvar';
  pegar('cancelar-edicao').hidden = false;
  mostrarMensagem('');
  desenharLista(); // para destacar a linha
  abrirFormulario();
}

// Volta o formulário para "Novo lançamento"
function cancelarEdicao() {
  estado.editandoId = null;
  pegar('campo-descricao').value = '';
  pegar('campo-valor').value = '';
  pegar('form-titulo').textContent = 'Novo lançamento';
  pegar('botao-salvar').textContent = 'Adicionar';
  pegar('cancelar-edicao').hidden = true;
  atualizarDataPadrao();
  desenharLista();
}

// Salvar (Adicionar ou Salvar alterações)
pegar('formulario').addEventListener('submit', async function (evento) {
  evento.preventDefault(); // não deixa a página recarregar

  const descricao = pegar('campo-descricao').value;
  const valor = paraCentavos(pegar('campo-valor').value);
  if (!descricao.trim()) {
    mostrarMensagem('Preencha a descrição');
    return;
  }
  if (!(valor > 0)) {
    mostrarMensagem('Digite um valor válido, ex.: 49,90');
    return;
  }

  const dados = {
    categoria_id: Number(pegar('campo-categoria').value),
    descricao,
    valor_centavos: valor,
    data: pegar('campo-data').value,
  };

  try {
    if (estado.editandoId) {
      await editarLancamento(estado.editandoId, dados);
    } else {
      await criarLancamento(dados);
    }
  } catch (erro) {
    mostrarMensagem(erro.message);
    return;
  }

  const eraEdicao = estado.editandoId !== null;
  cancelarEdicao();
  mostrarMensagem(eraEdicao ? 'Alterações salvas!' : 'Pronto, lançamento salvo!');

  // se a data é de outro mês, a tela vai para esse mês
  if (dados.data.slice(0, 7) !== estado.mes) {
    estado.mes = dados.data.slice(0, 7);
    estado.dia = null;
  }
  fecharFormulario();
  await atualizarPainel();
});

// botões Entrada | Saída | Imprevisto
document.querySelectorAll('[data-tipo]').forEach(function (botao) {
  botao.addEventListener('click', function () {
    escolherTipo(botao.dataset.tipo);
  });
});

pegar('cancelar-edicao').addEventListener('click', function () {
  cancelarEdicao();
  mostrarMensagem('');
});

// ---- só no celular: o formulário como painel que sobe de baixo ----
function abrirFormulario() {
  document.body.classList.add('formulario-aberto');
}

function fecharFormulario() {
  document.body.classList.remove('formulario-aberto');
}

pegar('abrir-formulario').addEventListener('click', function () {
  mostrarMensagem('');
  abrirFormulario();
});

pegar('fechar-formulario').addEventListener('click', function () {
  fecharFormulario();
  if (estado.editandoId) cancelarEdicao();
});

pegar('fundo-formulario').addEventListener('click', function () {
  fecharFormulario();
  if (estado.editandoId) cancelarEdicao();
});

escolherTipo('saida');
