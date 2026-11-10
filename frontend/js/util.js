// Coisas que todos os outros arquivos usam:
// o "estado" da tela e funções pequenas de apoio.

// Tudo o que a tela precisa lembrar fica neste objeto.
const estado = {
  usuario: null,      // quem está logado: { nome, email }
  mes: mesDeHoje(),   // mês na tela, ex.: "2026-11"
  dia: null,          // dia clicado no calendário, ex.: "2026-11-12" (ou null)
  lancamentos: [],    // lançamentos do mês
  categorias: [],     // categorias do usuário
  resumo: null,       // totais, saldo e configurações do mês
  tipo: 'saida',      // tipo escolhido no formulário
  editandoId: null,   // id do lançamento que está no formulário (ou null)
  confirmarId: null,  // id do lançamento esperando o 2º clique no ✕ (ou null)
};

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// atalho para document.getElementById
function pegar(id) {
  return document.getElementById(id);
}

// 5 vira "05"
function dois(numero) {
  return String(numero).padStart(2, '0');
}

// hoje no formato do banco: "2026-11-10"
function hojeTexto() {
  const hoje = new Date();
  return hoje.getFullYear() + '-' + dois(hoje.getMonth() + 1) + '-' + dois(hoje.getDate());
}

// o mês de hoje: "2026-11"
function mesDeHoje() {
  return hojeTexto().slice(0, 7);
}

// anda meses para frente ou para trás: somarMeses('2026-12', 1) dá '2027-01'
function somarMeses(mesTexto, quantidade) {
  const partes = mesTexto.split('-');
  const data = new Date(Number(partes[0]), Number(partes[1]) - 1 + quantidade, 1);
  return data.getFullYear() + '-' + dois(data.getMonth() + 1);
}

// "2026-11" vira "Novembro de 2026"
function nomeDoMes(mesTexto) {
  const partes = mesTexto.split('-');
  return NOMES_MESES[Number(partes[1]) - 1] + ' de ' + partes[0];
}

// "2026-11-05" vira "05/11"
function diaEMes(data) {
  return data.slice(8, 10) + '/' + data.slice(5, 7);
}

// 1250 vira "R$ 12,50"
function formatarReais(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 350000 vira "3.500" (sem centavos, para caber no calendário)
function formatarSemCentavos(centavos) {
  return Math.round(centavos / 100).toLocaleString('pt-BR');
}

// "1.234,56" vira 123456
function paraCentavos(texto) {
  texto = texto.trim();
  if (texto.includes(',')) {
    texto = texto.replaceAll('.', '').replace(',', '.');
  }
  return Math.round(Number(texto) * 100);
}

// impede que o texto digitado vire código HTML na página
function escaparHtml(texto) {
  return texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// escreve um aviso embaixo do formulário
function mostrarMensagem(texto) {
  pegar('mensagem').textContent = texto;
}
