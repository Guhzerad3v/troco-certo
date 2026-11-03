-- Troco Certo: estrutura do banco de dados (SQLite)
--
-- Dinheiro é guardado em CENTAVOS, como número inteiro.
-- Ex.: R$ 12,50 vira 1250. Assim não acontecem erros de arredondamento
-- que aparecem quando se usa número com vírgula (0.1 + 0.2 = 0.30000000000000004).

-- Categorias: agrupam os lançamentos (Salário, Moradia, Conserto...)
CREATE TABLE IF NOT EXISTS categorias (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT    NOT NULL,
  tipo TEXT    NOT NULL CHECK (tipo IN ('entrada', 'saida', 'imprevisto')),
  UNIQUE (nome, tipo)
);