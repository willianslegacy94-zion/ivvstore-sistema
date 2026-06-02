import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { pool } from '../../db/pool';

export async function listarClientes(_req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome, whatsapp, saldo_devedor, dia_vencimento_preferencial, criado_em
       FROM clientes
       WHERE ativo = TRUE
       ORDER BY nome ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes', detail: String(err) });
  }
}

export async function cadastrarCliente(req: Request, res: Response) {
  try {
    const { nome, whatsapp, saldo_devedor, dia_vencimento_preferencial } = req.body;

    if (!nome || !whatsapp) {
      res.status(400).json({ error: 'nome e whatsapp são obrigatórios' });
      return;
    }

    if (![15, 30].includes(Number(dia_vencimento_preferencial))) {
      res.status(400).json({ error: 'dia_vencimento_preferencial deve ser 15 ou 30' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO clientes (nome, whatsapp, saldo_devedor, dia_vencimento_preferencial)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nome, whatsapp, saldo_devedor ?? 0, dia_vencimento_preferencial]
    );

    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'WhatsApp já cadastrado' });
      return;
    }
    res.status(500).json({ error: 'Erro ao cadastrar cliente', detail: String(err) });
  }
}

export async function darBaixa(req: Request, res: Response) {
  const id = Number(req.params.id);
  const valorRecebido = Number(req.body.valor_recebido);

  if (!id || isNaN(valorRecebido) || valorRecebido <= 0) {
    res.status(400).json({ error: 'valor_recebido deve ser maior que zero' });
    return;
  }

  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ nome: string; saldo_devedor: string }>(
      `SELECT nome, saldo_devedor FROM clientes WHERE id = $1 AND ativo = TRUE`,
      [id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    const { nome, saldo_devedor } = rows[0];
    const saldoAnterior = Number(saldo_devedor);
    const novoSaldo     = Math.max(0, +(saldoAnterior - valorRecebido).toFixed(2));

    await client.query(
      `UPDATE clientes SET saldo_devedor = $1, atualizado_em = NOW() WHERE id = $2`,
      [novoSaldo, id]
    );

    await client.query(
      `INSERT INTO fluxo_de_caixa (tipo, valor, descricao, data_movimento)
       VALUES ('entrada', $1, $2, CURRENT_DATE)`,
      [valorRecebido, `Recebimento de acerto - ${nome}`]
    );

    await client.query('COMMIT');

    res.json({
      sucesso:        true,
      nome,
      valor_recebido: valorRecebido,
      saldo_anterior: saldoAnterior,
      novo_saldo:     novoSaldo,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao processar baixa', detail: String(err) });
  } finally {
    client.release();
  }
}

export async function getLembretesCobranca(_req: Request, res: Response) {
  try {
    // Calcula a próxima data de vencimento de cada cliente (dia 15 ou 30 do mês
    // corrente; se já passou, usa o mês seguinte). Retorna quem vence em até 2 dias.
    const { rows } = await pool.query(`
      WITH proximos AS (
        SELECT
          id,
          nome,
          whatsapp,
          saldo_devedor,
          dia_vencimento_preferencial,
          CASE
            WHEN EXTRACT(DAY FROM CURRENT_DATE)::int <= dia_vencimento_preferencial
              THEN (DATE_TRUNC('month', CURRENT_DATE)
                    + (dia_vencimento_preferencial - 1) * INTERVAL '1 day')::date
            ELSE (DATE_TRUNC('month', CURRENT_DATE)
                  + INTERVAL '1 month'
                  + (dia_vencimento_preferencial - 1) * INTERVAL '1 day')::date
          END AS proxima_data_vencimento
        FROM clientes
        WHERE saldo_devedor > 0
          AND ativo = TRUE
      )
      SELECT
        *,
        proxima_data_vencimento - CURRENT_DATE AS dias_para_vencer
      FROM proximos
      WHERE proxima_data_vencimento - CURRENT_DATE BETWEEN 0 AND 2
      ORDER BY proxima_data_vencimento ASC
    `);

    const lembretesComLink = rows.map((cliente) => {
      const saldoFormatado = Number(cliente.saldo_devedor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      const mensagem =
        `Olá ${cliente.nome}! Passando para lembrar que seu acerto na IVSSTORE ` +
        `vence dia ${cliente.dia_vencimento_preferencial} no valor de ${saldoFormatado}. ` +
        `Se precisar da nossa chave Pix, é só avisar!`;

      // Remove tudo que não for dígito e garante o DDI 55 (Brasil)
      const numero = cliente.whatsapp.replace(/\D/g, '');
      const numeroBR = numero.startsWith('55') ? numero : `55${numero}`;

      return {
        ...cliente,
        mensagem_whatsapp: mensagem,
        link_whatsapp: `https://wa.me/${numeroBR}?text=${encodeURIComponent(mensagem)}`,
      };
    });

    res.json(lembretesComLink);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar lembretes', detail: String(err) });
  }
}
