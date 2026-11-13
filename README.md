# Troco Certo

Site para organizar o próprio dinheiro de um jeito simples: você anota o que **entrou**, o que **saiu** e os **imprevistos**, e vê o saldo do mês num calendário.

Prévia online, no modo demonstração (explicado no fim deste arquivo): https://troco-certo-crud.vercel.app

## O que o sistema faz

- **Login e cadastro.** Cada pessoa tem a própria conta, e a senha é guardada embaralhada (hash), nunca em texto.
- **Painel do mês.** Mostra uma carteira com quatro cartões (saldo, entradas, saídas e imprevistos), além de um calendário com o que aconteceu em cada dia. Ao clicar num dia, a lista mostra só aquele dia e o formulário passa a lançar nessa data.
- **CRUD de lançamentos.** Dá para criar, ver, editar e excluir. A exclusão pede confirmação com um segundo clique.
- **CRUD de categorias.** Na tela de Configurações dá para criar e apagar categorias. Uma categoria que já tem lançamentos não pode ser apagada.
- **Configurações.**
  - Um interruptor escolhe se os imprevistos entram ou não no saldo.
  - Também dá para definir a porcentagem das entradas que vai para a reserva de imprevistos.
- **Celular.** No celular, o formulário vira um painel que sobe de baixo e o menu fica no rodapé.

## Tecnologias

- **Front-end:** HTML, CSS e JavaScript puros, sem framework. O visual é inspirado na Carteira da Apple e em apps de banco: o resumo do mês é uma pilha de cartões coloridos (tocar num cartão traz ele para a frente), com cartões brancos, barras foscas e o "verde troco" como cor da marca. Tem tema claro e escuro, que segue o aparelho. As cores e medidas ficam em variáveis no começo do `frontend/css/style.css`.
- **Back-end:** Node.js puro, usando os módulos `http`, `fs` e `crypto`. A única biblioteca instalada é a `mysql2`, que conecta o Node ao MySQL.
- **Banco de dados:** MySQL 8.

## Como as partes conversam

```
navegador (frontend/)  --fetch-->  servidor Node (backend/)  --SQL-->  MySQL (database/)
```

1. O navegador nunca fala direto com o banco: ele chama o servidor em endereços como `/api/lancamentos`.
2. O servidor confere quem está logado, valida os dados e monta o SQL.
3. O MySQL guarda tudo. As regras mais importantes também estão no próprio banco, por exemplo: o valor tem de ser maior que zero, e apagar um usuário apaga os dados dele.

## Estrutura das pastas

```
database/
  schema.sql      cria as tabelas e a view do resumo mensal
  seed.sql        as 14 categorias que toda conta nova recebe
  consultas.sql   consultas de exemplo para mostrar na apresentação

backend/
  server.js       liga o servidor e entrega os arquivos do site
  banco.js        conexão com o MySQL (e cria as tabelas na 1ª vez)
  auth.js         senha com hash e cookie de sessão assinado
  rotas.js        todas as rotas /api (cadastro, login, lançamentos...)
  .env.exemplo    modelo das configurações (copie para .env)

frontend/
  index.html      as telas: login, cadastro, painel e configurações
  css/style.css   o visual inteiro (cores em variáveis no começo, celular no fim)
  js/util.js        estado da tela e funções pequenas (formatar R$, datas)
  js/api.js         as chamadas ao servidor (fetch)
  js/api-demo.js    "servidor de mentira" do modo demonstração
  js/painel.js      troca de aba, de mês e o resumo
  js/calendario.js  desenha o calendário
  js/lista.js       a lista de lançamentos e o excluir
  js/formulario.js  criar e editar lançamentos
  js/config.js      reserva, categorias e conta
  js/auth.js        login, cadastro, sair (é o último a carregar)
```

## Como rodar no computador

Você precisa ter o **Node.js 20.6 ou mais novo** (confira com `node --version`) e o **MySQL 8** instalado e ligado.

1. Clone o repositório e entre na pasta do servidor:

   ```bash
   git clone https://github.com/Guhzerad3v/troco-certo.git
   cd troco-certo
   git checkout teste-crud
   cd backend
   ```

2. Instale a dependência (`mysql2`):

   ```bash
   npm install
   ```

3. Crie o arquivo de configuração. Copie o `.env.exemplo` com o nome `.env`:

   ```bash
   cp .env.exemplo .env
   ```

   No Windows, se o comando acima não funcionar, use `copy .env.exemplo .env`.

   Depois, abra o `.env` e coloque a senha do seu MySQL em `DB_SENHA`. Troque também o `SEGREDO_SESSAO` por uma frase qualquer. O `.env` **não vai para o Git**, porque guarda senhas.

4. Ligue o servidor:

   ```bash
   npm start
   ```

   Na primeira vez, ele mesmo cria o banco `troco_certo`, as tabelas e as categorias padrão.

5. Abra **http://localhost:3000** e crie uma conta.

Se aparecer "Não consegui conectar no MySQL", confira se o MySQL está ligado e se a senha do `.env` está certa.

## Modo demonstração (Vercel)

Na Vercel não existe servidor Node nem MySQL, só os arquivos da pasta `frontend/`. Por isso, quando o site abre num endereço `vercel.app`, ele entra sozinho no **modo demonstração**:

- o `api-demo.js` faz o papel do servidor;
- os dados ficam guardados no próprio navegador, no `localStorage`;
- o login aceita qualquer e-mail com uma senha de 6 caracteres ou mais;
- o botão "Restaurar dados de exemplo" volta tudo ao começo.

Para testar esse modo no computador, abra `http://localhost:3000/?demo`.

## Equipe

- Front-end: as telas, o CSS e o JavaScript do navegador.
- Back-end: o servidor Node, as rotas e o login.
- Banco de dados: as tabelas, as regras e as consultas SQL.
