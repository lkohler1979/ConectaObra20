# Especificação Técnica — ConectaObra 2.0
**Versão 1.0 | Julho 2026**

> ⚠️ **NOTA SOBRE O STACK:** o documento de visão citava "Stack Tecnológico (decisões fechadas — não alterar sem discussão)", porém a lista do stack não foi anexada. O stack abaixo é a **proposta de referência** da equipe técnica, marcada como `[A VALIDAR]`. Substitua pelos itens fechados assim que disponíveis — a arquitetura foi desenhada para ser agnóstica nas camadas de framework.

---

## 1. Stack Tecnológico Proposto `[A VALIDAR]`

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend Web | **Next.js 15 (React 19) + TypeScript** | SSR/SEO para marketplace, ecossistema maduro |
| UI | **Tailwind CSS + shadcn/ui** + Design System próprio | Velocidade + consistência |
| Mobile | **PWA no MVP → React Native (Expo) na R2** | Prestador em canteiro; reuso de código |
| Backend | **NestJS (Node/TypeScript)** — monólito modular | Time único, contratos tipados ponta a ponta |
| Banco relacional | **PostgreSQL 16** (+ PostGIS para matching regional) | Transacional forte p/ financeiro; geo nativo |
| Cache/filas | **Redis + BullMQ** | Notificações, distribuição de RFQ, jobs |
| Busca | **Meilisearch** (ou OpenSearch em escala) | Busca de fornecedores/produtos com typo-tolerance |
| Storage | **S3-compatível** (fotos de obra, contratos, plantas) | Presigned URLs, versionamento |
| IA | **API Anthropic Claude** + RAG (pgvector) | Chat técnico, análise de orçamento, geração de listas |
| Pagamentos/Escrow | **Parceiro BaaS licenciado** (ex.: Asaas, Pagar.me, Iugu, Dock, QI Tech) | Split, custódia, PIX, boleto, compliance Bacen |
| Assinaturas | Billing do mesmo PSP ou Stripe Billing | Recorrência, dunning |
| Contratos digitais | Clicksign / ZapSign / D4Sign (API) | Validade jurídica (ICP-Brasil opcional) |
| Infra | **Docker + AWS (ECS/RDS) ou Railway/Render no MVP** | Custo baixo no início, caminho de escala |
| CI/CD | GitHub Actions | Padrão de mercado |
| Observabilidade | Sentry + Grafana/Prometheus + logs estruturados | Auditoria financeira exige rastreabilidade |
| Autenticação | Auth própria (JWT + refresh) ou Clerk/Auth0; MFA p/ financeiro | KYC integrado |
| Analytics | PostHog (self-host opcional) | Funil, ativação, A/B |

---

## 2. Arquitetura de Alto Nível

```
                        ┌─────────────────────────────┐
                        │        CDN / Edge            │
                        └──────────────┬───────────────┘
        ┌───────────────┬─────────────┴────────────┬───────────────┐
        │  Web Next.js  │        PWA / App          │  Painel Admin │
        └───────┬───────┴─────────────┬─────────────┴───────┬───────┘
                └─────────────── API Gateway (REST/tRPC) ────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │      Backend NestJS (monólito       │
                    │      modular por bounded context)   │
                    ├─────────────────────────────────────┤
                    │ identity · marketplace · rfq        │
                    │ escrow · works(obras) · procurement │
                    │ ai · content · ranking · ads        │
                    └──┬─────────┬──────────┬─────────┬───┘
                       │         │          │         │
                 PostgreSQL   Redis     Meili     S3 Storage
                 (+PostGIS,  (BullMQ)  search    (fotos/docs)
                  pgvector)
                       │
        ┌──────────────┼───────────────────────────────┐
        │              │                               │
   PSP/BaaS       Assinatura                    IA (Claude API
   (escrow,       eletrônica                    + RAG pgvector)
   split, PIX)    (contratos)
```

**Decisão:** monólito modular no MVP (não microserviços). Módulos com fronteiras claras (bounded contexts) para extração futura. O módulo `escrow` nunca executa movimentação financeira própria — apenas orquestra o PSP e mantém o ledger espelho.

---

## 3. Modelo de Dados (entidades principais)

```
users(id, tipo[cliente_pf|cliente_pj|prestador|fornecedor|tecnico|admin],
      nome, email, telefone, cpf_cnpj, kyc_status, mfa_enabled, created_at)

profiles_prestador(user_id, categorias[], experiencia_anos, certificados[],
      raio_atendimento_km, geo point, selo, nota_media, agenda_config)

profiles_fornecedor(user_id, razao_social, categorias[], regioes[],
      tempo_mercado, certificacoes[], plano, selo, nota_media)

products(id, fornecedor_id, nome, categoria, preco, unidade, estoque, fotos[])

works/obras(id, cliente_id, titulo, tipo[reforma|construcao|ampliacao],
      endereco, geo, area_m2, orcamento_previsto, status)

rfq(id, obra_id, cliente_id, categoria, descricao, prazo_resposta,
      regiao, status[aberto|em_analise|contratado|cancelado])

rfq_proposals(id, rfq_id, proponente_id, preco, prazo_dias,
      observacoes, status[enviada|aceita|recusada])

contracts(id, rfq_proposal_id, obra_id, partes[], valor_total,
      assinatura_provider_id, status, pdf_url)

milestones(id, contract_id, ordem, descricao, valor, checklist jsonb,
      fotos[], status[pendente|em_execucao|entregue|aprovado|em_disputa|pago],
      aprovado_em, aprovado_por)

escrow_transactions(id, milestone_id, psp_ref, tipo[deposito|liberacao|
      estorno|comissao], valor, taxa_plataforma, status, ledger_hash)
      -- append-only, com hash encadeado p/ auditoria

disputes(id, milestone_id, aberto_por, motivo, evidencias[],
      mediador_id, resolucao, status)

reviews(id, contrato_id, avaliador_id, avaliado_id,
      nota_prazo, nota_qualidade, nota_preco, comentario)

material_lists(id, obra_id, itens jsonb, origem[manual|ia])
purchase_quotes(id, material_list_id, fornecedor_id, itens_precos jsonb,
      frete, prazo, status)

projects_catalog(id, arquiteto_id, titulo, categoria[casa|sobrado|galpao|
      chacara|condominio], preco, arquivos[], licenca, vendas_count)

subscriptions(id, user_id, plano, valor, psp_sub_id, status, renova_em)
ai_conversations(id, user_id, obra_id?, mensagens jsonb, tokens_usados)
indicators(id, tipo[CUB|INCC|SINAPI|aco|cimento|madeira], regiao, valor,
      referencia_mes, fonte)
avg_costs(id, servico, unidade, cidade, valor_min, valor_med, valor_max, mes)
articles(id, titulo, slug, categoria, corpo, autor, publicado_em)
ads(id, anunciante_id, tipo[cpc|cpm|destaque], criativo, budget, metricas)
audit_log(id, user_id, acao, entidade, payload, ip, created_at) -- imutável
```

