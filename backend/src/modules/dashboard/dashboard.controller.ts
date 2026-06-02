import { Request, Response } from 'express';
import { pool } from '../../db/pool';

export async function getAlertas(_req: Request, res: Response) {
  try {
    const [validade, encalhe] = await Promise.all([
      // Lotes que vencem nos próximos 30 dias
      pool.query(`
        SELECT
          lv.id,
          lv.lote_codigo,
          lv.data_validade,
          lv.quantidade,
          lv.data_validade - CURRENT_DATE AS dias_para_vencer,
          p.id            AS produto_id,
          p.descricao     AS produto_descricao,
          p.marca         AS produto_marca,
          p.codigo_barras
        FROM lotes_validade lv
        JOIN produtos p ON p.id = lv.produto_id
        WHERE lv.data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
          AND lv.quantidade > 0
        ORDER BY lv.data_validade ASC
      `),

      // Produtos parados há mais de 40 dias com estoque > 0
      pool.query(`
        SELECT
          id,
          codigo_barras,
          descricao,
          marca,
          preco_venda,
          estoque_qtd,
          data_cadastro,
          CURRENT_DATE - data_cadastro AS dias_em_estoque
        FROM produtos
        WHERE data_cadastro <= CURRENT_DATE - INTERVAL '40 days'
          AND estoque_qtd > 0
          AND ativo = TRUE
        ORDER BY data_cadastro ASC
      `),
    ]);

    res.json({
      alertas_validade: validade.rows,
      alertas_encalhe: encalhe.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar alertas', detail: String(err) });
  }
}
