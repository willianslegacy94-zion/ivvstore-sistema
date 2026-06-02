-- =============================================================================
-- IVSSTORE — Migration 001: Schema inicial do MVP
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. USUARIOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL        PRIMARY KEY,
  nome          VARCHAR(120)  NOT NULL,
  email         VARCHAR(180)  NOT NULL UNIQUE,
  senha_hash    TEXT          NOT NULL,
  papel         VARCHAR(20)   NOT NULL DEFAULT 'funcionario'
                              CHECK (papel IN ('admin', 'funcionario')),
  ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. PRODUTOS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
  id              SERIAL          PRIMARY KEY,
  codigo_barras   VARCHAR(20)     UNIQUE,                  -- EAN-8 / EAN-13
  descricao       VARCHAR(255)    NOT NULL,
  marca           VARCHAR(100),
  preco_custo     NUMERIC(12, 2)  NOT NULL DEFAULT 0.00
                                  CHECK (preco_custo >= 0),
  preco_venda     NUMERIC(12, 2)  NOT NULL DEFAULT 0.00
                                  CHECK (preco_venda >= 0),
  estoque_qtd     INTEGER         NOT NULL DEFAULT 0
                                  CHECK (estoque_qtd >= 0),
  data_cadastro   DATE            NOT NULL DEFAULT CURRENT_DATE, -- base para alerta 40 dias
  ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. LOTES_VALIDADE  (perfumaria — um produto pode ter N lotes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lotes_validade (
  id            SERIAL        PRIMARY KEY,
  produto_id    INTEGER       NOT NULL
                              REFERENCES produtos(id) ON DELETE CASCADE,
  lote_codigo   VARCHAR(60)   NOT NULL,
  data_validade DATE          NOT NULL,
  quantidade    INTEGER       NOT NULL DEFAULT 0
                              CHECK (quantidade >= 0),
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. CLIENTES  (grupo WhatsApp / empresas — caderninho digital)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id                          SERIAL        PRIMARY KEY,
  nome                        VARCHAR(150)  NOT NULL,
  whatsapp                    VARCHAR(20)   NOT NULL UNIQUE,
  saldo_devedor               NUMERIC(12,2) NOT NULL DEFAULT 0.00
                                            CHECK (saldo_devedor >= 0),
  dia_vencimento_preferencial SMALLINT      NOT NULL DEFAULT 30
                                            CHECK (dia_vencimento_preferencial IN (15, 30)),
  ativo                       BOOLEAN       NOT NULL DEFAULT TRUE,
  criado_em                   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. CONTAS_A_RECEBER  (histórico do caderninho)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_a_receber (
  id              SERIAL          PRIMARY KEY,
  cliente_id      INTEGER         NOT NULL
                                  REFERENCES clientes(id) ON DELETE RESTRICT,
  valor           NUMERIC(12, 2)  NOT NULL CHECK (valor > 0),
  data_venda      DATE            NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE            NOT NULL,
  status          VARCHAR(10)     NOT NULL DEFAULT 'pendente'
                                  CHECK (status IN ('pendente', 'pago')),
  pago_em         TIMESTAMPTZ,    -- preenchido ao marcar como pago
  observacao      TEXT,
  criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT vencimento_apos_venda CHECK (data_vencimento >= data_venda)
);

-- ---------------------------------------------------------------------------
-- 6. FLUXO_DE_CAIXA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fluxo_de_caixa (
  id              SERIAL          PRIMARY KEY,
  tipo            VARCHAR(10)     NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor           NUMERIC(12, 2)  NOT NULL CHECK (valor > 0),
  data_movimento  DATE            NOT NULL DEFAULT CURRENT_DATE,
  descricao       TEXT,
  referencia_id   INTEGER,        -- uso futuro: FK opcional para contas_a_receber
  criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Alertas de validade (perfumaria) — consultas por "vence em X dias"
CREATE INDEX IF NOT EXISTS idx_lotes_data_validade
  ON lotes_validade (data_validade);

-- Alertas de estoque parado — consultas por "cadastrado há +40 dias"
CREATE INDEX IF NOT EXISTS idx_produtos_data_cadastro
  ON produtos (data_cadastro);

-- Busca rápida por código de barras no PDV
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras
  ON produtos (codigo_barras);

-- Filtro de contas pendentes por vencimento (cobrança do caderninho)
CREATE INDEX IF NOT EXISTS idx_contas_status_vencimento
  ON contas_a_receber (status, data_vencimento);

-- Histórico financeiro por data
CREATE INDEX IF NOT EXISTS idx_fluxo_data_movimento
  ON fluxo_de_caixa (data_movimento);

-- =============================================================================
-- TRIGGER: atualiza atualizado_em automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE TRIGGER trg_produtos_atualizado_em
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE TRIGGER trg_clientes_atualizado_em
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

CREATE TRIGGER trg_contas_atualizado_em
  BEFORE UPDATE ON contas_a_receber
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
