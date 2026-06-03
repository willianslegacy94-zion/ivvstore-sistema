import { Request, Response } from 'express';
import { pool } from '../../db/pool';

export async function listarFluxo(_req: Request, res: Response) {
  try {
    const { rows: movimentacoes } = await pool.query(`
      SELECT
        id,
        tipo,
        valor,
        descricao,
        data_movimento,
        criado_em
      FROM fluxo_de_caixa
      ORDER BY data_movimento DESC, criado_em DESC
    `);

    const { rows: resumo } = await pool.query(`
      SELECT
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS total_entradas,
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'),   0) AS total_saidas
      FROM fluxo_de_caixa
    `);

    const totalEntradas = Number(resumo[0].total_entradas);
    const totalSaidas   = Number(resumo[0].total_saidas);

    res.json({
      resumo: {
        total_entradas: totalEntradas,
        total_saidas:   totalSaidas,
        saldo:          totalEntradas - totalSaidas,
      },
      movimentacoes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar fluxo de caixa', detail: String(err) });
  }
}

export async function registrarMovimento(req: Request, res: Response) {
  const { tipo, valor, descricao } = req.body;

  if (!['entrada', 'saida'].includes(tipo)) {
    res.status(400).json({ error: 'tipo deve ser "entrada" ou "saida"' });
    return;
  }

  const valorNum = Number(valor);
  if (isNaN(valorNum) || valorNum <= 0) {
    res.status(400).json({ error: 'valor deve ser maior que zero' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO fluxo_de_caixa (tipo, valor, descricao)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tipo, valorNum, descricao?.trim() || null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar movimentação', detail: String(err) });
  }
}
