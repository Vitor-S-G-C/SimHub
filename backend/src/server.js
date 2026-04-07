import cors from 'cors'
import express from 'express'
import { pool, initDatabase } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 8080)

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173']

app.use(cors({ origin: allowedOrigins, credentials: false }))
app.use(express.json())

const mapCliente = (row) => ({
  id: row.id,
  nome: row.nome,
  nomeFantasia: row.nome_fantasia,
  cnpj: row.cnpj,
  atualizadoEm: row.atualizado_em ?? null,
  atualizadoPor: row.atualizado_por ?? null,
})

const mapLinha = (row) => ({
  id: row.id,
  numero: row.numero,
  valorMem: Number(row.valor_mem),
  valorCliente: Number(row.valor_cliente),
  usuario: row.usuario,
  fidelidade: row.fidelidade,
  clienteId: row.cliente_id,
  dataPagamento: row.data_pagamento,
  contaLinha: row.conta_linha,
  empresa: row.empresa,
  ativa: Boolean(row.ativa),
  atualizadoEm: row.atualizado_em ?? null,
  atualizadoPor: row.atualizado_por ?? null,
})

const mapConta = (row) => ({
  id: row.id,
  linhaId: row.linha_id,
  clienteId: row.cliente_id,
  valor: Number(row.valor),
  dataVencimento: row.data_vencimento,
  status: row.status,
})

const sendValidationError = (res, message) => res.status(400).json({ message })

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', db: 'SimHub (PostgreSQL)' })
})

// ────────── CLIENTES ──────────

app.get('/api/clientes', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por FROM clientes ORDER BY id DESC'
    )
    res.json(result.rows.map(mapCliente))
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar clientes.' })
  }
})

app.post('/api/clientes', async (req, res) => {
  const nome = String(req.body?.nome || '').trim()
  const nomeFantasia = String(req.body?.nomeFantasia || '').trim()
  const cnpj = String(req.body?.cnpj || '').trim()
  const documentoDigits = cnpj.replace(/\D/g, '')

  if (!nome || !nomeFantasia || !cnpj) {
    return sendValidationError(res, 'Preencha nome, nome fantasia e CPF ou CNPJ.')
  }

  if (![11, 14].includes(documentoDigits.length)) {
    return sendValidationError(res, 'Informe um CPF ou CNPJ valido.')
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes (nome, nome_fantasia, cnpj)
       VALUES ($1, $2, $3)
       RETURNING id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por`,
      [nome, nomeFantasia, cnpj]
    )

    return res.status(201).json(mapCliente(result.rows[0]))
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || String(error.message).includes('duplicate')) {
      return sendValidationError(res, 'CPF/CNPJ ja cadastrado.')
    }
    return res.status(500).json({ message: 'Erro ao criar cliente.' })
  }
})

app.put('/api/clientes/:id', async (req, res) => {
  const id = Number(req.params.id)
  const nome = String(req.body?.nome || '').trim()
  const nomeFantasia = String(req.body?.nomeFantasia || '').trim()
  const cnpj = String(req.body?.cnpj || '').trim()
  const documentoDigits = cnpj.replace(/\D/g, '')

  if (!id) {
    return sendValidationError(res, 'ID invalido para atualizar cliente.')
  }

  if (!nome || !nomeFantasia || !cnpj) {
    return sendValidationError(res, 'Preencha nome, nome fantasia e CPF ou CNPJ para atualizar.')
  }

  if (![11, 14].includes(documentoDigits.length)) {
    return sendValidationError(res, 'Informe um CPF ou CNPJ valido para atualizar.')
  }

  try {
    const updatedBy = String(req.header('x-user') || 'Sistema').trim() || 'Sistema'
    const updatedAt = new Date().toISOString()

    const result = await pool.query(
      `UPDATE clientes
       SET nome = $1, nome_fantasia = $2, cnpj = $3,
           atualizado_em = $4, atualizado_por = $5
       WHERE id = $6
       RETURNING id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por`,
      [nome, nomeFantasia, cnpj, updatedAt, updatedBy, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente nao encontrado.' })
    }

    return res.json(mapCliente(result.rows[0]))
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || String(error.message).includes('duplicate')) {
      return sendValidationError(res, 'CPF/CNPJ ja cadastrado em outro cliente.')
    }
    return res.status(500).json({ message: 'Erro ao atualizar cliente.' })
  }
})

app.delete('/api/clientes/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de cliente invalido.')

  try {
    const temLinha = await pool.query(
      'SELECT 1 AS existe FROM linhas WHERE cliente_id = $1 LIMIT 1',
      [id]
    )

    if (temLinha.rows.length > 0) {
      return sendValidationError(res, 'Nao e possivel excluir cliente com linhas vinculadas.')
    }

    const result = await pool.query('DELETE FROM clientes WHERE id = $1', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente nao encontrado.' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir cliente.' })
  }
})

// ────────── LINHAS ──────────

app.get('/api/linhas', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
             data_pagamento, conta_linha, empresa, ativa, atualizado_em, atualizado_por
      FROM linhas ORDER BY id DESC
    `)
    res.json(result.rows.map(mapLinha))
  } catch {
    res.status(500).json({ message: 'Erro ao buscar linhas.' })
  }
})

