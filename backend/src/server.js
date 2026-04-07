import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool, initDatabase } from './db.js'

const app = express()
const PORT = Number(process.env.PORT || 8080)
const JWT_SECRET = process.env.JWT_SECRET || 'simhub-secret-dev-2026'

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

// Helper: retorna o ID do coordenador logado ou null se for admin (admin vê tudo)
const getCoordId = (req) => req.usuario?.role === 'admin' ? null : req.usuario?.id

app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', db: 'SimHub (PostgreSQL)' })
})

// ────────── AUTH ──────────

app.post('/api/auth/login', async (req, res) => {
  const login = String(req.body?.login || '').trim()
  const senha = String(req.body?.senha || '').trim()

  if (!login || !senha) {
    return sendValidationError(res, 'Informe login e senha.')
  }

  try {
    const result = await pool.query(
      'SELECT id, nome, login, senha, role FROM usuarios WHERE login = $1',
      [login]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Login ou senha invalidos.' })
    }

    const usuario = result.rows[0]
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
      return res.status(401).json({ message: 'Login ou senha invalidos.' })
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, login: usuario.login, role: usuario.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, login: usuario.login, role: usuario.role },
    })
  } catch {
    return res.status(500).json({ message: 'Erro ao realizar login.' })
  }
})

// Middleware de autenticação JWT
const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token nao fornecido.' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.usuario = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Token invalido ou expirado.' })
  }
}

// Middleware de autorização por role
const autorizar = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.role)) {
    return res.status(403).json({ message: 'Sem permissao para esta acao.' })
  }
  next()
}

// Aplicar autenticação em todas as rotas abaixo
app.use('/api/clientes', autenticar)
app.use('/api/linhas', autenticar)
app.use('/api/contas', autenticar)
app.use('/api/usuarios', autenticar)

// ────────── USUARIOS (somente admin) ──────────

app.get('/api/usuarios', autorizar('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, login, numero, contato, role, criado_em FROM usuarios ORDER BY id'
    )
    res.json(result.rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      login: r.login,
      numero: r.numero,
      contato: r.contato,
      role: r.role,
      criadoEm: r.criado_em,
    })))
  } catch {
    res.status(500).json({ message: 'Erro ao buscar usuarios.' })
  }
})

app.post('/api/usuarios', autorizar('admin'), async (req, res) => {
  const nome = String(req.body?.nome || '').trim()
  const login = String(req.body?.login || '').trim()
  const senha = String(req.body?.senha || '').trim()
  const numero = String(req.body?.numero || '').trim()
  const contato = String(req.body?.contato || '').trim()

  if (!nome || !login || !senha || !numero || !contato) {
    return sendValidationError(res, 'Preencha nome, login, senha, numero e contato.')
  }

  if (senha.length < 4) {
    return sendValidationError(res, 'Senha deve ter pelo menos 4 caracteres.')
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10)
    const result = await pool.query(
      `INSERT INTO usuarios (nome, login, senha, numero, contato, role)
       VALUES ($1, $2, $3, $4, $5, 'coordenacao')
       RETURNING id, nome, login, numero, contato, role, criado_em`,
      [nome, login, senhaHash, numero, contato]
    )

    const r = result.rows[0]
    return res.status(201).json({
      id: r.id,
      nome: r.nome,
      login: r.login,
      numero: r.numero,
      contato: r.contato,
      role: r.role,
      criadoEm: r.criado_em,
    })
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || String(error.message).includes('duplicate')) {
      return sendValidationError(res, 'Login ja cadastrado.')
    }
    return res.status(500).json({ message: 'Erro ao criar coordenador.' })
  }
})

app.delete('/api/usuarios/:id', autorizar('admin'), async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de usuario invalido.')

  try {
    if (id === req.usuario.id) {
      return sendValidationError(res, 'Voce nao pode excluir sua propria conta.')
    }

    // Verificar senha admin
    const senhaAdmin = String(req.body?.senhaAdmin || '').trim()
    if (!senhaAdmin) {
      return sendValidationError(res, 'Informe sua senha para confirmar.')
    }

    const adminRow = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [req.usuario.id])
    if (adminRow.rows.length === 0) {
      return res.status(401).json({ message: 'Admin nao encontrado.' })
    }

    const senhaCorreta = await bcrypt.compare(senhaAdmin, adminRow.rows[0].senha)
    if (!senhaCorreta) {
      return res.status(403).json({ message: 'Senha incorreta.' })
    }

    const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario nao encontrado.' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir usuario.' })
  }
})

