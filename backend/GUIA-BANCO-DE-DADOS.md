# Guia do Banco de Dados — SIMHUB_INK-TECH

## 1. Como conectar ao banco

O SimHub usa **SQL Server Express LocalDB**, que já vem instalado com o Visual Studio.
Para acessar pelo terminal ou SSMS, a instância é:

```
(localdb)\MSSQLLocalDB
```

### Pelo terminal (sqlcmd)

```bash
sqlcmd -S "(localdb)\MSSQLLocalDB" -d "SIMHUB_INK-TECH"
```

Depois de conectar, você digita SQL e executa com `GO`:

```sql
SELECT * FROM clientes;
GO
```

Para sair: `EXIT`

### Pelo SQL Server Management Studio (SSMS)

1. Abra o SSMS
2. Em **Server name**, coloque: `(localdb)\MSSQLLocalDB`
3. Authentication: **Windows Authentication**
4. Clique em **Connect**
5. Expanda Databases → **SIMHUB_INK-TECH**
6. Clique em **New Query** e escreva seu SQL

---

## 2. Estrutura do Banco de Dados

O banco tem **3 tabelas** que se relacionam assim:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   clientes   │──1:N──│    linhas     │──1:N──│  contas_receber  │
│              │       │              │       │                  │
│ id (PK)      │       │ id (PK)      │       │ id (PK)          │
│ nome         │       │ numero       │       │ linha_id (FK)    │
│ nome_fantasia│       │ valor_mem    │       │ cliente_id (FK)  │
│ cnpj (UNIQUE)│       │ valor_cliente│       │ valor            │
│ atualizado_em│       │ usuario      │       │ data_vencimento  │
│ atualizado_por│      │ fidelidade   │       │ status           │
│ criado_em    │       │ cliente_id(FK)│      │ criado_em        │
│              │       │ data_pagamento│      │                  │
│              │       │ conta_linha  │       │                  │
│              │       │ empresa      │       │                  │
│              │       │ ativa        │       │                  │
│              │       │ atualizado_em│       │                  │
│              │       │ atualizado_por│      │                  │
│              │       │ criado_em    │       │                  │
└──────────────┘       └──────────────┘       └──────────────────┘
```

### 2.1 Tabela `clientes`
Armazena as empresas/pessoas que contratam linhas telefônicas.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT IDENTITY | Chave primária, auto-incremento |
| `nome` | NVARCHAR(200) | Razão social |
| `nome_fantasia` | NVARCHAR(200) | Nome fantasia |
| `cnpj` | NVARCHAR(18) | CPF ou CNPJ formatado (único) |
| `atualizado_em` | DATETIME2 | Data/hora da última edição |
| `atualizado_por` | NVARCHAR(100) | Quem fez a última edição |
| `criado_em` | DATETIME2 | Data de criação (automático) |

### 2.2 Tabela `linhas`
Cada linha telefônica pertence a um cliente.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT IDENTITY | Chave primária |
| `numero` | NVARCHAR(50) | Número da linha (único) |
| `valor_mem` | DECIMAL(12,2) | Custo da linha para a empresa (MEM) |
| `valor_cliente` | DECIMAL(12,2) | Valor cobrado do cliente |
| `usuario` | NVARCHAR(100) | Nome do usuário da linha |
| `fidelidade` | NVARCHAR(100) | Período de fidelidade |
| `cliente_id` | INT | FK → `clientes.id` |
| `data_pagamento` | NVARCHAR(10) | Data de vencimento mensal |
| `conta_linha` | NVARCHAR(100) | Identificador da conta |
| `empresa` | NVARCHAR(200) | Operadora (Vivo, Claro, Tim, Oi) |
| `ativa` | BIT | 1 = ativa, 0 = inativa |
| `atualizado_em` | DATETIME2 | Última edição |
| `atualizado_por` | NVARCHAR(100) | Quem editou |
| `criado_em` | DATETIME2 | Criação (automático) |

**Lucro por linha** = `valor_cliente` - `valor_mem`

### 2.3 Tabela `contas_receber`
Cada conta é uma cobrança mensal. Pode estar vinculada a uma linha ou ser avulsa.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INT IDENTITY | Chave primária |
| `linha_id` | INT (NULL) | FK → `linhas.id` (NULL = conta avulsa) |
| `cliente_id` | INT | FK → `clientes.id` |
| `valor` | DECIMAL(12,2) | Valor da conta |
| `data_vencimento` | NVARCHAR(10) | Data de vencimento (YYYY-MM-DD) |
| `status` | NVARCHAR(12) | `'aberto'` ou `'consolidado'` |
| `criado_em` | DATETIME2 | Criação (automático) |

**Status:**
- `aberto` = conta pendente, ainda não recebida
- `consolidado` = conta já paga/recebida

---

## 3. Relacionamentos (Foreign Keys)

```sql
-- Uma linha pertence a um cliente
linhas.cliente_id  →  clientes.id

