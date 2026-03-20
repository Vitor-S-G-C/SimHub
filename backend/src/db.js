import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const databasePath = path.join(dataDir, 'simhub.db')
const db = new Database(databasePath)
db.pragma('foreign_keys = ON')

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      nome_fantasia TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS linhas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL UNIQUE,
      valor_mem REAL NOT NULL,
      valor_cliente REAL NOT NULL,
      usuario TEXT NOT NULL,
      fidelidade TEXT NOT NULL,
      cliente_id INTEGER NOT NULL,
      data_pagamento TEXT NOT NULL,
      conta_linha TEXT NOT NULL,
      empresa TEXT NOT NULL,
      ativa INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS contas_receber (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      linha_id INTEGER NOT NULL,
      cliente_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      data_vencimento TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('aberto', 'consolidado')) DEFAULT 'aberto',
      criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (linha_id) REFERENCES linhas(id) ON DELETE CASCADE,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
    );
  `)
}

export { db, initDatabase, databasePath }
