// Login, cadastro, sair, e o começo de tudo (quando a página abre)

// Mostra uma das três telas: 'login', 'cadastro' ou 'app'
function mostrarTela(nome) {
  pegar('tela-login').hidden = nome !== 'login';
  pegar('tela-cadastro').hidden = nome !== 'cadastro';
  pegar('app').hidden = nome !== 'app';
}

// Depois de entrar: mostra o aplicativo e carrega os dados
async function abrirApp(usuario) {
  estado.usuario = usuario;
  pegar('usuario-nome').textContent = usuario.nome;
  mostrarTela('app');
  irPara('painel');
  await atualizarPainel();
}

// ---- Entrar ----
pegar('form-login').addEventListener('submit', async function (evento) {
  evento.preventDefault(); // não deixa a página recarregar
  const email = pegar('login-email').value;
  const senha = pegar('login-senha').value;

  try {
    const usuario = await fazerLogin({ email, senha });
    pegar('login-erro').textContent = '';
    pegar('login-senha').value = '';
    await abrirApp(usuario);
  } catch (erro) {
    pegar('login-erro').textContent = erro.message; // "E-mail ou senha incorretos"
  }
});

// ---- Criar conta ----
pegar('form-cadastro').addEventListener('submit', async function (evento) {
  evento.preventDefault();
  const nome = pegar('cadastro-nome').value;
  const email = pegar('cadastro-email').value;
  const senha = pegar('cadastro-senha').value;

  // as mesmas regras do servidor, para avisar antes de enviar
  let erro = '';
  if (!nome.trim()) erro = 'Preencha o seu nome';
  else if (!email.includes('@')) erro = 'Digite um e-mail válido';
  else if (senha.length < 6) erro = 'A senha precisa de pelo menos 6 caracteres';
  pegar('cadastro-erro').textContent = erro;
  if (erro) return;

  try {
    const usuario = await cadastrar({ nome, email, senha });
    pegar('form-cadastro').reset();
    await abrirApp(usuario);
  } catch (falha) {
    pegar('cadastro-erro').textContent = falha.message;
  }
});

// links "Criar conta" e "Entrar" que trocam entre as duas telas
document.querySelectorAll('[data-trocar-para]').forEach(function (botao) {
  botao.addEventListener('click', function () {
    pegar('login-erro').textContent = '';
    pegar('cadastro-erro').textContent = '';
    mostrarTela(botao.dataset.trocarPara);
  });
});

// ---- Sair (no topo e na tela Configurações) ----
document.querySelectorAll('[data-sair]').forEach(function (botao) {
  botao.addEventListener('click', async function () {
    await fazerLogout();
    estado.usuario = null;
    estado.dia = null;
    cancelarEdicao();
    mostrarTela('login');
  });
});

// ---- Modo demonstração: faixa no topo ----
if (MODO_DEMO) {
  pegar('faixa-demo').hidden = false;
  pegar('restaurar-demo').addEventListener('click', function () {
    restaurarDemo();
    location.reload();
  });
}

// ---- Quando a página abre: se já tem login (cookie), vai direto para o Painel ----
async function iniciar() {
  try {
    const usuario = await buscarEu();
    await abrirApp(usuario);
  } catch (erro) {
    mostrarTela('login');
  }
}

iniciar();