app.put('/api/usuarios/:id', autorizar('admin'), async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return sendValidationError(res, 'ID de usuario invalido.')

  const novoLogin = String(req.body?.login || '').trim()
  const novaSenha = String(req.body?.senha || '').trim()
  const senhaAdmin = String(req.body?.senhaAdmin || '').trim()

  if (!novoLogin && !novaSenha) {
    return sendValidationError(res, 'Informe login ou senha para atualizar.')
  }

  if (!senhaAdmin) {
    return sendValidationError(res, 'Informe sua senha para confirmar.')
  }

  if (novaSenha && novaSenha.length < 4) {
    return sendValidationError(res, 'Senha deve ter pelo menos 4 caracteres.')
  }

  try {
    // Verificar senha admin
    const adminRow = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [req.usuario.id])
    if (adminRow.rows.length === 0) {
      return res.status(401).json({ message: 'Admin nao encontrado.' })
    }

    const senhaCorreta = await bcrypt.compare(senhaAdmin, adminRow.rows[0].senha)
    if (!senhaCorreta) {
      return res.status(403).json({ message: 'Senha incorreta.' })
    }

    // Verificar se coordenador existe
    const coordRow = await pool.query('SELECT id, role FROM usuarios WHERE id = $1', [id])
    if (coordRow.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario nao encontrado.' })
    }

    // Montar updates dinâmicos
    const sets = []
    const values = []
    let idx = 1

    if (novoLogin) {
      sets.push(`login = $${idx}`)
      values.push(novoLogin)
      idx++
    }

    if (novaSenha) {
      const senhaHash = await bcrypt.hash(novaSenha, 10)
      sets.push(`senha = $${idx}`)
      values.push(senhaHash)
      idx++
    }

    values.push(id)
    await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${idx}`, values)

    const updated = await pool.query(
      'SELECT id, nome, login, numero, contato, role, criado_em FROM usuarios WHERE id = $1',
      [id]
    )

    const r = updated.rows[0]
    return res.json({
      id: r.id,
      nome: r.nome,
      login: r.login,
      numero: r.numero,
      contato: r.contato,
      role: r.role,
      criadoEm: r.criado_em,
    })
  } catch (error) {
    if (String(error.message).includes('UNIQUE') || String(error.message).includes('duplicate')) {
      return sendValidationError(res, 'Login ja cadastrado em outro usuario.')
    }
    return res.status(500).json({ message: 'Erro ao atualizar usuario.' })
  }
})

// ────────── CLIENTES ──────────

app.get('/api/clientes', async (req, res) => {
  try {
    const coordId = getCoordId(req)
    const where = coordId ? 'WHERE coordenacao_id = $1' : ''
    const params = coordId ? [coordId] : []

    const result = await pool.query(
      `SELECT id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por
       FROM clientes ${where} ORDER BY id DESC`,
      params
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
    const coordId = req.usuario?.role === 'admin' ? null : req.usuario?.id
    const result = await pool.query(
      `INSERT INTO clientes (nome, nome_fantasia, cnpj, coordenacao_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por`,
      [nome, nomeFantasia, cnpj, coordId]
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
    const updatedBy = req.usuario?.nome || 'Sistema'
    const updatedAt = new Date().toISOString()
    const coordId = getCoordId(req)

    const whereExtra = coordId ? ' AND coordenacao_id = $7' : ''
    const params = coordId
      ? [nome, nomeFantasia, cnpj, updatedAt, updatedBy, id, coordId]
      : [nome, nomeFantasia, cnpj, updatedAt, updatedBy, id]

    const result = await pool.query(
      `UPDATE clientes
       SET nome = $1, nome_fantasia = $2, cnpj = $3,
           atualizado_em = $4, atualizado_por = $5
       WHERE id = $6${whereExtra}
       RETURNING id, nome, nome_fantasia, cnpj, atualizado_em, atualizado_por`,
      params
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
    const coordId = getCoordId(req)

    const temLinha = await pool.query(
      'SELECT 1 AS existe FROM linhas WHERE cliente_id = $1 LIMIT 1',
      [id]
    )

    if (temLinha.rows.length > 0) {
      return sendValidationError(res, 'Nao e possivel excluir cliente com linhas vinculadas.')
    }

    const whereExtra = coordId ? ' AND coordenacao_id = $2' : ''
    const params = coordId ? [id, coordId] : [id]
    const result = await pool.query(`DELETE FROM clientes WHERE id = $1${whereExtra}`, params)

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cliente nao encontrado.' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir cliente.' })
  }
})

// ────────── LINHAS ──────────

app.get('/api/linhas', async (req, res) => {
  try {
    const coordId = getCoordId(req)
    const where = coordId ? 'WHERE coordenacao_id = $1' : ''
    const params = coordId ? [coordId] : []

    const result = await pool.query(`
      SELECT id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
             data_pagamento, conta_linha, empresa, ativa, atualizado_em, atualizado_por
      FROM linhas ${where} ORDER BY id DESC
    `, params)
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
        cliente_id, data_pagamento, conta_linha, empresa, ativa, coordenacao_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id,
                 data_pagamento, conta_linha, empresa, ativa, atualizado_em, atualizado_por`,
      [numero, valorMem, valorCliente, usuario, fidelidade,
       clienteId, dataPagamento, contaLinha, empresa, ativa,
       req.usuario?.role === 'admin' ? null : req.usuario?.id]
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

    const updatedBy = req.usuario?.nome || 'Sistema'
    const updatedAt = new Date().toISOString()
    const coordId = getCoordId(req)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const coordFilter = coordId ? ' AND coordenacao_id = $14' : ''
      const updateParams = [numero, valorMem, valorCliente, usuario, fidelidade, clienteId,
         dataPagamento, contaLinha, empresa, ativa, updatedAt, updatedBy, id]
      if (coordId) updateParams.push(coordId)

      const updateResult = await client.query(
        `UPDATE linhas
         SET numero = $1, valor_mem = $2, valor_cliente = $3,
             usuario = $4, fidelidade = $5, cliente_id = $6,
             data_pagamento = $7, conta_linha = $8, empresa = $9,
             ativa = $10, atualizado_em = $11, atualizado_por = $12
         WHERE id = $13${coordFilter}`,
        updateParams
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
    const coordId = getCoordId(req)
    const whereExtra = coordId ? ' AND coordenacao_id = $2' : ''
    const params = coordId ? [id, coordId] : [id]
    const result = await pool.query(`DELETE FROM linhas WHERE id = $1${whereExtra}`, params)

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Linha nao encontrada.' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir linha.' })
  }
})

