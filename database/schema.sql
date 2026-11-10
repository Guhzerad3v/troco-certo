-- Troco Certo: estrutura do banco de dados (MySQL)
--
-- Dinheiro é guardado em CENTAVOS, como número inteiro.
-- Ex.: R$ 12,50 vira 1250. Assim não acontecem erros de arredondamento.
--
-- Cada usuário só enxerga os próprios dados: lancamentos, categorias e
-- configuracoes têm a coluna usuario_id.

-- Usuários (login)
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(80)  NOT NULL,
  email      VARCHAR(120) NOT NULL UNIQUE,
  senha_hash VARCHAR(200) NOT NULL,             -- nunca a senha, só o "hash" dela
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Modelo de categorias: todo usuário novo ganha uma cópia delas no cadastro
-- (o id guarda a ordem em que elas aparecem na tela)
CREATE TABLE IF NOT EXISTS categorias_padrao (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(40) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'imprevisto')),
  UNIQUE (nome, tipo)
);

-- Categorias de cada usuário (Salário, Moradia, Conserto...)
CREATE TABLE IF NOT EXISTS categorias (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT         NOT NULL,
  nome       VARCHAR(40) NOT NULL,
  tipo       VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'imprevisto')),
  UNIQUE (usuario_id, nome, tipo),
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- Lançamentos: cada entrada, saída ou imprevisto registrado
CREATE TABLE IF NOT EXISTS lancamentos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT         NOT NULL,
  tipo           VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'imprevisto')),
  descricao      VARCHAR(80) NOT NULL CHECK (CHAR_LENGTH(TRIM(descricao)) > 0),
  valor_centavos INT         NOT NULL CHECK (valor_centavos > 0),
  categoria_id   INT         NOT NULL,
  data           DATE        NOT NULL,
  criado_em      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias (id),
  INDEX idx_lancamentos_data (usuario_id, data)   -- deixa rápido o filtro por mês
);

-- Configurações de cada usuário, no formato chave = valor
CREATE TABLE IF NOT EXISTS configuracoes (
  usuario_id INT         NOT NULL,
  chave      VARCHAR(40) NOT NULL,
  valor      VARCHAR(40) NOT NULL,
  PRIMARY KEY (usuario_id, chave),
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- View (consulta salva): totais de cada mês, por usuário.
-- O back-end só faz: SELECT * FROM vw_resumo_mensal WHERE usuario_id = ? AND mes = '2026-11'
CREATE OR REPLACE VIEW vw_resumo_mensal AS
SELECT
  usuario_id,
  DATE_FORMAT(data, '%Y-%m') AS mes,
  SUM(CASE WHEN tipo = 'entrada'    THEN valor_centavos ELSE 0 END) AS entradas,
  SUM(CASE WHEN tipo = 'saida'      THEN valor_centavos ELSE 0 END) AS saidas,
  SUM(CASE WHEN tipo = 'imprevisto' THEN valor_centavos ELSE 0 END) AS imprevistos
FROM lancamentos
GROUP BY usuario_id, mes;
