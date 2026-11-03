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

-- Lançamentos: cada entrada, saída ou imprevisto registrado
CREATE TABLE IF NOT EXISTS lancamentos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo           TEXT    NOT NULL CHECK (tipo IN ('entrada', 'saida', 'imprevisto')),
  descricao      TEXT    NOT NULL CHECK (length(trim(descricao)) > 0),
  valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
  categoria_id   INTEGER NOT NULL REFERENCES categorias (id),
  data           TEXT    NOT NULL CHECK (date(data) = data),
  pago           INTEGER NOT NULL DEFAULT 1 CHECK (pago IN (0, 1)),
  criado_em      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Índice: deixa rápida a busca de lançamentos por data,
-- que é o que mais fazemos (tudo é filtrado por mês)
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos (data);