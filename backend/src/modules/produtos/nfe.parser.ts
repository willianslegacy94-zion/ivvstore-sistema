import { XMLParser } from 'fast-xml-parser';

export interface ItemNFe {
  xProd: string;
  cEAN: string | null;
  cProd: string;
  qCom: number;
  vUnCom: number;
  lote?: {
    nLote: string;
    dVal: string;    // ISO date YYYY-MM-DD (último dia do mês)
    quantidade: number;
  };
}

// NF-e armazena dVal como "YYYY-MM" — converte para o último dia do mês
function yyyymmToLastDay(yyyymm: string): string {
  const [year, month] = yyyymm.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function normalizeEAN(raw: string): string | null {
  const cleaned = raw.trim();
  // "SEM GTIN" ou string de zeros = sem código de barras
  if (!cleaned || cleaned === 'SEM GTIN' || /^0+$/.test(cleaned)) return null;
  return cleaned;
}

export function parseNFeXML(xmlBuffer: Buffer): ItemNFe[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    // Garante que <det> sempre seja array mesmo com item único
    isArray: (name) => name === 'det' || name === 'rastro',
  });

  const parsed = parser.parse(xmlBuffer.toString('utf-8'));

  // NF-e pode vir encapsulada em <nfeProc> ou ser standalone <NFe>
  const nfe = parsed?.nfeProc?.NFe ?? parsed?.NFe;
  if (!nfe) throw new Error('Estrutura NFe não encontrada no XML');

  const infNFe = nfe.infNFe;
  if (!infNFe?.det) throw new Error('Tag <infNFe> ou <det> não encontrada');

  const detItems: any[] = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

  return detItems.filter(Boolean).map((det): ItemNFe => {
    const prod = det.prod;
    if (!prod) throw new Error('Item <det> sem tag <prod>');

    const qCom = Number(prod.qCom ?? 0);

    // Hierarquia de busca para dados de lote/validade:
    // 1. <rastro> dentro de <prod>                        (padrão NF-e perfumaria)
    // 2. <rastro> dentro de <med> dentro de <prod>        (medicamentos com rastreio)
    // 3. <rastro> dentro de <med> no nível de <det>       (variação rara)
    // 4. <med> direto com nLote/dVal — sem <rastro> filho (XML da IVSSTORE e emissores simplificados)
    const rawSource =
      prod.rastro
      ?? prod.med?.rastro
      ?? det.med?.rastro
      ?? (prod.med?.nLote  ? prod.med  : null)
      ?? (det.med?.nLote   ? det.med   : null);

    const rastro = Array.isArray(rawSource) ? rawSource[0] : rawSource;

    let lote: ItemNFe['lote'] | undefined;
    if (rastro) {
      const nLote = String(rastro.nLote ?? '').trim();
      const dValRaw = String(rastro.dVal ?? '').trim();

      if (nLote && dValRaw) {
        // dVal vem como "YYYY-MM" no padrão NF-e; se já for data completa, usa direto
        const dVal = /^\d{4}-\d{2}$/.test(dValRaw)
          ? yyyymmToLastDay(dValRaw)
          : dValRaw;

        lote = {
          nLote,
          dVal,
          quantidade: Number(rastro.qLote ?? qCom),
        };
      }
    }

    return {
      xProd: String(prod.xProd ?? '').trim(),
      cEAN: normalizeEAN(String(prod.cEAN ?? '')),
      cProd: String(prod.cProd ?? '').trim(),
      qCom,
      vUnCom: Number(prod.vUnCom ?? 0),
      lote,
    };
  });
}
