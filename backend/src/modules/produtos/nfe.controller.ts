import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { parseNFeXML, ItemNFe } from './nfe.parser';

export async function importarNFe(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado. Use o campo "arquivo" com um XML de NF-e.' });
    return;
  }

  let itens;
  try {
    itens = parseNFeXML(req.file.buffer);
  } catch (err) {
    res.status(422).json({ error: 'XML inválido ou não reconhecido como NF-e', detail: String(err) });
    return;
  }

  if (itens.length === 0) {
    res.status(422).json({ error: 'Nenhum item <det> encontrado na NF-e' });
    return;
  }

  const client = await pool.connect();
  let cadastrados = 0;
  let atualizados = 0;
  const detalhes: Array<{ descricao: string; acao: 'cadastrado' | 'atualizado'; ean: string | null }> = [];

  try {
    await client.query('BEGIN');

    for (const item of itens) {
      if (!item.xProd || item.qCom <= 0) continue;

      let produtoId: number;

      if (item.cEAN) {
        // Busca por EAN (lookup exato e confiável)
        const found = await client.query<{ id: number }>(
          `SELECT id FROM produtos WHERE codigo_barras = $1 AND ativo = TRUE LIMIT 1`,
          [item.cEAN]
        );

        if (found.rows.length > 0) {
          produtoId = found.rows[0].id;
          await client.query(
            `UPDATE produtos
             SET estoque_qtd   = estoque_qtd + $1,
                 preco_custo   = $2,
                 atualizado_em = NOW()
             WHERE id = $3`,
            [item.qCom, item.vUnCom, produtoId]
          );
          atualizados++;
          detalhes.push({ descricao: item.xProd, acao: 'atualizado', ean: item.cEAN });
        } else {
          produtoId = await inserirNovoProduto(client, item);
          cadastrados++;
          detalhes.push({ descricao: item.xProd, acao: 'cadastrado', ean: item.cEAN });
        }
      } else {
        // Sem EAN: cria novo produto sem código de barras (lojista vincula manualmente depois)
        produtoId = await inserirNovoProduto(client, item);
        cadastrados++;
        detalhes.push({ descricao: item.xProd, acao: 'cadastrado', ean: null });
      }

      // Insere lote de validade se a nota trouxer rastreabilidade
      if (item.lote) {
        await client.query(
          `INSERT INTO lotes_validade (produto_id, lote_codigo, data_validade, quantidade)
           VALUES ($1, $2, $3, $4)`,
          [produtoId, item.lote.nLote, item.lote.dVal, item.lote.quantidade]
        );
      }
    }

    await client.query('COMMIT');

    res.status(200).json({
      sucesso: true,
      total_itens: itens.length,
      produtos_cadastrados: cadastrados,
      produtos_atualizados: atualizados,
      detalhes,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao processar NF-e — rollback executado', detail: String(err) });
  } finally {
    client.release();
  }
}

async function inserirNovoProduto(client: PoolClient, item: ItemNFe): Promise<number> {
  // Margem padrão de 100% sobre o custo — lojista ajusta pelo painel
  const precoVenda = Number((item.vUnCom * 2).toFixed(2));

  const { rows } = await client.query<{ id: number }>(
    `INSERT INTO produtos (codigo_barras, descricao, preco_custo, preco_venda, estoque_qtd)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [item.cEAN, item.xProd, item.vUnCom, precoVenda, item.qCom]
  );
  return rows[0].id;
}
