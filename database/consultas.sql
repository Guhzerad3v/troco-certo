-- Troco Certo: consultas de exemplo
-- Para testar, abra o banco troco_certo no MySQL Workbench (ou phpMyAdmin)
-- e rode uma consulta por vez. Troque o 1 pelo id do seu usuário.

-- 1. Todos os lançamentos de um mês, com o nome da categoria (JOIN)
SELECT l.data, l.tipo, l.descricao, l.valor_centavos / 100 AS valor, c.nome AS categoria
FROM lancamentos AS l
JOIN categorias AS c ON c.id = l.categoria_id
WHERE l.usuario_id = 1 AND DATE_FORMAT(l.data, '%Y-%m') = '2026-11'
ORDER BY l.data;

-- 2. Resumo de todos os meses (usa a view)
SELECT mes, entradas / 100 AS entradas, saidas / 100 AS saidas, imprevistos / 100 AS imprevistos
FROM vw_resumo_mensal
WHERE usuario_id = 1
ORDER BY mes DESC;

-- 3. Quanto foi gasto em cada categoria (GROUP BY)
SELECT c.nome, COUNT(*) AS quantidade, SUM(l.valor_centavos) / 100 AS total
FROM lancamentos AS l
JOIN categorias AS c ON c.id = l.categoria_id
WHERE l.usuario_id = 1 AND l.tipo <> 'entrada'
GROUP BY c.id, c.nome
ORDER BY total DESC;

-- 4. Quantos lançamentos cada categoria tem (LEFT JOIN mostra também as sem uso)
SELECT c.nome, c.tipo, COUNT(l.id) AS usos
FROM categorias AS c
LEFT JOIN lancamentos AS l ON l.categoria_id = c.id
WHERE c.usuario_id = 1
GROUP BY c.id, c.nome, c.tipo;

-- 5. Os 5 maiores gastos
SELECT data, descricao, valor_centavos / 100 AS valor
FROM lancamentos
WHERE usuario_id = 1 AND tipo <> 'entrada'
ORDER BY valor_centavos DESC
LIMIT 5;

-- 6. Usuários cadastrados (repare que a senha não aparece: só o hash)
SELECT id, nome, email, criado_em FROM usuarios;
