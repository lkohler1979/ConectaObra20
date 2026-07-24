# Backlog de Tasks — ConectaObra 2.0
**MVP (Releases 1) detalhado por épico e sprint | Estimativas em story points (SP)**

Legenda de prioridade: 🔴 P0 (bloqueante MVP) · 🟡 P1 (MVP desejável) · 🟢 P2 (pós-MVP)

---

## SPRINT 0 — Fundação (2 semanas)

| ID | Task | Prio | SP | Depende de |
|---|---|---|---|---|
| S0-01 | Criar monorepo (pnpm + Turborepo) com apps web/api/admin | 🔴 | 3 | — |
| S0-02 | Docker Compose local (Postgres+PostGIS+pgvector, Redis, Meilisearch) | 🔴 | 3 | S0-01 |
| S0-03 | CI/CD GitHub Actions (lint, test, build, deploy staging) | 🔴 | 5 | S0-01 |
| S0-04 | Design System v0: tokens (cores, tipografia), 15 componentes base | 🔴 | 8 | — |
| S0-05 | Schema Prisma inicial + migrações + seed | 🔴 | 5 | S0-02 |
| S0-06 | Observabilidade: Sentry + logs estruturados + audit_log | 🔴 | 3 | S0-03 |
| S0-07 | **Selecionar e contratar PSP/BaaS de escrow** (spike + POC sandbox) | 🔴 | 8 | — |
| S0-08 | Selecionar provedor de assinatura eletrônica e KYC | 🔴 | 3 | — |
| S0-09 | ADRs: stack final validado, PSP, auth | 🔴 | 2 | S0-07 |

## ÉPICO E1 — Identidade e Onboarding (Sprints 1–2)

| ID | Task | Prio | SP |
|---|---|---|---|
| E1-01 | Cadastro/login (e-mail+senha, OTP telefone), refresh token | 🔴 | 5 |
| E1-02 | Onboarding por perfil: cliente PF/PJ, prestador, fornecedor, técnico | 🔴 | 8 |
| E1-03 | KYC: CPF/CNPJ + selfie via provedor; estados pendente/aprovado | 🔴 | 8 |
| E1-04 | MFA obrigatório para operações financeiras | 🔴 | 3 |
| E1-05 | Perfil do prestador: fotos, obras, certificados, experiência, raio | 🔴 | 5 |
| E1-06 | Página do fornecedor: vitrine, produtos, região, certificações | 🔴 | 8 |
| E1-07 | Upload de mídia (S3 presigned, compressão de fotos) | 🔴 | 5 |
| E1-08 | LGPD: consentimentos, política, exclusão de conta | 🔴 | 5 |

## ÉPICO E2 — Marketplace e Busca (Sprints 2–3)

| ID | Task | Prio | SP |
|---|---|---|---|
| E2-01 | Indexação Meilisearch (fornecedores, prestadores, produtos) | 🔴 | 5 |
| E2-02 | Busca com filtros: categoria, cidade/raio, nota, selo | 🔴 | 8 |
| E2-03 | Páginas públicas SEO (perfil fornecedor/prestador) | 🔴 | 5 |
| E2-04 | Avaliações pós-contrato (prazo, qualidade, preço) | 🔴 | 5 |
| E2-05 | Nota agregada + selo básico no perfil | 🟡 | 3 |
| E2-06 | Catálogo de produtos do fornecedor (CRUD) | 🟡 | 5 |

## ÉPICO E3 — Sistema de Orçamentos / RFQ (Sprints 3–4)

| ID | Task | Prio | SP |
|---|---|---|---|
| E3-01 | Criar obra (tipo, endereço com geocoding, área, orçamento previsto) | 🔴 | 5 |
| E3-02 | Publicar RFQ vinculado à obra (categoria, descrição, fotos, prazo) | 🔴 | 5 |
| E3-03 | Motor de matching regional (PostGIS + categoria + rodízio) | 🔴 | 8 |
| E3-04 | Notificações de novo RFQ (push/e-mail/WhatsApp) via fila | 🔴 | 5 |
| E3-05 | Envio de proposta (preço, prazo, observações) + caps por plano | 🔴 | 5 |
| E3-06 | Comparador lado a lado (tabela responsiva + destaque IA) | 🔴 | 8 |
| E3-07 | Aceitar proposta → gerar rascunho de contrato | 🔴 | 3 |
| E3-08 | Chat cliente↔proponente por RFQ | 🟡 | 8 |

## ÉPICO E4 — Contratos e Hub Financeiro / Escrow (Sprints 4–6) ⭐

| ID | Task | Prio | SP |
|---|---|---|---|
| E4-01 | Geração de contrato (template jurídico + variáveis) em PDF | 🔴 | 5 |
| E4-02 | Integração assinatura eletrônica (webhook de conclusão) | 🔴 | 5 |
| E4-03 | Definição de milestones no contrato (escopo, valor, checklist) | 🔴 | 5 |
| E4-04 | Checkout de depósito em custódia (PIX/cartão/boleto via PSP) | 🔴 | 8 |
| E4-05 | Ledger interno append-only com hash encadeado + conciliação diária | 🔴 | 8 |
| E4-06 | Entrega de etapa: upload de fotos + checklist + solicitação de aceite | 🔴 | 5 |
| E4-07 | Aprovação do cliente → liberação via split (valor − comissão 2–5%) | 🔴 | 8 |
| E4-08 | Aprovação automática após N dias sem resposta (com avisos) | 🟡 | 3 |
| E4-09 | Fluxo de disputa: abertura, evidências, mediação no admin | 🔴 | 8 |
| E4-10 | Estorno/liberação parcial mediante resolução | 🔴 | 5 |
| E4-11 | Webhooks PSP idempotentes + fila de retry | 🔴 | 5 |
| E4-12 | Extrato financeiro do prestador/fornecedor + comprovantes | 🔴 | 5 |
| E4-13 | Emissão de NFS-e da comissão da plataforma | 🟡 | 5 |

