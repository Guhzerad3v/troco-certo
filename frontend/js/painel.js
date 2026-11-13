// Painel: troca de aba, troca de mês, resumo e o interruptor dos imprevistos

// Mostra 'painel' ou 'config' e marca o botão certo no menu
function irPara(aba) {
  pegar('tela-painel').hidden = aba !== 'painel';
  pegar('tela-config').hidden = aba !== 'config';
  document.body.dataset.aba = aba; // o CSS usa isso para esconder o botão "+ Lançamento" nas Configurações
  document.querySelectorAll('[data-aba]').forEach(function (botao) {
    botao.classList.toggle('ativo', botao.dataset.aba === aba);
  });
}

// Busca tudo do mês no servidor e redesenha a tela inteira
async function atualizarPainel() {
  pegar('mes-atual').textContent = nomeDoMes(estado.mes);
  try {
    estado.lancamentos = await buscarLancamentos(estado.mes);
    estado.resumo = await buscarResumo(estado.mes);
    estado.categorias = await buscarCategorias();
  } catch (erro) {
    if (erro.status === 401) {
      mostrarTela('login'); // o login venceu
      return;
    }
    mostrarMensagem('Erro: ' + erro.message);
    return;
  }
  desenharResumo();
  desenharCalendario();
  desenharLista();
  preencherCategorias();
  atualizarDataPadrao();
  desenharConfiguracoes();
}

// Os 4 números do topo e as notas embaixo deles
function desenharResumo() {
  const r = estado.resumo;
  pegar('saldo').textContent = formatarReais(r.saldo);
  pegar('total-entradas').textContent = formatarReais(r.entradas);
  pegar('total-saidas').textContent = formatarReais(r.saidas);
  pegar('total-imprevistos').textContent = formatarReais(r.imprevistos);

  if (r.incluir_imprevistos) {
    pegar('saldo-nota').textContent = 'entradas − saídas − imprevistos';
    pegar('imprevistos-nota').textContent = 'descontados do saldo';
  } else {
    pegar('saldo-nota').textContent = 'entradas − saídas (imprevistos à parte)';
    pegar('imprevistos-nota').textContent = 'fora do saldo';
  }

  // as notas dos cartões de Entradas e Saídas (aparecem quando o cartão vem para a frente)
  pegar('entradas-nota').textContent =
    'reserva sugerida (' + r.reserva_pct + '%): ' + formatarReais(r.reserva_centavos);
  const quantas = estado.lancamentos.filter(item => item.tipo === 'saida').length;
  pegar('saidas-nota').textContent = quantas === 1 ? '1 lançamento neste mês' : quantas + ' lançamentos neste mês';

  // os dois interruptores (Painel e Configurações) mostram a mesma coisa
  document.querySelectorAll('.interruptor').forEach(function (botao) {
    botao.setAttribute('aria-pressed', r.incluir_imprevistos ? 'true' : 'false');
  });
}

// Carteira: tocar num cartão traz ele para a frente da pilha.
// O JavaScript só troca a classe "frente"; quem move e aumenta o cartão é o CSS.
document.querySelectorAll('.cartao').forEach(function (cartao) {
  cartao.addEventListener('click', function () {
    document.querySelectorAll('.cartao').forEach(function (outro) {
      outro.classList.toggle('frente', outro === cartao);
      outro.setAttribute('aria-expanded', outro === cartao ? 'true' : 'false');
    });
  });
});

// Troca de mês: limpa o dia escolhido e recarrega
function trocarMes(novoMes) {
  estado.mes = novoMes;
  estado.dia = null;
  atualizarPainel();
}

pegar('mes-anterior').addEventListener('click', function () { trocarMes(somarMeses(estado.mes, -1)); });
pegar('mes-seguinte').addEventListener('click', function () { trocarMes(somarMeses(estado.mes, 1)); });
pegar('mes-hoje').addEventListener('click', function () { trocarMes(mesDeHoje()); });

// Interruptor "Descontar os imprevistos do saldo": salva na hora e recalcula
document.querySelectorAll('.interruptor').forEach(function (botao) {
  botao.addEventListener('click', async function () {
    await salvarConfiguracoes({ incluir_imprevistos: !estado.resumo.incluir_imprevistos });
    await atualizarPainel();
  });
});

// Menu (no topo e, no celular, embaixo)
document.querySelectorAll('[data-aba]').forEach(function (botao) {
  botao.addEventListener('click', function () {
    irPara(botao.dataset.aba);
  });
});
