-- Troco Certo: dados iniciais
-- "INSERT OR IGNORE" não duplica nada se o dado já existir,
-- então este arquivo pode rodar toda vez que o servidor liga.

INSERT OR IGNORE INTO categorias (nome, tipo) VALUES
  ('Salário', 'entrada'),
  ('Freelance', 'entrada'),
  ('Outros', 'entrada'),
  ('Moradia', 'saida'),
  ('Alimentação', 'saida'),
  ('Transporte', 'saida'),
  ('Saúde', 'saida'),
  ('Lazer', 'saida'),
  ('Contas', 'saida'),
  ('Outros', 'saida'),
  ('Saúde', 'imprevisto'),
  ('Conserto', 'imprevisto'),
  ('Multa', 'imprevisto'),
  ('Outros', 'imprevisto');

-- incluir_imprevistos: 1 = imprevistos descontam do saldo, 0 = ficam de fora
-- reserva_pct: quanto das entradas (%) fica guardado para imprevistos
INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES
  ('incluir_imprevistos', '1'),
  ('reserva_pct', '10');