app.post('/api/linhas', async (req, res) => {
  const numero = String(req.body?.numero || '').trim()
  const valorMem = Number(req.body?.valorMem)
  const valorCliente = Number(req.body?.valorCliente)
  const usuario = String(req.body?.usuario || '').trim()
  const fidelidade = String(req.body?.fidelidade || '').trim()
  const clienteId = Number(req.body?.clienteId)
  const dataPagamento = String(req.body?.dataPagamento || '').trim()
  const contaLinha = String(req.body?.contaLinha || '').trim()
  const empresa = String(req.body?.empresa || '').trim()
  const ativa = Boolean(req.body?.ativa)

  if (
    !numero || Number.isNaN(valorMem) || Number.isNaN(valorCliente) ||
    !usuario || !fidelidade || !clienteId || !dataPagamento || !contaLinha || !empresa
  ) {
    return sendValidationError(res, 'Preencha todos os campos da linha.')
  }

  if (valorCliente < valorMem) {
    return sendValidationError(res, 'Valor cliente deve ser maior ou igual ao valor MEM.')
  }

  try {
    const clienteExiste = await pool.query(
      'SELECT id FROM clientes WHERE id = $1', [clienteId]
    )

    if (clienteExiste.rows.length === 0) {
      return sendValidationError(res, 'Cliente informado nao existe.')
    }

    const result = await pool.query(
      `INSERT INTO linhas (numero, valor_mem, valor_cliente, usuario, fidelidade,
        cliente_id, data_pagamento, conta_linha, empresa, ativa)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
                 data_pagamento, conta_linha, empresa, ativa, atualizado_em, atualizado_por`,
      [numero, valorMem, valorCliente, usuario, fidelidade,
       clienteId, dataPagamento, contaLinha, empresa, ativa]
    )

    return res.status(201).json(mapLinha(result.rows[0]))
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || String(error.message).includes('duplicate')) {
      return sendValidationError(res, 'Numero de linha ja cadastrado.')
    }
    return res.status(500).json({ message: 'Erro ao criar linha.' })
  }
})

app.put('/api/linhas/:id', async (req, res) => {
  const id = Number(req.params.id)
  const numero = String(req.body?.numero || '').trim()
  const valorMem = Number(req.body?.valorMem)
  const valorCliente = Number(req.body?.valorCliente)
  const usuario = String(req.body?.usuario || '').trim()
  const fidelidade = String(req.body?.fidelidade || '').trim()
  const clienteId = Number(req.body?.clienteId)
  const dataPagamento = String(req.body?.dataPagamento || '').trim()
  const contaLinha = String(req.body?.contaLinha || '').trim()
  const empresa = String(req.body?.empresa || '').trim()
  const ativa = Boolean(req.body?.ativa)

  if (!id) {
    return sendValidationError(res, 'ID invalido para atualizar linha.')
  }

  if (
    !numero || Number.isNaN(valorMem) || Number.isNaN(valorCliente) ||
    !usuario || !fidelidade || !clienteId || !dataPagamento || !contaLinha || !empresa
  ) {
    return sendValidationError(res, 'Preencha todos os campos obrigatorios para atualizar a linha.')
  }

  if (valorMem < 0 || valorCliente <= 0) {
    return sendValidationError(res, 'Informe valores validos para MEM e valor cliente.')
  }

  if (valorCliente < valorMem) {
    return sendValidationError(res, 'Valor cliente deve ser maior ou igual ao valor MEM.')
  }

  try {
    const clienteExiste = await pool.query(
      'SELECT id FROM clientes WHERE id = $1', [clienteId]
    )

    if (clienteExiste.rows.length === 0) {
      return sendValidationError(res, 'Cliente informado nao existe.')
    }

    const updatedBy = String(req.header('x-user') || 'Sistema').trim() || 'Sistema'
    const updatedAt = new Date().toISOString()

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const updateResult = await client.query(
        `UPDATE linhas
         SET numero = $1, valor_mem = $2, valor_cliente = $3,
             usuario = $4, fidelidade = $5, cliente_id = $6,
             data_pagamento = $7, conta_linha = $8, empresa = $9,
             ativa = $10, atualizado_em = $11, atualizado_por = $12
         WHERE id = $13`,
        [numero, valorMem, valorCliente, usuario, fidelidade, clienteId,
         dataPagamento, contaLinha, empresa, ativa, updatedAt, updatedBy, id]
      )

      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ message: 'Linha nao encontrada.' })
      }

      await client.query(
        `UPDATE contas_receber
         SET cliente_id = $1, valor = $2, data_vencimento = $3
         WHERE linha_id = $4 AND status = 'aberto'`,
        [clienteId, valorCliente, dataPagamento, id]
      )

      await client.query('COMMIT')

      const row = await pool.query(
        `SELECT id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
                data_pagamento, conta_linha, empresa, ativa, atualizado_em, atualizado_por
         FROM linhas WHERE id = $1`,
        [id]
      )

      return res.json(mapLinha(row.rows[0]))
    } catch (txError) {
      await client.query('ROLLBACK')
      throw txError
    } finally {
      client.release()
    }
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || String(error.message).includes('duplicate')) {
      return sendValidationError(res, 'Numero de linha ja existe em outro cadastro.')
    }
    return res.status(500).json({ message: 'Erro ao atualizar linha.' })
  }
})