-- Uma conta pertence a um cliente
contas_receber.cliente_id  →  clientes.id

-- Uma conta pode estar vinculada a uma linha (opcional)
contas_receber.linha_id  →  linhas.id  (ON DELETE CASCADE)
```

`ON DELETE CASCADE` na `linha_id` significa que se uma linha for deletada, as contas vinculadas a ela também são removidas.

---

## 4. Índices

Índices aceleram as consultas. O banco cria automaticamente:

| Índice | Coluna | Para quê |
|---|---|---|
| `IX_linhas_cliente_id` | `linhas.cliente_id` | Buscar linhas de um cliente |
| `IX_contas_cliente_id` | `contas_receber.cliente_id` | Buscar contas de um cliente |
| `IX_contas_linha_id` | `contas_receber.linha_id` | Buscar contas de uma linha |
| `IX_contas_status` | `contas_receber.status` | Filtrar por aberto/consolidado |
| `IX_contas_vencimento` | `contas_receber.data_vencimento` | Ordenar/filtrar por data |

---

## 5. Consultas úteis (exemplos)

### 5.1 Listar todos os clientes

```sql
SELECT id, nome, nome_fantasia, cnpj
FROM clientes
ORDER BY nome;
```

### 5.2 Listar linhas de um cliente específico

```sql
-- Linhas do cliente "Ink Tech" (id = 1)
SELECT l.numero, l.usuario, l.empresa, l.valor_cliente, l.valor_mem
FROM linhas l
WHERE l.cliente_id = 1;
```

### 5.3 Ver linhas com nome do cliente (JOIN)

```sql
SELECT
    l.numero,
    l.usuario,
    l.empresa,
    l.valor_cliente,
    c.nome_fantasia AS cliente
FROM linhas l
INNER JOIN clientes c ON c.id = l.cliente_id
ORDER BY c.nome_fantasia, l.numero;
```

> **JOIN** conecta duas tabelas pelo campo em comum. `INNER JOIN` retorna só registros que existem nas duas tabelas.

### 5.4 Contas em aberto (pendentes)

```sql
SELECT
    cr.id,
    c.nome_fantasia AS cliente,
    l.numero AS linha,
    cr.valor,
    cr.data_vencimento
FROM contas_receber cr
INNER JOIN clientes c ON c.id = cr.cliente_id
LEFT JOIN linhas l ON l.id = cr.linha_id
WHERE cr.status = 'aberto'
ORDER BY cr.data_vencimento;
```

> **LEFT JOIN** traz a linha mesmo que `linha_id` seja NULL (contas avulsas).

### 5.5 Total recebido vs a receber

```sql
SELECT
    status,
    COUNT(*) AS quantidade,
    SUM(valor) AS total
FROM contas_receber
GROUP BY status;
```

> **GROUP BY** agrupa registros. **SUM** soma os valores. **COUNT** conta quantos registros existem no grupo.

### 5.6 Faturamento por mês (o que alimenta os gráficos)

```sql
SELECT
    LEFT(data_vencimento, 7) AS mes,     -- "2026-01", "2026-02", etc.
    SUM(CASE WHEN status = 'consolidado' THEN valor ELSE 0 END) AS recebido,
    SUM(CASE WHEN status = 'aberto'      THEN valor ELSE 0 END) AS a_receber
