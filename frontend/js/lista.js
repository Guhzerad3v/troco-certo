// Lista de lançamentos: do mês todo ou só do dia escolhido no calendário

const MARCA = { entrada: '+', saida: '−', imprevisto: '!' };

function desenharLista() {
  let itens = estado.lancamentos;
  if (estado.dia) {
    itens = itens.filter(item => item.data === estado.dia);
    pegar('lista-titulo').textContent = 'Lançamentos de ' + diaEMes(estado.dia);
    pegar('ver-mes').hidden = false;
  } else {
    pegar('lista-titulo').textContent = 'Lançamentos do mês';
    pegar('ver-mes').hidden = true;
  }

  if (itens.length === 0) {
    pegar('lista-lancamentos').innerHTML = '<p class="lista-vazia">Nada por aqui ainda. Que tal começar cadastrando o seu salário?</p>';
    return;
  }

  let html = '';
  for (const item of itens) {
    const sinal = item.tipo === 'entrada' ? '+' : '−';
    const emEdicao = item.id === estado.editandoId ? ' em-edicao' : '';

    // 1º clique no ✕ mostra "Excluir?" (no celular "Sim?"); o 2º clique apaga
    let textoExcluir = '✕';
    let classeExcluir = 'excluir';
    if (item.id === estado.confirmarId) {
      textoExcluir = '<span class="so-pc">Excluir?</span><span class="so-celular">Sim?</span>';
      classeExcluir += ' confirmando';
    }

    html += `
      <div class="linha${emEdicao}">
        <span class="marca">${MARCA[item.tipo]}</span>
        <span class="linha-data so-pc">${diaEMes(item.data)}</span>
        <button type="button" class="linha-texto" title="Editar" onclick="editar(${item.id})">
          ${escaparHtml(item.descricao)}
          <small><span class="so-celular">${diaEMes(item.data)} · </span>${escaparHtml(item.categoria)}</small>
        </button>
        <span class="valor valor-${item.tipo}">${sinal} ${formatarReais(item.valor_centavos)}</span>
        <button type="button" class="link so-pc" onclick="editar(${item.id})">Editar</button>
        <button type="button" class="${classeExcluir}" title="Excluir" onclick="clicarExcluir(${item.id})">${textoExcluir}</button>
      </div>`;
  }
  pegar('lista-lancamentos').innerHTML = html;
}

async function clicarExcluir(id) {
  // primeiro clique: só pede confirmação
  if (estado.confirmarId !== id) {
    estado.confirmarId = id;
    desenharLista();
    return;
  }
  // segundo clique: apaga de verdade
  estado.confirmarId = null;
  await excluirLancamento(id);
  if (estado.editandoId === id) {
    cancelarEdicao();
  }
  await atualizarPainel();
}

// "Ver o mês todo": tira o filtro do dia
pegar('ver-mes').addEventListener('click', function () {
  estado.dia = null;
  desenharCalendario();
  desenharLista();
  atualizarDataPadrao();
});

// Clicar em qualquer outro lugar cancela o "Excluir?"
document.addEventListener('click', function (evento) {
  if (estado.confirmarId !== null && !evento.target.closest('.excluir')) {
    estado.confirmarId = null;
    desenharLista();
  }
});
