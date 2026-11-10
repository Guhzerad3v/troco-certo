// Calendário do mês.
// Não precisa de rota nova: ele usa os mesmos lançamentos da lista,
// só que agrupados por dia.

function desenharCalendario() {
  const partes = estado.mes.split('-');
  const ano = Number(partes[0]);
  const mes = Number(partes[1]);
  const primeiroDia = new Date(ano, mes - 1, 1).getDay(); // 0 = domingo, 6 = sábado
  const diasNoMes = new Date(ano, mes, 0).getDate();      // o "dia 0" do mês seguinte é o último deste

  // Soma o que entrou e saiu em cada dia: totais['2026-11-05'] = { entrou, saiu, imprevisto }
  const totais = {};
  for (const item of estado.lancamentos) {
    if (!totais[item.data]) {
      totais[item.data] = { entrou: 0, saiu: 0, imprevisto: false };
    }
    if (item.tipo === 'entrada') {
      totais[item.data].entrou += item.valor_centavos;
    } else {
      totais[item.data].saiu += item.valor_centavos; // saídas + imprevistos
    }
    if (item.tipo === 'imprevisto') {
      totais[item.data].imprevisto = true;
    }
  }

  let html = '';

  // quadradinhos vazios antes do dia 1 (para o dia 1 cair no dia da semana certo)
  for (let i = 0; i < primeiroDia; i++) {
    html += '<span class="dia vazio"></span>';
  }

  for (let numero = 1; numero <= diasNoMes; numero++) {
    const data = estado.mes + '-' + dois(numero);
    const total = totais[data] || { entrou: 0, saiu: 0, imprevisto: false };

    let classes = 'dia';
    if (data === hojeTexto()) classes += ' hoje';
    if (data === estado.dia) classes += ' selecionado';

    html += `
      <button type="button" class="${classes}" onclick="clicarDia('${data}')">
        <span class="dia-topo">
          <span class="dia-numero">${numero}</span>
          <span class="dia-imprevisto">${total.imprevisto ? '!' : ''}</span>
        </span>
        <span class="dia-entrou">${total.entrou ? '+' + formatarSemCentavos(total.entrou) : ''}</span>
        <span class="dia-saiu">${total.saiu ? '−' + formatarSemCentavos(total.saiu) : ''}</span>
        <span class="pontinhos">
          <i class="ponto-entrou ${total.entrou ? '' : 'apagado'}"></i>
          <i class="ponto-saiu ${total.saiu ? '' : 'apagado'}"></i>
          <i class="ponto-imprevisto ${total.imprevisto ? '' : 'apagado'}"></i>
        </span>
      </button>`;
  }

  pegar('dias').innerHTML = html;
}

// Clicar num dia escolhe ele; clicar de novo tira a escolha
function clicarDia(data) {
  if (estado.dia === data) {
    estado.dia = null;
  } else {
    estado.dia = data;
  }
  desenharCalendario();
  desenharLista();
  atualizarDataPadrao(); // o formulário passa a lançar nesse dia
}
