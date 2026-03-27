import cors from 'cors'
import express from 'express'
import { db, initDatabase, databasePath } from './db.js'

initDatabase()

const app = express()
const PORT = Number(process.env.PORT || 8080)

app.use(cors({ origin: ['http://localhost:5173'], credentials: false }))
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: databasePath })
})

app.get('/api/clientes', (_req, res) => {
  const rows = db
    .prepare('SELECT id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por FROM clientes ORDER BY id DESC')
    .all()
  res.json(rows.map(mapCliente))
})

app.post('/api/clientes', (req, res) => {
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
    const info = db
      .prepare('INSERT INTO clientes (nome, nome_fantasia, cnpj) VALUES (?, ?, ?)')
      .run(nome, nomeFantasia, cnpj)

    const row = db.prepare('SELECT id, nome, nome_fantasia, cnpj FROM clientes WHERE id = ?').get(info.lastInsertRowid)
    return res.status(201).json(mapCliente(row))
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return sendValidationError(res, 'CPF/CNPJ ja cadastrado.')
    }
    return res.status(500).json({ message: 'Erro ao criar cliente.' })
  }
})

app.put('/api/clientes/:id', (req, res) => {
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

    const info = db
      .prepare(
        'UPDATE clientes SET nome = ?, nome_fantasia = ?, cnpj = ?, atualizado_em = ?, atualizado_por = ? WHERE id = ?',
      )
      .run(nome, nomeFantasia, cnpj, updatedAt, updatedBy, id)

    if (!info.changes) {
      return res.status(404).json({ message: 'Cliente nao encontrado.' })
    }

    db.prepare('UPDATE linhas SET cliente_id = ? WHERE cliente_id = ?').run(id, id)
    db.prepare('UPDATE contas_receber SET cliente_id = ? WHERE cliente_id = ?').run(id, id)

    const row = db
      .prepare('SELECT id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por FROM clientes WHERE id = ?')
      .get(id)
    return res.json(mapCliente(row))
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return sendValidationError(res, 'CPF/CNPJ ja cadastrado em outro cliente.')
    }
    return res.status(500).json({ message: 'Erro ao atualizar cliente.' })
  }
})

app.delete('/api/clientes/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de cliente invalido.')

  const temLinha = db.prepare('SELECT 1 FROM linhas WHERE cliente_id = ? LIMIT 1').get(id)
  if (temLinha) {
    return sendValidationError(res, 'Nao e possivel excluir cliente com linhas vinculadas.')
  }

  const info = db.prepare('DELETE FROM clientes WHERE id = ?').run(id)
  if (!info.changes) {
    return res.status(404).json({ message: 'Cliente nao encontrado.' })
  }

  return res.status(204).send()
})

app.get('/api/linhas', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
              data_pagamento, conta_linha, empresa, ativa, atualizado_em, atualizado_por
      FROM linhas
      ORDER BY id DESC
    `)
    .all()

  res.json(rows.map(mapLinha))
})

app.post('/api/linhas', (req, res) => {
  const numero = String(req.body?.numero || '').trim()
  const valorMem = Number(req.body?.valorMem)
  const valorCliente = Number(req.body?.valorCliente)
  const usuario = String(req.body?.usuario || '').trim()
  const fidelidade = String(req.body?.fidelidade || '').trim()
  const clienteId = Number(req.body?.clienteId)
  const dataPagamento = String(req.body?.dataPagamento || '').trim()
  const contaLinha = String(req.body?.contaLinha || '').trim()
  const empresa = String(req.body?.empresa || '').trim()
  const ativa = req.body?.ativa ? 1 : 0

  if (
    !numero ||
    Number.isNaN(valorMem) ||
    Number.isNaN(valorCliente) ||
    !usuario ||
    !fidelidade ||
    !clienteId ||
    !dataPagamento ||
    !contaLinha ||
    !empresa
  ) {
    return sendValidationError(res, 'Preencha todos os campos da linha.')
  }

  if (valorCliente < valorMem) {
    return sendValidationError(res, 'Valor cliente deve ser maior ou igual ao valor MEM.')
  }

  const clienteExiste = db.prepare('SELECT id FROM clientes WHERE id = ?').get(clienteId)
  if (!clienteExiste) {
    return sendValidationError(res, 'Cliente informado nao existe.')
  }

  const tx = db.transaction(() => {
    const info = db
      .prepare(
        `
        INSERT INTO linhas (
          numero, valor_mem, valor_cliente, usuario, fidelidade,
          cliente_id, data_pagamento, conta_linha, empresa, ativa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        numero,
        valorMem,
        valorCliente,
        usuario,
        fidelidade,
        clienteId,
        dataPagamento,
        contaLinha,
        empresa,
        ativa,
      )

    return info.lastInsertRowid
  })

  try {
    const newId = tx()
    const row = db
      .prepare(
        `
        SELECT id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
               data_pagamento, conta_linha, empresa, ativa
        FROM linhas
        WHERE id = ?
      `,
      )
      .get(newId)

    return res.status(201).json(mapLinha(row))
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return sendValidationError(res, 'Numero de linha ja cadastrado.')
    }
    return res.status(500).json({ message: 'Erro ao criar linha.' })
  }
})