// ────────── CONTAS ──────────

app.get('/api/contas', async (req, res) => {
  try {
    const coordId = getCoordId(req)
    const where = coordId ? 'WHERE coordenacao_id = $1' : ''
    const params = coordId ? [coordId] : []

    const result = await pool.query(
      `SELECT id, linha_id, cliente_id, valor, data_vencimento, status
       FROM contas_receber ${where} ORDER BY id DESC`,
      params
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
      `INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status, coordenacao_id)
       VALUES (NULL, $1, $2, $3, 'aberto', $4)
       RETURNING id, linha_id, cliente_id, valor, data_vencimento, status`,
      [clienteId, valor, dataVencimento, req.usuario?.role === 'admin' ? null : req.usuario?.id]
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
    const coordId = getCoordId(req)
    const whereExtra = coordId ? ' AND coordenacao_id = $2' : ''
    const params = coordId ? [id, coordId] : [id]

    const result = await pool.query(
      `UPDATE contas_receber SET status = 'consolidado' WHERE id = $1${whereExtra}
       RETURNING id, linha_id, cliente_id, valor, data_vencimento, status`,
      params
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
    const coordId = getCoordId(req)
    const whereExtra = coordId ? ' AND coordenacao_id = $2' : ''
    const params = coordId ? [id, coordId] : [id]

    const result = await pool.query(`DELETE FROM contas_receber WHERE id = $1${whereExtra}`, params)

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
    const coordId = getCoordId(req)
    const whereExtra = coordId ? ' AND coordenacao_id = $4' : ''
    const params = coordId ? [dataVencimento, valor, id, coordId] : [dataVencimento, valor, id]

    const result = await pool.query(
      `UPDATE contas_receber SET data_vencimento = $1, valor = $2 WHERE id = $3${whereExtra}
       RETURNING id, linha_id, cliente_id, valor, data_vencimento, status`,
      params
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