---

## 4. APIs — contratos principais (REST, prefixo `/api/v1`)

```
AUTH        POST /auth/register · /auth/login · /auth/mfa · /auth/kyc
OBRAS       CRUD /works · GET /works/:id/dashboard
RFQ         POST /rfq · GET /rfq/:id/proposals · POST /rfq/:id/proposals
            POST /proposals/:id/accept
CONTRATOS   POST /contracts (gera doc + envia p/ assinatura)
MILESTONES  POST /milestones/:id/deliver (fotos+checklist)
            POST /milestones/:id/approve  → dispara liberação escrow
            POST /milestones/:id/dispute
ESCROW      POST /escrow/deposit (checkout PSP) · webhooks /webhooks/psp
COMPRAS     POST /material-lists · POST /material-lists/:id/quote
            GET  /material-lists/:id/comparison
IA          POST /ai/chat · POST /ai/analyze-budget · POST /ai/material-list
CATÁLOGO    CRUD /catalog/projects · POST /catalog/projects/:id/buy
CONTEÚDO    GET /articles · GET /indicators · GET /avg-costs?city=
RANKING     GET /rankings?categoria=&cidade=
ADS         CRUD /ads · GET /ads/:id/metrics
BILLING     POST /subscriptions · webhooks /webhooks/billing
```

**Webhooks do PSP são a fonte de verdade financeira.** O ledger interno é espelho conciliado diariamente (job de reconciliação).

---

## 5. IA Especializada — arquitetura RAG

1. **Base de conhecimento curada:** resumos técnicos próprios de NBRs (nunca texto integral — direitos ABNT), tabelas SINAPI/CUB públicas, manuais de fabricantes (com permissão), guias internos revisados por engenheiro responsável.
2. **Pipeline:** ingestão → chunking → embeddings (pgvector) → retrieval híbrido (vetor + keyword) → prompt com contexto + dados da obra do usuário → resposta com citação da fonte.
3. **Ferramentas do agente:** consulta de custos médios por cidade, calculadoras determinísticas (traço de concreto, quantidade de blocos/argamassa/tinta — fórmulas em código, não no LLM), análise de proposta vs. média regional.
4. **Guard-rails:** classificador de risco (estrutural/elétrico/gás ⇒ disclaimer obrigatório + recomendação de profissional habilitado); rate-limit por plano; log completo p/ auditoria.

---

## 6. Matching de RFQ (distribuição regional)

- Filtro: categoria do serviço ∩ raio de atendimento (PostGIS `ST_DWithin`) ∩ perfil ativo.
- Ordenação: selo > nota > taxa de resposta > recência.
- Fairness: rodízio ponderado para não concentrar leads nos mesmos perfis; caps por plano (gratuito 5 propostas/mês).
- Notificação: push/WhatsApp (via provedor oficial) + e-mail, fila BullMQ.

---

## 7. Compliance e Regulatório

- **Escrow:** plataforma NÃO custodia recursos diretamente; usa conta de pagamento do PSP/BaaS autorizado pelo Bacen (evita necessidade de licença própria de IP no MVP).
- **LGPD:** base legal por finalidade; consentimento granular; DPO nomeado; direito de exclusão com anonimização de dados transacionais (retenção fiscal 5 anos).
- **KYC/AML:** verificação de CPF/CNPJ + selfie (provedor: ex. idwall/CAF) para quem recebe pagamentos.
- **Split e nota fiscal:** emissão de NFS-e da comissão da plataforma; orientação fiscal ao prestador (não substituição tributária no MVP).
- **Contratos:** assinatura eletrônica com trilha de auditoria (MP 2.200-2/2001); modelos revisados por jurídico.
- **ABNT:** apenas resumos autorais e links para compra oficial das normas.

---

## 8. Ambientes e Qualidade

| Ambiente | Uso |
|---|---|
| `local` | Docker Compose (pg, redis, meili, mock PSP) |
| `staging` | Sandbox do PSP, dados sintéticos |
| `production` | Deploy blue-green, migrações versionadas |

- Testes: unitários (≥ 70% nos módulos escrow/rfq), integração com PSP sandbox, E2E (Playwright) nos fluxos críticos: publicar RFQ → aceitar → pagar → aprovar → liberar.
- Feature flags para rollout por cidade.
- Convenções: Conventional Commits, trunk-based com PRs curtos, ADRs para decisões de arquitetura.