app.delete('/api/linhas/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de linha invalido.')

  try {
    const result = await pool.query('DELETE FROM linhas WHERE id = $1', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Linha nao encontrada.' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir linha.' })
  }
})

// ────────── CONTAS ──────────

app.get('/api/contas', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, linha_id, cliente_id, valor, data_vencimento, status FROM contas_receber ORDER BY id DESC'
    )
    res.json(result.rows.map(mapConta))
  } catch {
    res.status(500).json({ message: 'Erro ao buscar contas.' })
  }
})

app.post('/api/contas', async (req, res) => {
  const clienteId = Number(req.body?.clienteId)
  const valor = Number(req.body?.valor)
  const dataVencimento = String(req.body?.dataVencimento || '').trim()

  if (!clienteId) {
    return sendValidationError(res, 'Cliente invalido para a conta.')
  }

  if (Number.isNaN(valor) || valor <= 0) {
    return sendValidationError(res, 'Valor invalido para a conta.')
  }

  if (!dataVencimento) {
    return sendValidationError(res, 'Data de vencimento invalida.')
  }

  try {
    const clienteExiste = await pool.query(
      'SELECT id FROM clientes WHERE id = $1', [clienteId]
    )

    if (clienteExiste.rows.length === 0) {
      return sendValidationError(res, 'Cliente informado nao existe.')
    }

    const result = await pool.query(
      `INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status)
       VALUES (NULL, $1, $2, $3, 'aberto')
       RETURNING id, linha_id, cliente_id, valor, data_vencimento, status`,
      [clienteId, valor, dataVencimento]
    )

    return res.status(201).json(mapConta(result.rows[0]))
  } catch {
    return res.status(500).json({ message: 'Erro ao criar conta.' })
  }
})

app.patch('/api/contas/:id/consolidar', async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de conta invalido.')

  try {
    const result = await pool.query(
      `UPDATE contas_receber SET status = 'consolidado' WHERE id = $1
       RETURNING id, linha_id, cliente_id, valor, data_vencimento, status`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Conta nao encontrada.' })
    }

    return res.json(mapConta(result.rows[0]))
  } catch {
    return res.status(500).json({ message: 'Erro ao consolidar conta.' })
  }
})

app.delete('/api/contas/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de conta invalido.')

  try {
    const result = await pool.query('DELETE FROM contas_receber WHERE id = $1', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Conta nao encontrada.' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir conta.' })
  }
})

app.patch('/api/contas/:id', async (req, res) => {
  const id = Number(req.params.id)
  const dataVencimento = String(req.body?.dataVencimento || '').trim()
  const valor = Number(req.body?.valor)

  if (!id) return sendValidationError(res, 'ID de conta invalido.')
  if (!dataVencimento) return sendValidationError(res, 'Data de vencimento invalida.')
  if (Number.isNaN(valor) || valor <= 0) return sendValidationError(res, 'Valor invalido.')

  try {
    const result = await pool.query(
      `UPDATE contas_receber SET data_vencimento = $1, valor = $2 WHERE id = $3
       RETURNING id, linha_id, cliente_id, valor, data_vencimento, status`,
      [dataVencimento, valor, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Conta nao encontrada.' })
    }

    return res.json(mapConta(result.rows[0]))
  } catch {
    return res.status(500).json({ message: 'Erro ao atualizar conta.' })
  }
})

app.use((_req, res) => {
  res.status(404).json({ message: 'Rota nao encontrada.' })
})

// Inicializa banco e sobe o servidor
const start = async () => {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`API SimHub rodando em http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error.message)
    process.exit(1)
  }
}

start()
