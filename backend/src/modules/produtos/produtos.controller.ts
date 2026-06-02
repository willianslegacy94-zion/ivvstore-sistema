import { Request, Response } from 'express';
import { pool } from '../../db/pool';

export async function listarProdutos(_req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT id, codigo_barras, descricao, marca,
              preco_custo, preco_venda, estoque_qtd, data_cadastro
       FROM produtos
       WHERE ativo = TRUE
       ORDER BY descricao ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos', detail: String(err) });
  }
}

export async function cadastrarProduto(req: Request, res: Response) {
  try {
    const { codigo_barras, descricao, marca, preco_custo, preco_venda, estoque_qtd } = req.body;

    if (!descricao || preco_venda == null) {
      res.status(400).json({ error: 'descricao e preco_venda são obrigatórios' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO produtos (codigo_barras, descricao, marca, preco_custo, preco_venda, estoque_qtd)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        codigo_barras ?? null,
        descricao,
        marca ?? null,
        preco_custo ?? 0,
        preco_venda,
        estoque_qtd ?? 0,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err: any) {
    // código 23505 = unique_violation (codigo_barras duplicado)
    if (err.code === '23505') {
      res.status(409).json({ error: 'Código de barras já cadastrado' });
      return;
    }
    res.status(500).json({ error: 'Erro ao cadastrar produto', detail: String(err) });
  }
}
