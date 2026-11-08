-- Troco Certo: consultas de exemplo
-- Para testar, abra database/troco-certo.db no DB Browser for SQLite
-- (aba "Executar SQL") e rode uma consulta por vez.

-- 1. Todos os lançamentos de um mês, com o nome da categoria (JOIN)
SELECT l.data, l.tipo, l.descricao, l.valor_centavos / 100.0 AS valor, c.nome AS categoria
FROM lancamentos AS l
JOIN categorias AS c ON c.id = l.categoria_id
WHERE substr(l.data, 1, 7) = '2026-11'
ORDER BY l.data;

-- 2. Resumo de todos os meses (usa a view)
SELECT mes, entradas / 100.0 AS entradas, saidas / 100.0 AS saidas, imprevistos / 100.0 AS imprevistos
FROM vw_resumo_mensal
ORDER BY mes DESC;

-- 3. Quanto foi gasto em cada categoria (GROUP BY)
SELECT c.nome, COUNT(*) AS quantidade, SUM(l.valor_centavos) / 100.0 AS total
FROM lancamentos AS l
JOIN categorias AS c ON c.id = l.categoria_id
WHERE l.tipo <> 'entrada'
GROUP BY c.id
ORDER BY total DESC;

-- 4. Contas que ainda não foram pagas
SELECT data, descricao, valor_centavos / 100.0 AS valor
FROM lancamentos
WHERE pago = 0
ORDER BY data;

-- 5. Os 5 maiores gastos
SELECT data, descricao, valor_centavos / 100.0 AS valor
FROM lancamentos
WHERE tipo <> 'entrada'
ORDER BY valor_centavos DESC
LIMIT 5;
