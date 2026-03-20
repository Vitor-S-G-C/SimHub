# SimHub

Frontend React (Vite + TypeScript) com backend Node.js (Express) e banco SQLite.

## Estrutura

- `src/`: frontend
- `backend/src/`: API Node.js
- `backend/data/simhub.db`: banco SQLite local (criado automaticamente)

## Requisitos

- Node.js 20+ (recomendado LTS)
- npm

## Instalar dependencias

Terminal 1 (frontend):

```bash
npm install
```

Terminal 2 (backend):

```bash
cd backend
npm install
```

## Rodar em desenvolvimento

Terminal 1 (API):

```bash
npm run dev:api
```

Terminal 2 (frontend):

```bash
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:8080/api`

## Senha de login

A API usa senha padrao `123456` para login.

Para mudar:

Windows PowerShell:

```powershell
$env:ADMIN_PASSWORD="sua_senha"
npm run dev:api
```

## Rotas principais da API

- `POST /api/auth/login`
- `GET /api/clientes`
- `POST /api/clientes`
- `PUT /api/clientes/:id`
- `DELETE /api/clientes/:id`
- `GET /api/linhas`
- `POST /api/linhas`
- `PUT /api/linhas/:id`
- `DELETE /api/linhas/:id`
- `GET /api/contas`
- `PATCH /api/contas/:id/consolidar`

## Observacoes

- O cadastro de linha cria automaticamente uma conta a receber em aberto.
- Ao editar linha, contas em aberto da linha sao atualizadas com cliente, valor e vencimento.
- Banco local fica em `backend/data/simhub.db`.
# SimHub
