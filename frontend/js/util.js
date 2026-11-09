// Funções que os outros arquivos usam

let mesSelecionado = mesDeHoje(); // ex.: "2026-11"

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function mesDeHoje() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return hoje.getFullYear() + '-' + mes;
}

// avança ou volta meses: somarMeses('2026-12', 1) dá '2027-01'
function somarMeses(mesTexto, quantidade) {
  const partes = mesTexto.split('-');
  const data = new Date(Number(partes[0]), Number(partes[1]) - 1 + quantidade, 1);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return data.getFullYear() + '-' + mes;
}

// "2026-11" vira "Novembro de 2026"
function nomeDoMes(mesTexto) {
  const partes = mesTexto.split('-');
  return NOMES_MESES[Number(partes[1]) - 1] + ' de ' + partes[0];
}

// 1250 vira "R$ 12,50"
function formatarReais(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "1.234,56" vira 123456
function paraCentavos(texto) {
  if (texto.includes(',')) {
    texto = texto.replaceAll('.', '').replace(',', '.');
  }
  return Math.round(Number(texto) * 100);
}

// impede que o texto digitado vire código HTML na página
function escaparHtml(texto) {
  return texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function mostrarMensagem(texto) {
  document.getElementById('mensagem').textContent = texto;
}

// redesenha a página com os dados do mês selecionado
async function atualizarTela() {
  document.getElementById('mes-atual').textContent = nomeDoMes(mesSelecionado);
  try {
    await carregarLancamentos();
    preencherData();
  } catch (erro) {
    mostrarMensagem('Erro: ' + erro.message);
  }
}

// quando a página termina de carregar, desenha tudo
document.addEventListener('DOMContentLoaded', atualizarTela);
