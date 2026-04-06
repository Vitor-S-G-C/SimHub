import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:senha@localhost:5432/simhub',
})

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id              SERIAL PRIMARY KEY,
      nome            VARCHAR(200)    NOT NULL,
      nome_fantasia   VARCHAR(200)    NOT NULL,
      cnpj            VARCHAR(18)     NOT NULL UNIQUE,
      atualizado_em   TIMESTAMPTZ     NULL,
      atualizado_por  VARCHAR(100)    NULL,
      criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS linhas (
      id              SERIAL PRIMARY KEY,
      numero          VARCHAR(50)     NOT NULL UNIQUE,
      valor_mem       NUMERIC(12,2)   NOT NULL,
      valor_cliente   NUMERIC(12,2)   NOT NULL,
      usuario         VARCHAR(100)    NOT NULL,
      fidelidade      VARCHAR(100)    NOT NULL,
      cliente_id      INT             NOT NULL REFERENCES clientes(id),
      data_pagamento  VARCHAR(10)     NOT NULL,
      conta_linha     VARCHAR(100)    NOT NULL,
      empresa         VARCHAR(200)    NOT NULL,
      ativa           BOOLEAN         NOT NULL DEFAULT TRUE,
      atualizado_em   TIMESTAMPTZ     NULL,
      atualizado_por  VARCHAR(100)    NULL,
      criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contas_receber (
      id              SERIAL PRIMARY KEY,
      linha_id        INT             NULL REFERENCES linhas(id) ON DELETE CASCADE,
      cliente_id      INT             NOT NULL REFERENCES clientes(id),
      valor           NUMERIC(12,2)   NOT NULL,
      data_vencimento VARCHAR(10)     NOT NULL,
      status          VARCHAR(12)     NOT NULL DEFAULT 'aberto'
        CHECK (status IN ('aberto', 'consolidado')),
      criado_em       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS ix_linhas_cliente_id ON linhas(cliente_id);
    CREATE INDEX IF NOT EXISTS ix_contas_cliente_id ON contas_receber(cliente_id);
    CREATE INDEX IF NOT EXISTS ix_contas_linha_id ON contas_receber(linha_id);
    CREATE INDEX IF NOT EXISTS ix_contas_status ON contas_receber(status);
    CREATE INDEX IF NOT EXISTS ix_contas_vencimento ON contas_receber(data_vencimento);
  `)

  console.log('Banco SimHub (PostgreSQL) inicializado com sucesso.')
}

export { pool, initDatabase }