app.put('/api/linhas/:id', (req, res) => {
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
  const ativa = req.body?.ativa ? 1 : 0

  if (!id) {
    return sendValidationError(res, 'ID invalido para atualizar linha.')
  }

  if (
    !numero ||
    Number.isNaN(valorMem) ||
    Number.isNaN(valorCliente) ||
    !usuario ||
    !fidelidade ||
    !clienteId ||
    !dataPagamento ||
    !contaLinha ||
    !empresa
  ) {
    return sendValidationError(res, 'Preencha todos os campos obrigatorios para atualizar a linha.')
  }

  if (valorMem < 0 || valorCliente <= 0) {
    return sendValidationError(res, 'Informe valores validos para MEM e valor cliente.')
  }

  if (valorCliente < valorMem) {
    return sendValidationError(res, 'Valor cliente deve ser maior ou igual ao valor MEM.')
  }

  const clienteExiste = db.prepare('SELECT id FROM clientes WHERE id = ?').get(clienteId)
  if (!clienteExiste) {
    return sendValidationError(res, 'Cliente informado nao existe.')
  }

  const tx = db.transaction(() => {
    const updatedBy = String(req.header('x-user') || 'Sistema').trim() || 'Sistema'
    const updatedAt = new Date().toISOString()

    const info = db
      .prepare(
        `
        UPDATE linhas
        SET numero = ?, valor_mem = ?, valor_cliente = ?, usuario = ?, fidelidade = ?,
            cliente_id = ?, data_pagamento = ?, conta_linha = ?, empresa = ?, ativa = ?,
            atualizado_em = ?, atualizado_por = ?
        WHERE id = ?
      `,
      )
      .run(
        numero,
        valorMem,
        valorCliente,
        usuario,
        fidelidade,
        clienteId,
        dataPagamento,
        contaLinha,
        empresa,
        ativa,
        updatedAt,
        updatedBy,
        id,
      )

    if (!info.changes) {
      return 0
    }

    db
      .prepare(
        `
        UPDATE contas_receber
        SET cliente_id = ?, valor = ?, data_vencimento = ?
        WHERE linha_id = ? AND status = 'aberto'
      `,
      )
      .run(clienteId, valorCliente, dataPagamento, id)

    return info.changes
  })

  try {
    const changed = tx()
    if (!changed) {
      return res.status(404).json({ message: 'Linha nao encontrada.' })
    }

    const row = db
      .prepare(
        `
        SELECT id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
           data_pagamento, conta_linha, empresa, ativa, atualizado_em, atualizado_por
        FROM linhas
        WHERE id = ?
      `,
      )
      .get(id)

    return res.json(mapLinha(row))
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return sendValidationError(res, 'Numero de linha ja existe em outro cadastro.')
    }
    return res.status(500).json({ message: 'Erro ao atualizar linha.' })
  }
})

app.delete('/api/linhas/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de linha invalido.')

  const info = db.prepare('DELETE FROM linhas WHERE id = ?').run(id)
  if (!info.changes) {
    return res.status(404).json({ message: 'Linha nao encontrada.' })
  }

  return res.status(204).send()
})

app.get('/api/contas', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, linha_id, cliente_id, valor, data_vencimento, status FROM contas_receber ORDER BY id DESC',
    )
    .all()

  res.json(rows.map(mapConta))
})

app.post('/api/contas', (req, res) => {
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

  const clienteExiste = db.prepare('SELECT id FROM clientes WHERE id = ?').get(clienteId)
  if (!clienteExiste) {
    return sendValidationError(res, 'Cliente informado nao existe.')
  }

  try {
    const info = db
      .prepare(
        'INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES (?, ?, ?, ?, ?)',
      )
      .run(null, clienteId, valor, dataVencimento, 'aberto')

    const row = db
      .prepare('SELECT id, linha_id, cliente_id, valor, data_vencimento, status FROM contas_receber WHERE id = ?')
      .get(info.lastInsertRowid)

    return res.status(201).json(mapConta(row))
  } catch {
    return res.status(500).json({ message: 'Erro ao criar conta.' })
  }
})

app.patch('/api/contas/:id/consolidar', (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de conta invalido.')

  const info = db
    .prepare("UPDATE contas_receber SET status = 'consolidado' WHERE id = ?")
    .run(id)

  if (!info.changes) {
    return res.status(404).json({ message: 'Conta nao encontrada.' })
  }

  const row = db
    .prepare('SELECT id, linha_id, cliente_id, valor, data_vencimento, status FROM contas_receber WHERE id = ?')
    .get(id)

  return res.json(mapConta(row))
})

app.delete('/api/contas/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de conta invalido.')

  const info = db.prepare('DELETE FROM contas_receber WHERE id = ?').run(id)
  if (!info.changes) {
    return res.status(404).json({ message: 'Conta nao encontrada.' })
  }

  return res.status(204).send()
})

app.patch('/api/contas/:id', (req, res) => {
  const id = Number(req.params.id)
  const dataVencimento = String(req.body?.dataVencimento || '').trim()
  const valor = Number(req.body?.valor)

  if (!id) return sendValidationError(res, 'ID de conta invalido.')
  if (!dataVencimento) return sendValidationError(res, 'Data de vencimento invalida.')
  if (Number.isNaN(valor) || valor <= 0) return sendValidationError(res, 'Valor invalido.')

  const info = db
    .prepare('UPDATE contas_receber SET data_vencimento = ?, valor = ? WHERE id = ?')
    .run(dataVencimento, valor, id)

  if (!info.changes) {
    return res.status(404).json({ message: 'Conta nao encontrada.' })
  }

  const row = db
    .prepare('SELECT id, linha_id, cliente_id, valor, data_vencimento, status FROM contas_receber WHERE id = ?')
    .get(id)

  return res.json(mapConta(row))
})

app.use((_req, res) => {
  res.status(404).json({ message: 'Rota nao encontrada.' })
})

app.listen(PORT, () => {
  console.log(`API SimHub rodando em http://localhost:${PORT}/api`)
})
