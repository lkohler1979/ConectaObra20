# Skills da Equipe & Checklists de Execução — ConectaObra 2.0

## PARTE A — Matriz de Skills

### A.1 Papéis e competências necessárias

| Papel | Skills essenciais | Skills desejáveis | Aloca em |
|---|---|---|---|
| **Tech Lead / Arquiteto** | TypeScript avançado, NestJS, PostgreSQL, arquitetura modular, integrações de pagamento | Event-driven, DDD, AWS | Todos os épicos |
| **Dev Full-stack (×2)** | Next.js/React, TypeScript, Tailwind, REST, testes | React Native/Expo, SEO técnico | E1, E2, E3, E6, E7 |
| **Dev Backend Financeiro** | Node/NestJS, transações e idempotência, webhooks, conciliação, segurança | Ledger/contabilidade, PCI awareness, PIX/split | E4, E8 (dedicado) |
| **Engenheiro(a) de IA** | LLMs (Claude API), RAG, pgvector/embeddings, prompt engineering, avaliação de qualidade | LangChain-like patterns, guard-rails, fine-tuning leve | E5 |
| **Product Designer** | Design system, mobile-first, pesquisa com usuário de baixa familiaridade digital, prototipagem Figma | Ilustração, motion | S0-04, todos |
| **PM / PO** | Discovery, priorização, métricas de marketplace (liquidez, take rate), escrita de specs | Experiência em fintech ou marketplace | Todos |
| **Engenheiro Civil consultor** | NBRs, orçamentação (SINAPI/CUB), composições de custo, prática de canteiro | Perícia/mediação de conflitos | E5-02, disputas, conteúdo |
| **QA** | Playwright/E2E, testes de API, casos de borda financeiros | Testes de carga (k6) | E4, E10-04 |
| **Jurídico/Compliance (parcial)** | LGPD, contratos digitais, regulação de pagamentos (Bacen), termos de uso | Direito imobiliário/consumidor | E4, E1-08 |
| **DevOps (parcial)** | Docker, GitHub Actions, AWS/PaaS, monitoramento | Terraform, FinOps | S0, E10-05 |

### A.2 Gaps típicos e plano de capacitação

| Gap provável | Ação |
|---|---|
| Ninguém já integrou escrow/split | Spike S0-07 com POC guiada pela doc do PSP; pair programming nas 2 primeiras semanas do E4 |
| RAG em produção | Workshop interno + baseline com dataset de 50 perguntas reais avaliadas pelo engenheiro civil |
| UX para público de canteiro | 5 entrevistas + teste de usabilidade com prestadores reais antes do E3 |
| Conteúdo técnico com segurança jurídica | Todo material da base de IA passa por engenheiro (ART) + jurídico (direitos autorais) |

---

## PARTE B — Checklists de Execução

### B.1 Definition of Ready (antes de iniciar qualquer task)
- [ ] História com critério de aceite claro e mensurável
- [ ] Design/wireframe aprovado (quando houver UI)
- [ ] Dependências externas identificadas (PSP, KYC, assinatura)
- [ ] Impacto em LGPD/financeiro avaliado (se toca dados pessoais ou dinheiro)
- [ ] Estimada e priorizada no sprint

### B.2 Definition of Done (para encerrar qualquer task)
- [ ] Código revisado (2 aprovações se módulo escrow/billing)
- [ ] Testes unitários passando; cobertura ≥ 70% em escrow/rfq
- [ ] Teste E2E do fluxo afetado verde
- [ ] Logs/auditoria implementados para ações sensíveis
- [ ] Acessibilidade básica (foco visível, labels, contraste AA)
- [ ] Responsivo em 360 px testado
- [ ] Textos em PT-BR revisados (tom simples, sem jargão de sistema)
- [ ] Feature flag configurada (se rollout gradual)
- [ ] Documentação/ADR atualizada quando decisão de arquitetura

### B.3 Checklist específico — Módulo Escrow (E4)
- [ ] Toda mutação financeira é idempotente (chave de idempotência)
- [ ] Webhook do PSP validado por assinatura + retry com backoff
- [ ] Ledger append-only: nenhum UPDATE/DELETE em `escrow_transactions`
- [ ] Conciliação diária PSP × ledger com alerta de divergência
- [ ] Valores sempre em centavos (integer), nunca float
- [ ] Timeout de aprovação automática notifica cliente em D-3, D-1
- [ ] Disputa congela liberação imediatamente
- [ ] MFA exigido para saque/alteração de conta bancária
- [ ] Testes cobrem: pagamento duplo, estorno parcial, split com arredondamento, queda de webhook

### B.4 Checklist específico — IA (E5)
- [ ] Resposta sempre cita fonte da base curada
- [ ] Tema estrutural/elétrico/gás dispara disclaimer + recomendação de profissional habilitado
- [ ] Cálculos quantitativos usam calculadora determinística (nunca "de cabeça" do LLM)
- [ ] Nenhum trecho integral de NBR na base (apenas resumos autorais + link oficial)
- [ ] Avaliação: ≥ 90% de acerto no dataset de 50 perguntas validado pelo engenheiro
- [ ] Rate-limit por plano aplicado e testado
- [ ] Conversas logadas com consentimento LGPD

### B.5 Checklist de lançamento do MVP (go-live cidade-piloto)
**Produto**
- [ ] Fluxo completo testado com dinheiro real em produção (valor simbólico): RFQ → proposta → contrato assinado → depósito → entrega → aprovação → liberação
- [ ] Fluxo de disputa testado ponta a ponta com mediação no admin
- [ ] 200 prestadores e 50 fornecedores cadastrados e verificados na cidade-piloto
- [ ] Base da IA cobre as 30 dúvidas mais comuns de reforma/construção residencial

**Técnico**
- [ ] Pentest executado e críticos corrigidos
- [ ] Backups automáticos + teste de restore realizado
- [ ] Monitoramento e alertas (erro 5xx, fila travada, webhook falho, divergência de ledger)
- [ ] Plano de rollback documentado

**Legal/Compliance**
- [ ] Termos de uso, política de privacidade e contrato-modelo aprovados pelo jurídico
- [ ] Contrato com PSP, KYC e assinatura eletrônica vigentes
- [ ] DPO nomeado e canal de titular LGPD ativo
- [ ] NFS-e da comissão configurada

**Operação**
- [ ] Playbook de mediação de disputas treinado com o time
- [ ] Suporte via WhatsApp com SLA definido (< 2 h em horário comercial)
- [ ] Dashboard de KPIs do PRD (§3) ativo desde o dia 1

### B.6 Checklist de cada sprint review
- [ ] Demo do incremento em ambiente staging
- [ ] KPIs do sprint comparados com meta
- [ ] Riscos do PRD (§8) revisitados
- [ ] Débito técnico registrado e priorizado (< 15% da capacidade)
