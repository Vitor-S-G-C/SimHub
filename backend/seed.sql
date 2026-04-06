-- Seed de dados para SimHub (PostgreSQL)
-- Executar com: psql -U postgres -d simhub -f seed.sql

TRUNCATE contas_receber, linhas, clientes RESTART IDENTITY CASCADE;

-- ────────── CLIENTES ──────────
INSERT INTO clientes (nome, nome_fantasia, cnpj) VALUES
  ('João Silva Telecomunicações LTDA', 'JS Telecom', '12.345.678/0001-90'),
  ('Maria Oliveira Conectividade ME', 'MO Connect', '23.456.789/0001-01'),
  ('Tech Solutions Comunicações SA', 'TechCom', '34.567.890/0001-12'),
  ('Pedro Santos Internet LTDA', 'PS Net', '45.678.901/0001-23'),
  ('Ana Costa Serviços Digitais ME', 'AC Digital', '56.789.012/0001-34'),
  ('Carlos Mendes Telecom EIRELI', 'CM Telecom', '67.890.123/0001-45'),
  ('Fernanda Lima Redes LTDA', 'FL Redes', '78.901.234/0001-56'),
  ('Roberto Alves Comunicação ME', 'RA Com', '89.012.345/0001-67');

-- ────────── LINHAS ──────────
INSERT INTO linhas (numero, valor_mem, valor_cliente, usuario, fidelidade, cliente_id, data_pagamento, conta_linha, empresa, ativa) VALUES
  ('(11) 99999-0001', 49.90, 79.90, 'joao.silva', '12 meses', 1, '10', 'Conta Principal', 'Vivo', true),
  ('(11) 99999-0002', 39.90, 69.90, 'joao.silva2', '24 meses', 1, '10', 'Conta Principal', 'Claro', true),
  ('(21) 98888-0001', 59.90, 99.90, 'maria.oliv', '12 meses', 2, '15', 'Conta Empresarial', 'Tim', true),
  ('(21) 98888-0002', 44.90, 74.90, 'maria.oliv2', '12 meses', 2, '15', 'Conta Empresarial', 'Vivo', true),
  ('(31) 97777-0001', 79.90, 129.90, 'tech.sol', '24 meses', 3, '20', 'Conta Corporativa', 'Claro', true),
  ('(31) 97777-0002', 55.90, 89.90, 'tech.sol2', '12 meses', 3, '20', 'Conta Corporativa', 'Vivo', true),
  ('(41) 96666-0001', 34.90, 59.90, 'pedro.s', '12 meses', 4, '05', 'Conta Pessoal', 'Tim', true),
  ('(41) 96666-0002', 44.90, 79.90, 'pedro.s2', '24 meses', 4, '05', 'Conta Pessoal', 'Oi', true),
  ('(51) 95555-0001', 64.90, 109.90, 'ana.costa', '24 meses', 5, '12', 'Conta Digital', 'Vivo', true),
  ('(51) 95555-0002', 49.90, 84.90, 'ana.costa2', '12 meses', 5, '12', 'Conta Digital', 'Claro', true),
  ('(61) 94444-0001', 54.90, 94.90, 'carlos.m', '12 meses', 6, '25', 'Conta Telecom', 'Tim', true),
  ('(61) 94444-0002', 39.90, 64.90, 'carlos.m2', '24 meses', 6, '25', 'Conta Telecom', 'Vivo', false),
  ('(71) 93333-0001', 69.90, 119.90, 'fernanda.l', '24 meses', 7, '08', 'Conta Redes', 'Claro', true),
  ('(71) 93333-0002', 44.90, 79.90, 'fernanda.l2', '12 meses', 7, '08', 'Conta Redes', 'Tim', true),
  ('(81) 92222-0001', 59.90, 99.90, 'roberto.a', '12 meses', 8, '18', 'Conta Comunicação', 'Vivo', true),
  ('(81) 92222-0002', 34.90, 59.90, 'roberto.a2', '24 meses', 8, '18', 'Conta Comunicação', 'Oi', true);

-- ────────── CONTAS A RECEBER ──────────
-- Jul 2025 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2025-07-10', 'consolidado'),
  (2, 1, 69.90, '2025-07-10', 'consolidado'),
  (3, 2, 99.90, '2025-07-15', 'consolidado'),
  (4, 2, 74.90, '2025-07-15', 'consolidado'),
  (5, 3, 129.90, '2025-07-20', 'consolidado'),
  (6, 3, 89.90, '2025-07-20', 'consolidado'),
  (7, 4, 59.90, '2025-07-05', 'consolidado'),
  (8, 4, 79.90, '2025-07-05', 'consolidado');

-- Ago 2025 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2025-08-10', 'consolidado'),
  (2, 1, 69.90, '2025-08-10', 'consolidado'),
  (3, 2, 99.90, '2025-08-15', 'consolidado'),
  (4, 2, 74.90, '2025-08-15', 'consolidado'),
  (5, 3, 129.90, '2025-08-20', 'consolidado'),
  (6, 3, 89.90, '2025-08-20', 'consolidado'),
  (9, 5, 109.90, '2025-08-12', 'consolidado'),
  (10, 5, 84.90, '2025-08-12', 'consolidado');

-- Set 2025 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2025-09-10', 'consolidado'),
  (2, 1, 69.90, '2025-09-10', 'consolidado'),
  (3, 2, 99.90, '2025-09-15', 'consolidado'),
  (5, 3, 129.90, '2025-09-20', 'consolidado'),
  (7, 4, 59.90, '2025-09-05', 'consolidado'),
  (8, 4, 79.90, '2025-09-05', 'consolidado'),
  (11, 6, 94.90, '2025-09-25', 'consolidado');

