// Senha e sessão (login), só com o módulo crypto que já vem no Node
const crypto = require('crypto');

// ---------- senha ----------

// Nunca guardamos a senha. Guardamos "sal:hash".
// O sal é aleatório: duas pessoas com a mesma senha ficam com hashes diferentes.
function gerarHash(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, sal, 64).toString('hex');
  return sal + ':' + hash;
}

// Faz o mesmo cálculo com a senha digitada e compara com o hash guardado
function conferirSenha(senha, guardado) {
  const [sal, hash] = guardado.split(':');
  const tentativa = crypto.scryptSync(senha, sal, 64).toString('hex');
  return tentativa === hash;
}

// ---------- sessão (cookie) ----------

// O cookie guarda "id.assinatura". A assinatura é calculada com um segredo
// que só o servidor conhece, então ninguém consegue trocar o id na mão.
function assinar(id) {
  return crypto.createHmac('sha256', process.env.SEGREDO_SESSAO).update(String(id)).digest('hex');
}

// HttpOnly: o JavaScript da página não consegue ler o cookie (mais seguro).
// Max-Age: o login vale por 7 dias.
function cookieDeEntrada(id) {
  return 'sessao=' + id + '.' + assinar(id) + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800';
}

// Max-Age=0 apaga o cookie
const COOKIE_DE_SAIDA = 'sessao=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';

// Lê o cookie do pedido e devolve o id do usuário logado (ou null)
function usuarioDaSessao(req) {
  const cookies = (req.headers.cookie || '').split('; ');
  const sessao = cookies.find(c => c.startsWith('sessao='));
  if (!sessao) {
    return null;
  }
  const [id, assinatura] = sessao.slice('sessao='.length).split('.');
  if (!id || assinatura !== assinar(id)) {
    return null; // assinatura errada: cookie falso ou alterado
  }
  return Number(id);
}

module.exports = { gerarHash, conferirSenha, cookieDeEntrada, COOKIE_DE_SAIDA, usuarioDaSessao };