FROM contas_receber
GROUP BY LEFT(data_vencimento, 7)
ORDER BY mes;
```

> **CASE WHEN** funciona como um IF dentro do SQL. Aqui ele separa os valores por status antes de somar.

### 5.7 Lucro por cliente (valor cobrado - custo MEM)

```sql
SELECT
    c.nome_fantasia,
    COUNT(l.id) AS total_linhas,
    SUM(l.valor_cliente) AS receita_mensal,
    SUM(l.valor_mem) AS custo_mensal,
    SUM(l.valor_cliente - l.valor_mem) AS lucro_mensal
FROM clientes c
INNER JOIN linhas l ON l.cliente_id = c.id
WHERE l.ativa = 1
GROUP BY c.nome_fantasia
ORDER BY lucro_mensal DESC;
```

### 5.8 Top 5 clientes que mais devem

```sql
SELECT TOP 5
    c.nome_fantasia,
    SUM(cr.valor) AS total_aberto
FROM contas_receber cr
INNER JOIN clientes c ON c.id = cr.cliente_id
WHERE cr.status = 'aberto'
GROUP BY c.nome_fantasia
ORDER BY total_aberto DESC;
```

> **TOP 5** limita o resultado às 5 primeiras linhas (no MySQL seria `LIMIT 5`, mas no SQL Server é `TOP`).

### 5.9 Contas vencidas (passaram da data e ainda estão abertas)

```sql
SELECT
    cr.id,
    c.nome_fantasia,
    cr.valor,
    cr.data_vencimento
FROM contas_receber cr
INNER JOIN clientes c ON c.id = cr.cliente_id
WHERE cr.status = 'aberto'
  AND cr.data_vencimento < CONVERT(NVARCHAR(10), GETDATE(), 23)
ORDER BY cr.data_vencimento;
```

> **GETDATE()** retorna a data/hora atual. **CONVERT(..., 23)** formata como 'YYYY-MM-DD' para comparar com `data_vencimento`.

### 5.10 Quantidade de contas por mês e status

```sql
SELECT
    LEFT(data_vencimento, 7) AS mes,
    status,
    COUNT(*) AS quantidade,
    SUM(valor) AS total
FROM contas_receber
GROUP BY LEFT(data_vencimento, 7), status
ORDER BY mes, status;
```

---

## 6. Comandos úteis de manutenção

### Contar registros em todas as tabelas

```sql
SELECT 'clientes' AS tabela, COUNT(*) AS total FROM clientes
UNION ALL
SELECT 'linhas', COUNT(*) FROM linhas
UNION ALL
SELECT 'contas_receber', COUNT(*) FROM contas_receber;
```

### Reexecutar o seed (limpar e repopular)

```bash
sqlcmd -S "(localdb)\MSSQLLocalDB" -d "SIMHUB_INK-TECH" -i seed.sql
```

### Ver estrutura de uma tabela

```sql
EXEC sp_columns 'clientes';
```

### Ver todas as constraints (FK, UNIQUE, CHECK)

```sql
SELECT
    tc.TABLE_NAME,
    tc.CONSTRAINT_NAME,
    tc.CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
WHERE tc.TABLE_CATALOG = 'SIMHUB_INK-TECH'
ORDER BY tc.TABLE_NAME;
```

---

## 7. Glossário rápido

| Termo | Significado |
|---|---|
| `PK` (Primary Key) | Chave primária — identifica cada registro de forma única |
| `FK` (Foreign Key) | Chave estrangeira — referência a outra tabela |
| `IDENTITY(1,1)` | Auto-incremento: começa em 1, incrementa de 1 em 1 |
| `NVARCHAR` | Texto com suporte a acentos e caracteres especiais |
| `DECIMAL(12,2)` | Número com até 12 dígitos, sendo 2 casas decimais |
| `BIT` | Booleano: 0 = falso, 1 = verdadeiro |
| `DATETIME2` | Data e hora com alta precisão |
| `UNIQUE` | Não permite valores duplicados na coluna |
| `NOT NULL` | Campo obrigatório |
| `DEFAULT` | Valor automático quando não informado |
| `CHECK` | Restrição de valores permitidos |
| `JOIN` | Conecta tabelas pelo campo em comum |
| `GROUP BY` | Agrupa registros para usar SUM, COUNT, AVG, etc. |
| `CASE WHEN` | Condicional dentro do SQL (equivalente a IF) |
