-- Troco Certo: dados iniciais
-- "INSERT IGNORE" não duplica nada se o dado já existir,
-- então este arquivo pode rodar toda vez que o servidor liga.

-- As categorias que todo usuário novo ganha (o back-end copia no cadastro)
INSERT IGNORE INTO categorias_padrao (nome, tipo) VALUES
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