## ÉPICO E5 — IA Especializada (Sprints 5–7)

| ID | Task | Prio | SP |
|---|---|---|---|
| E5-01 | Pipeline RAG: ingestão, chunking, embeddings pgvector | 🔴 | 8 |
| E5-02 | Curadoria da base v1 (resumos NBR autorais, SINAPI, CUB, guias) — revisão por engenheiro | 🔴 | 13 |
| E5-03 | Chat com streaming, contexto da obra e citação de fontes | 🔴 | 8 |
| E5-04 | Calculadoras determinísticas (concreto, blocos, argamassa, tinta) como tools | 🔴 | 8 |
| E5-05 | Analisador de orçamento (proposta vs. custo médio regional) | 🟡 | 8 |
| E5-06 | Guard-rails: classificador de risco + disclaimers + rate-limit por plano | 🔴 | 5 |
| E5-07 | Gerador de lista de materiais a partir de descrição da obra | 🟢 | 8 |

## ÉPICO E6 — Gestão da Obra (Sprints 6–8 · Release 2)

| ID | Task | Prio | SP |
|---|---|---|---|
| E6-01 | Cronograma de etapas (Gantt simplificado, dependências) | 🟡 | 8 |
| E6-02 | Painel financeiro da obra (previsto × realizado por etapa) | 🟡 | 8 |
| E6-03 | Diário de obra (feed automático de eventos + fotos geolocalizadas) | 🟡 | 5 |
| E6-04 | Gestão de equipe e checklists por etapa | 🟡 | 5 |
| E6-05 | Controle de entregas de materiais | 🟢 | 5 |

## ÉPICO E7 — Compras Inteligentes (Release 2)

| ID | Task | Prio | SP |
|---|---|---|---|
| E7-01 | Lista de materiais (manual + importação da IA) | 🟡 | 5 |
| E7-02 | Cotação automática multi-fornecedor | 🟡 | 8 |
| E7-03 | Comparador: menor preço, menor frete, melhor avaliação, prazo | 🟡 | 8 |
| E7-04 | Checkout de compra com comissão 3–8% | 🟡 | 8 |

## ÉPICO E8 — Monetização (Release 2)

| ID | Task | Prio | SP |
|---|---|---|---|
| E8-01 | Planos e paywall (fornecedor 79/149/299/599 · prestador 0/39/79 · cliente 0/29/59) | 🟡 | 8 |
| E8-02 | Billing recorrente + dunning + upgrade/downgrade | 🟡 | 8 |
| E8-03 | Benefícios por plano (destaque, caps, analytics, CRM básico, selo premium) | 🟡 | 8 |
| E8-04 | Ranking completo + selos Bronze/Prata/Ouro/Platinum (job mensal auditável) | 🟡 | 5 |

## ÉPICO E9 — Conteúdo, Catálogo e Ads (Release 3)

| ID | Task | Prio | SP |
|---|---|---|---|
| E9-01 | CMS de notícias + portal SEO | 🟢 | 8 |
| E9-02 | Ingestão automática de indicadores (CUB, INCC, SINAPI, commodities) | 🟢 | 8 |
| E9-03 | Tabela dinâmica de custos médios por cidade | 🟢 | 5 |
| E9-04 | Biblioteca (guias, checklists, modelos de contrato) | 🟢 | 3 |
| E9-05 | Catálogo de plantas: publicação, compra, entrega com marca d'água, comissão 15–25% | 🟢 | 13 |
| E9-06 | Publicidade: inventário, CPC/CPM, painel do anunciante | 🟢 | 13 |

## ÉPICO E10 — Go-to-Market técnico (paralelo, Sprints 6–8)

| ID | Task | Prio | SP |
|---|---|---|---|
| E10-01 | Painel admin: moderação de perfis, disputas, conteúdo | 🔴 | 8 |
| E10-02 | Ferramenta de cadastro assistido (onboarding em campo dos 200 prestadores-piloto) | 🔴 | 5 |
| E10-03 | Analytics de funil (PostHog) + dashboards de KPI | 🟡 | 5 |
| E10-04 | Testes E2E do fluxo crítico completo + testes de carga no matching | 🔴 | 8 |
| E10-05 | Pentest + revisão LGPD antes do go-live | 🔴 | 5 |

---

## Resumo de capacidade (referência)
Equipe sugerida: 1 Tech Lead, 2 devs full-stack, 1 dev backend (escrow), 1 designer de produto, 1 PM, 1 engenheiro civil consultor (base IA + conteúdo), QA compartilhado.
Velocidade estimada: ~40 SP/sprint → MVP (Sprints 0–6) ≈ 16 semanas.
