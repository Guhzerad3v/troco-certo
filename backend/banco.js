// Abre o banco SQLite e cria as tabelas
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const pasta = path.join(__dirname, '..', 'database');
const banco = new DatabaseSync(path.join(pasta, 'troco-certo.db'));

banco.exec('PRAGMA foreign_keys = ON'); // liga a checagem das chaves estrangeiras
banco.exec(fs.readFileSync(path.join(pasta, 'schema.sql'), 'utf8'));
banco.exec(fs.readFileSync(path.join(pasta, 'seed.sql'), 'utf8'));

module.exports = banco;
