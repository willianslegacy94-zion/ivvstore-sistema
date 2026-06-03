import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { pool } from '../../db/pool';

interface ItemVenda {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
}

const FORMAS_VALIDAS = ['dinheiro', 'pix', 'cartao', 'fiado'] as const;
type FormaPagamento = typeof FORMAS_VALIDAS[number];

const FORMA_LABEL: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix:      'Pix',
  cartao:   'Cartão',
  fiado:    'Fiado',
};

export async function registrarVenda(req: Request, res: Response) {
  const { itens, forma_pagamento, cliente_id, data_vencimento } = req.body as {
    itens:            ItemVenda[];
    forma_pagamento:  FormaPagamento;
    cliente_id?:      number;
    data_vencimento?: string;
  };

  if (!Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ error: 'itens é obrigatório e não pode estar vazio' });
    return;
  }

  if (!FORMAS_VALIDAS.includes(forma_pagamento)) {
    res.status(400).json({ error: `forma_pagamento deve ser: ${FORMAS_VALIDAS.join(', ')}` });
    return;
  }

  if (forma_pagamento === 'fiado') {
    if (!cliente_id) {
      res.status(400).json({ error: 'cliente_id é obrigatório para vendas fiado' });
      return;
    }
    if (!data_vencimento) {
      res.status(400).json({ error: 'data_vencimento é obrigatório para vendas fiado' });
      return;
    }
  }

  const total = itens.reduce((acc, item) => acc + item.preco_unitario * item.quantidade, 0);

  if (total <= 0) {
    res.status(400).json({ error: 'Total da venda deve ser maior que zero' });
    return;
  }

  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of itens) {
      const { rows } = await client.query<{ estoque_qtd: number }>(
        `SELECT estoque_qtd FROM produtos WHERE id = $1 AND ativo = TRUE`,
        [item.produto_id],
      );

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: `Produto ${item.produto_id} não encontrado` });
        return;
      }

      if (rows[0].estoque_qtd < item.quantidade) {
        await client.query('ROLLBACK');
        res.status(422).json({ error: `Estoque insuficiente para o produto ${item.produto_id}` });
        return;
      }

      await client.query(
        `UPDATE produtos SET estoque_qtd = estoque_qtd - $1, atualizado_em = NOW() WHERE id = $2`,
        [item.quantidade, item.produto_id],
      );
    }

    if (forma_pagamento !== 'fiado') {
      const descricao = `Venda PDV (${FORMA_LABEL[forma_pagamento]}) — ${itens.length} item(ns)`;
      await client.query(
        `INSERT INTO fluxo_de_caixa (tipo, valor, descricao) VALUES ('entrada', $1, $2)`,
        [total, descricao],
      );
    } else {
      const { rows: cRows } = await client.query<{ nome: string }>(
        `SELECT nome FROM clientes WHERE id = $1 AND ativo = TRUE`,
        [cliente_id],
      );

      if (cRows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Cliente não encontrado' });
        return;
      }

      await client.query(
        `UPDATE clientes SET saldo_devedor = saldo_devedor + $1, atualizado_em = NOW() WHERE id = $2`,
        [total, cliente_id],
      );

      await client.query(
        `INSERT INTO contas_a_receber (cliente_id, valor, data_vencimento)
         VALUES ($1, $2, $3)`,
        [cliente_id, total, data_vencimento],
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      sucesso:          true,
      total:            +total.toFixed(2),
      forma_pagamento,
      itens_processados: itens.length,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao registrar venda', detail: String(err) });
  } finally {
    client.release();
  }
}
