// Conexão com o MySQL (pacote mysql2)
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// os dados de acesso vêm do arquivo .env
const acesso = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORTA) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_SENHA,
};

// pool = um "estoque" de conexões que as rotas reaproveitam.
// dateStrings faz as datas chegarem como texto "2026-11-05" (sem fuso horário)
const banco = mysql.createPool({ ...acesso, database: process.env.DB_NOME, dateStrings: true });

// Na hora que o servidor liga: cria o banco (se não existir) e roda o schema.sql e o seed.sql.
// multipleStatements deixa rodar vários comandos SQL de uma vez (só nesta conexão).
async function prepararBanco() {
  const conexao = await mysql.createConnection({ ...acesso, multipleStatements: true });
  const pasta = path.join(__dirname, '..', 'database');

  await conexao.query('CREATE DATABASE IF NOT EXISTS `' + process.env.DB_NOME + '`');
  await conexao.query('USE `' + process.env.DB_NOME + '`');
  await conexao.query(fs.readFileSync(path.join(pasta, 'schema.sql'), 'utf8'));
  await conexao.query(fs.readFileSync(path.join(pasta, 'seed.sql'), 'utf8'));
  await conexao.end();
}

module.exports = { banco, prepararBanco };
