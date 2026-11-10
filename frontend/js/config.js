// Tela de Configurações: reserva, categorias e conta
// (o interruptor dos imprevistos é o mesmo do Painel: fica no painel.js)

const TITULOS_GRUPOS = { entrada: 'Entradas', saida: 'Saídas', imprevisto: 'Imprevistos' };

function desenharConfiguracoes() {
  const r = estado.resumo;

  // ---- reserva para imprevistos ----
  pegar('reserva-pct').value = r.reserva_pct;
  pegar('reserva-nota').textContent =
    'Em ' + nomeDoMes(estado.mes) + ': ' + formatarReais(r.reserva_centavos) + ' guardados · ' +
    'imprevistos até agora: ' + formatarReais(r.imprevistos) + '.';

  // ---- categorias, em 3 grupos ----
  let html = '';
  for (const tipo of ['entrada', 'saida', 'imprevisto']) {
    html += `<div class="grupo"><span class="rotulo grupo-titulo">${TITULOS_GRUPOS[tipo]}</span><div class="grupo-itens">`;

    for (const categoria of estado.categorias) {
      if (categoria.tipo !== tipo) continue;
      // categoria com lançamentos não pode ser apagada: o ✕ fica desligado
      const emUso = categoria.usos > 0;
      html += `
        <span class="categoria">
          ${escaparHtml(categoria.nome)} <small>${emUso ? categoria.usos + ' lanç.' : ''}</small>
          <button type="button" onclick="apagarCategoria(${categoria.id})" ${emUso ? 'disabled' : ''}
            title="${emUso ? 'Tem lançamentos: não dá para apagar' : 'Apagar categoria'}">✕</button>
        </span>`;
    }

    html += `</div>
      <form class="nova-categoria" onsubmit="adicionarCategoria(event, '${tipo}')">
        <input id="nova-${tipo}" maxlength="40" placeholder="Nova categoria">
        <button type="submit" title="Adicionar">+</button>
      </form>
    </div>`;
  }
  pegar('grupos-categorias').innerHTML = html;

  // ---- conta ----
  if (estado.usuario) {
    pegar('conta-nome').textContent = estado.usuario.nome;
    pegar('conta-email').textContent = estado.usuario.email;
  }
}

// Mudou a porcentagem da reserva: salva e recalcula
pegar('reserva-pct').addEventListener('change', async function () {
  try {
    await salvarConfiguracoes({ reserva_pct: Number(pegar('reserva-pct').value) });
  } catch (erro) {
    alert(erro.message); // "A reserva vai de 0 a 100"
  }
  await atualizarPainel();
});

async function adicionarCategoria(evento, tipo) {
  evento.preventDefault();
  const nome = pegar('nova-' + tipo).value;
  if (!nome.trim()) return;
  try {
    await criarCategoria({ nome, tipo });
  } catch (erro) {
    alert(erro.message); // "Essa categoria já existe"
    return;
  }
  await atualizarPainel();
}

async function apagarCategoria(id) {
  try {
    await excluirCategoria(id);
  } catch (erro) {
    alert(erro.message);
    return;
  }
  await atualizarPainel();
}
