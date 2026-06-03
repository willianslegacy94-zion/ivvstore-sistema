import { Request, Response } from 'express';
import { pool } from '../../db/pool';

export async function getKpi(_req: Request, res: Response) {
  try {
    const [fluxoRes, caderninhoRes] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS total_entradas,
          COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'),   0) AS total_saidas
        FROM fluxo_de_caixa
      `),
      pool.query(`
        SELECT COALESCE(SUM(saldo_devedor), 0) AS total_a_receber
        FROM clientes WHERE ativo = TRUE AND saldo_devedor > 0
      `),
    ]);

    const totalEntradas = Number(fluxoRes.rows[0].total_entradas);
    const totalSaidas   = Number(fluxoRes.rows[0].total_saidas);

    res.json({
      total_entradas:  totalEntradas,
      total_saidas:    totalSaidas,
      saldo_caixa:     totalEntradas - totalSaidas,
      total_a_receber: Number(caderninhoRes.rows[0].total_a_receber),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar KPIs', detail: String(err) });
  }
}

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
