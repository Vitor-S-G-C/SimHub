import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { UserPlus, Trash2, Pencil } from 'lucide-react'
import { apiRequest } from '../api'
import type { UsuarioListItem } from '../types'

type AcaoPendente =
  | { tipo: 'excluir'; id: number; nome: string }
  | { tipo: 'editar'; id: number; nome: string; login: string; novaSenha: string; novoLogin: string }

export function CoordenadoresTab() {
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([])
  const [nome, setNome] = useState('')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [numero, setNumero] = useState('')
  const [contato, setContato] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success')

  // Modal de verificação de senha
  const [acaoPendente, setAcaoPendente] = useState<AcaoPendente | null>(null)
  const [senhaAdmin, setSenhaAdmin] = useState('')
  const [erroModal, setErroModal] = useState('')
  const [processando, setProcessando] = useState(false)

  // Edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editLogin, setEditLogin] = useState('')
  const [editSenha, setEditSenha] = useState('')

  const carregarUsuarios = useCallback(async () => {
    try {
      const data = await apiRequest<UsuarioListItem[]>('/usuarios')
      setUsuarios(data)
    } catch {
      setFeedback('Erro ao carregar usuarios.')
      setFeedbackTone('error')
    }
  }, [])

  useEffect(() => {
    void carregarUsuarios()
  }, [carregarUsuarios])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(''), 3200)
    return () => clearTimeout(timer)
  }, [feedback])

  const showFb = (msg: string, tone: 'success' | 'error') => {
    setFeedback(msg)
    setFeedbackTone(tone)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!nome.trim() || !login.trim() || !senha.trim() || !numero.trim() || !contato.trim()) {
      showFb('Preencha todos os campos.', 'error')
      return
    }

    if (senha.length < 4) {
      showFb('Senha deve ter pelo menos 4 caracteres.', 'error')
      return
    }

    try {
      await apiRequest('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nome: nome.trim(),
          login: login.trim(),
          senha: senha.trim(),
          numero: numero.trim(),
          contato: contato.trim(),
        }),
      })
      showFb('Coordenador criado com sucesso.', 'success')
      setNome('')
      setLogin('')
      setSenha('')
      setNumero('')
      setContato('')
      await carregarUsuarios()
    } catch (error) {
      showFb(error instanceof Error ? error.message : 'Erro ao criar coordenador.', 'error')
    }
  }

  // Iniciar edição de um coordenador
  const iniciarEdicao = (u: UsuarioListItem) => {
    setEditandoId(u.id)
    setEditLogin(u.login)
    setEditSenha('')
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setEditLogin('')
    setEditSenha('')
  }

  // Pedir senha admin para confirmar edição
  const confirmarEdicao = (u: UsuarioListItem) => {
    if (!editLogin.trim() && !editSenha.trim()) {
      showFb('Informe novo login ou nova senha.', 'error')
      return
    }
    if (editSenha && editSenha.length < 4) {
      showFb('Nova senha deve ter pelo menos 4 caracteres.', 'error')
      return
    }
    setAcaoPendente({
      tipo: 'editar',
      id: u.id,
      nome: u.nome,
      login: u.login,
      novoLogin: editLogin.trim(),
      novaSenha: editSenha.trim(),
    })
    setSenhaAdmin('')
    setErroModal('')
  }

  // Pedir senha admin para confirmar exclusão
  const pedirExclusao = (u: UsuarioListItem) => {
    setAcaoPendente({ tipo: 'excluir', id: u.id, nome: u.nome })
    setSenhaAdmin('')
    setErroModal('')
  }

  // Executar ação pendente após verificação de senha
  const executarAcao = async () => {
    if (!acaoPendente) return
    if (!senhaAdmin.trim()) {
      setErroModal('Informe sua senha.')
      return
    }

    setProcessando(true)
    setErroModal('')

    try {
      if (acaoPendente.tipo === 'excluir') {
        await apiRequest(`/usuarios/${acaoPendente.id}`, {
          method: 'DELETE',
          body: JSON.stringify({ senhaAdmin: senhaAdmin.trim() }),
        })
        showFb(`Coordenador "${acaoPendente.nome}" removido.`, 'success')
      } else {
        const body: Record<string, string> = { senhaAdmin: senhaAdmin.trim() }
        if (acaoPendente.novoLogin) body.login = acaoPendente.novoLogin
        if (acaoPendente.novaSenha) body.senha = acaoPendente.novaSenha

        await apiRequest(`/usuarios/${acaoPendente.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        showFb(`Coordenador "${acaoPendente.nome}" atualizado.`, 'success')
        cancelarEdicao()
      }

      setAcaoPendente(null)
      setSenhaAdmin('')
      await carregarUsuarios()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro na operacao.'
      if (msg.toLowerCase().includes('senha')) {
        setErroModal(msg)
      } else {
        showFb(msg, 'error')
        setAcaoPendente(null)
        setSenhaAdmin('')
      }
    } finally {
      setProcessando(false)
    }
  }

  const fecharModal = () => {
    setAcaoPendente(null)
    setSenhaAdmin('')
    setErroModal('')
  }

  return (
    <>
      <div className="panel-grid two-columns">
        <div className="panel-card">
          <h3>Novo Coordenador</h3>
          <form className="stack-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <input
              type="text"
              placeholder="Numero (telefone)"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
            <input
              type="text"
              placeholder="Contato (email ou outro)"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
            />
            <input
              type="text"
              placeholder="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="off"
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
            />
            <button className="primary-button" type="submit">
              <UserPlus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Criar Coordenador
            </button>
          </form>
          {feedback ? (
            <p className={`coord-feedback ${feedbackTone === 'error' ? 'coord-feedback-error' : 'coord-feedback-success'}`}>
              {feedback}
            </p>
          ) : null}
        </div>

        <div className="panel-card">
          <h3>Usuarios Cadastrados</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Numero</th>
                  <th>Contato</th>
                  <th>Login</th>
                  <th>Cargo</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.numero}</td>
                    <td>{u.contato}</td>
                    <td>
                      {editandoId === u.id ? (
                        <input
                          type="text"
                          value={editLogin}
                          onChange={(e) => setEditLogin(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        u.login
                      )}
                    </td>
                    <td>
                      <span className={u.role === 'admin' ? 'role-badge role-admin' : 'role-badge role-coord'}>
                        {u.role === 'admin' ? 'Admin' : 'Coordenacao'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' ? (
                        <div className="actions-cell">
                          {editandoId === u.id ? (
                            <>
                              <input
                                type="password"
                                placeholder="Nova senha"
                                value={editSenha}
                                onChange={(e) => setEditSenha(e.target.value)}
                                autoComplete="new-password"
                                style={{ width: 110 }}
                              />
                              <button
                                className="primary-button"
                                type="button"
                                onClick={() => confirmarEdicao(u)}
                                title="Salvar"
                              >
                                Salvar
                              </button>
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={cancelarEdicao}
                                title="Cancelar"
                              >
                                X
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => iniciarEdicao(u)}
                                title="Editar login/senha"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => pedirExclusao(u)}
                                title="Excluir usuario"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum usuario cadastrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {acaoPendente ? (
        <div
          className="edit-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}
        >
          <article className="panel-card edit-modal-card confirm-modal verify-modal">
            <h3>
              {acaoPendente.tipo === 'excluir'
                ? `Excluir "${acaoPendente.nome}"?`
                : `Alterar "${acaoPendente.nome}"?`}
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {acaoPendente.tipo === 'excluir'
                ? 'Esta acao nao pode ser desfeita. Informe sua senha de admin para confirmar.'
                : 'Informe sua senha de admin para confirmar as alteracoes.'}
            </p>
            <input
              type="password"
              placeholder="Sua senha de admin"
              value={senhaAdmin}
              onChange={(e) => setSenhaAdmin(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === 'Enter') void executarAcao() }}
            />
            {erroModal ? (
              <p className="coord-feedback coord-feedback-error">{erroModal}</p>
            ) : null}
            <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
              <button className="ghost-button" type="button" onClick={fecharModal}>
                Cancelar
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => void executarAcao()}
                disabled={processando}
              >
                {processando ? 'Verificando...' : 'Confirmar'}
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </>
  )
}
