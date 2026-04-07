import pg from 'pg'
import bcrypt from 'bcryptjs'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1251@localhost:5432/simhub',
  ...(process.env.DATABASE_URL ? { ssl: { rejectUnauthorized: false } } : {}),
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id       SERIAL PRIMARY KEY,
      nome     VARCHAR(200) NOT NULL,
      login    VARCHAR(100) NOT NULL UNIQUE,
      senha    VARCHAR(200) NOT NULL,
      numero   VARCHAR(30)  NOT NULL DEFAULT '',
      contato  VARCHAR(200) NOT NULL DEFAULT '',
      role     VARCHAR(20)  NOT NULL DEFAULT 'coordenacao'
        CHECK (role IN ('admin', 'coordenacao')),
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  // Adicionar colunas numero/contato se não existirem (migração)
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero VARCHAR(30) NOT NULL DEFAULT '';
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contato VARCHAR(200) NOT NULL DEFAULT '';
    END $$;
  `)

  // Adicionar coordenacao_id nas tabelas de dados (migração)
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE clientes ADD COLUMN IF NOT EXISTS coordenacao_id INT NULL REFERENCES usuarios(id);
      ALTER TABLE linhas ADD COLUMN IF NOT EXISTS coordenacao_id INT NULL REFERENCES usuarios(id);
      ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS coordenacao_id INT NULL REFERENCES usuarios(id);
    END $$;
  `)

  // Adicionar coluna tipo em contas_receber (migração)
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'normal';
    END $$;
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS ix_clientes_coordenacao ON clientes(coordenacao_id);
    CREATE INDEX IF NOT EXISTS ix_linhas_coordenacao ON linhas(coordenacao_id);
    CREATE INDEX IF NOT EXISTS ix_contas_coordenacao ON contas_receber(coordenacao_id);
  `)

  // Seed admin padrão — cria ou atualiza credenciais
  const adminExiste = await pool.query("SELECT id FROM usuarios WHERE role = 'admin' LIMIT 1")
  if (adminExiste.rows.length === 0) {
    const senhaHash = await bcrypt.hash('admin##26', 10)
    await pool.query(
      `INSERT INTO usuarios (nome, login, senha, role) VALUES ($1, $2, $3, 'admin')`,
      ['Vitor', 'admin#2026', senhaHash]
    )
    console.log('Usuario admin padrao criado (login: admin#2026)')
  } else {
    // Atualizar login/senha/nome do admin existente
    const senhaHash = await bcrypt.hash('admin##26', 10)
    await pool.query(
      `UPDATE usuarios SET nome = $1, login = $2, senha = $3 WHERE id = $4`,
      ['Vitor', 'admin#2026', senhaHash, adminExiste.rows[0].id]
    )
  }

  console.log('Banco SimHub (PostgreSQL) inicializado com sucesso.')
}

export { pool, initDatabase }