-- Out 2025 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2025-10-10', 'consolidado'),
  (3, 2, 99.90, '2025-10-15', 'consolidado'),
  (4, 2, 74.90, '2025-10-15', 'consolidado'),
  (5, 3, 129.90, '2025-10-20', 'consolidado'),
  (6, 3, 89.90, '2025-10-20', 'consolidado'),
  (9, 5, 109.90, '2025-10-12', 'consolidado'),
  (13, 7, 119.90, '2025-10-08', 'consolidado'),
  (14, 7, 79.90, '2025-10-08', 'consolidado');

-- Nov 2025 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2025-11-10', 'consolidado'),
  (2, 1, 69.90, '2025-11-10', 'consolidado'),
  (3, 2, 99.90, '2025-11-15', 'consolidado'),
  (5, 3, 129.90, '2025-11-20', 'consolidado'),
  (7, 4, 59.90, '2025-11-05', 'consolidado'),
  (11, 6, 94.90, '2025-11-25', 'consolidado'),
  (15, 8, 99.90, '2025-11-18', 'consolidado'),
  (16, 8, 59.90, '2025-11-18', 'consolidado');

-- Dez 2025 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2025-12-10', 'consolidado'),
  (2, 1, 69.90, '2025-12-10', 'consolidado'),
  (3, 2, 99.90, '2025-12-15', 'consolidado'),
  (4, 2, 74.90, '2025-12-15', 'consolidado'),
  (5, 3, 129.90, '2025-12-20', 'consolidado'),
  (6, 3, 89.90, '2025-12-20', 'consolidado'),
  (9, 5, 109.90, '2025-12-12', 'consolidado'),
  (10, 5, 84.90, '2025-12-12', 'consolidado'),
  (13, 7, 119.90, '2025-12-08', 'consolidado');

-- Jan 2026 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2026-01-10', 'consolidado'),
  (2, 1, 69.90, '2026-01-10', 'consolidado'),
  (3, 2, 99.90, '2026-01-15', 'consolidado'),
  (5, 3, 129.90, '2026-01-20', 'consolidado'),
  (7, 4, 59.90, '2026-01-05', 'consolidado'),
  (8, 4, 79.90, '2026-01-05', 'consolidado'),
  (11, 6, 94.90, '2026-01-25', 'consolidado'),
  (15, 8, 99.90, '2026-01-18', 'consolidado');

-- Fev 2026 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2026-02-10', 'consolidado'),
  (3, 2, 99.90, '2026-02-15', 'consolidado'),
  (4, 2, 74.90, '2026-02-15', 'consolidado'),
  (5, 3, 129.90, '2026-02-20', 'consolidado'),
  (6, 3, 89.90, '2026-02-20', 'consolidado'),
  (9, 5, 109.90, '2026-02-12', 'consolidado'),
  (13, 7, 119.90, '2026-02-08', 'consolidado'),
  (14, 7, 79.90, '2026-02-08', 'consolidado');

-- Mar 2026 (consolidadas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2026-03-10', 'consolidado'),
  (2, 1, 69.90, '2026-03-10', 'consolidado'),
  (3, 2, 99.90, '2026-03-15', 'consolidado'),
  (5, 3, 129.90, '2026-03-20', 'consolidado'),
  (7, 4, 59.90, '2026-03-05', 'consolidado'),
  (11, 6, 94.90, '2026-03-25', 'consolidado'),
  (15, 8, 99.90, '2026-03-18', 'consolidado'),
  (16, 8, 59.90, '2026-03-18', 'consolidado');

-- Abr 2026 (abertas - perto de vencer e futuras)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (7, 4, 59.90, '2026-04-05', 'aberto'),
  (8, 4, 79.90, '2026-04-05', 'aberto'),
  (13, 7, 119.90, '2026-04-08', 'aberto'),
  (14, 7, 79.90, '2026-04-08', 'aberto'),
  (1, 1, 79.90, '2026-04-10', 'aberto'),
  (2, 1, 69.90, '2026-04-10', 'aberto'),
  (9, 5, 109.90, '2026-04-12', 'aberto'),
  (10, 5, 84.90, '2026-04-12', 'aberto'),
  (3, 2, 99.90, '2026-04-15', 'aberto'),
  (4, 2, 74.90, '2026-04-15', 'aberto'),
  (15, 8, 99.90, '2026-04-18', 'aberto'),
  (16, 8, 59.90, '2026-04-18', 'aberto'),
  (5, 3, 129.90, '2026-04-20', 'aberto'),
  (6, 3, 89.90, '2026-04-20', 'aberto'),
  (11, 6, 94.90, '2026-04-25', 'aberto');

-- Mai 2026 (abertas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (7, 4, 59.90, '2026-05-05', 'aberto'),
  (1, 1, 79.90, '2026-05-10', 'aberto'),
  (2, 1, 69.90, '2026-05-10', 'aberto'),
  (3, 2, 99.90, '2026-05-15', 'aberto'),
  (5, 3, 129.90, '2026-05-20', 'aberto'),
  (9, 5, 109.90, '2026-05-12', 'aberto'),
  (13, 7, 119.90, '2026-05-08', 'aberto'),
  (15, 8, 99.90, '2026-05-18', 'aberto');

-- Jun 2026 (abertas)
INSERT INTO contas_receber (linha_id, cliente_id, valor, data_vencimento, status) VALUES
  (1, 1, 79.90, '2026-06-10', 'aberto'),
  (3, 2, 99.90, '2026-06-15', 'aberto'),
  (5, 3, 129.90, '2026-06-20', 'aberto'),
  (7, 4, 59.90, '2026-06-05', 'aberto'),
  (11, 6, 94.90, '2026-06-25', 'aberto');
