# PRD — ConectaObra 2.0
**Product Requirements Document | Versão 1.0 | Julho 2026**

---

## 1. Visão do Produto

Ser a maior plataforma digital da construção civil da América Latina, conectando clientes, fornecedores, profissionais de mão de obra, arquitetos, engenheiros e instituições financeiras em um único ecossistema — com marketplace, gestão de obra, IA especializada e pagamentos garantidos (escrow).

**Posicionamento em uma frase:** "Do orçamento à entrega da chave, tudo em um só lugar — com pagamento protegido."

### 1.1 Contexto de mercado
O mercado brasileiro já possui players consolidados em nichos isolados (ex.: Construmarket/Sienge com Construcompras, Construmanager, Construpoint, AECweb e Rede de Obras — focados no B2B e em construtoras). Nenhum player domina o fluxo ponta a ponta do **cliente final (B2C) + prestador informal + fornecedor local** com custódia financeira integrada. Esse é o oceano do ConectaObra 2.0.

### 1.2 Problema
Quem constrói ou reforma hoje precisa, de forma fragmentada: encontrar arquiteto, engenheiro, pedreiro, eletricista; comprar material; solicitar e comparar orçamentos; controlar custos e pagamentos; e confiar que o serviço será entregue. O resultado é: atrasos, golpes, baixa qualidade, falta de transparência e desperdício.

### 1.3 Solução
Plataforma única que integra: Marketplace (produtos, serviços e mão de obra), Gestão da Obra, IA especializada em engenharia, Hub Financeiro com escrow, Contratos e Garantias, Sistema de Orçamentos, Catálogo de Projetos, Portal de Notícias, Indicadores (CUB, INCC, SINAPI) e Biblioteca técnica.

---

## 2. Personas e Públicos

| Persona | Perfil | Dor principal | Job to be done |
|---|---|---|---|
| **Cliente PF** ("Ana, 38, reforma") | Reforma, construção, ampliação | Medo de golpe e estouro de orçamento | "Contratar com segurança e prever custos" |
| **Cliente PJ** ("Construtora Delta") | Construtoras, incorporadoras, condomínios | Cotação lenta e fornecedores dispersos | "Cotar rápido com fornecedores confiáveis" |
| **Prestador** ("Seu José, pedreiro") | Pedreiro, pintor, eletricista, encanador, carpinteiro, marceneiro, gesseiro, vidraceiro, serralheiro, instaladores | Falta de clientes e calote | "Receber garantido e ter agenda cheia" |
| **Empresa fornecedora** ("Loja Central") | Lojas, distribuidores, home centers, concreteiras, locadoras, marcenarias, esquadrias, marmorarias | Concorrer com grandes redes | "Vender mais na minha região" |
| **Profissional técnico** ("Arq. Marina") | Arquitetos, engenheiros, designers, topógrafos, calculistas | Captação de clientes e renda recorrente | "Vender projetos e serviços em escala" |

---

## 3. Objetivos e Métricas de Sucesso (North Star + KPIs)

**North Star Metric:** GMV transacionado via Hub Financeiro (escrow).

| Objetivo | KPI | Meta 12 meses |
|---|---|---|
| Liquidez do marketplace | Orçamentos respondidos em < 24h | ≥ 70% |
| Confiança | Disputas / transações | < 2% |
| Receita recorrente | MRR de assinaturas | R$ 250 mil |
| Adoção da IA | Usuários ativos com ≥ 3 perguntas/semana | 40% dos clientes ativos |
| Retenção fornecedor | Churn mensal de assinantes | < 4% |
| Ativação | Cliente cria obra + 1 orçamento em 7 dias | ≥ 50% |

---

## 4. Escopo Funcional — Módulos

### M1. Marketplace de Fornecedores (Empresas)
- Página própria por fornecedor: produtos, serviços, fotos, avaliações, certificações, região atendida, tempo de mercado.
- Busca com filtros (categoria, região, nota, selo).
- Catálogo de produtos com preço e estoque (opcional por plano).

### M2. Marketplace de Mão de Obra
- Perfil do prestador: fotos, obras realizadas, certificados, cursos, avaliações, tempo de experiência.
- Verificação de identidade (KYC light) e selo "Perfil Verificado".
- Agenda de disponibilidade (planos pagos).

### M3. Sistema de Orçamentos (RFQ)
- Cliente publica necessidade (ex.: "Construção de casa de 180 m² em Vitória").
- Distribuição automática para fornecedores/profissionais da região (matching por categoria + geolocalização + selo).
- Respostas com preço, prazo e observações; comparador lado a lado.
- Limites por plano (cliente gratuito: 3 orçamentos).

### M4. Hub Financeiro (Escrow) — *diferencial nº 1*
Fluxo: Cliente → Conta Garantida → Execução da etapa → Aprovação → Pagamento liberado.
- Pagamento por etapa (milestones) com contrato, fotos, checklist e aceite.
- Disputa: mediação com histórico completo (fotos, chat, checklists).
- Comissão de 2%–5% por transação.
- Split de pagamento, antecipação de recebíveis (fase 2, via parceiro).
- **Requisito regulatório:** operar via parceiro BaaS/IP licenciado no Bacen (ver Especificação Técnica §7).

### M5. IA Especializada ("Engenheiro Virtual")
- Chat com respostas baseadas em: NBR, SINAPI, CUB, custos médios, histórico da plataforma e manuais técnicos (RAG).
- Casos de uso: "O muro precisa de sapata?", "Qual bloco usar?", "Quantos sacos de cimento?", "Esse orçamento faz sentido?".
- Analisador de orçamento: compara proposta recebida vs. custo médio regional.
- Limites por plano (gratuito: limitado; Premium/PRO: ilimitado).
- **Guard-rails:** disclaimers de responsabilidade técnica; recomendações estruturais sempre com aviso "consulte um engenheiro habilitado (ART/RRT)".

### M6. Planejamento e Gestão da Obra
- Cronograma por etapas (Gantt simplificado), financeiro, compras, entregas de materiais, equipe, checklist e fotos com registro de data/geolocalização.
- Diário de obra automático (feed de eventos).

### M7. Compras Inteligentes
- Cliente cria lista de materiais (manual ou gerada pela IA a partir do projeto).
- Cotação automática com fornecedores; ranking por menor preço, menor frete, melhor avaliação, prazo.
- Comissão de 3%–8% por venda.

### M8. Catálogo de Projetos (Plantas)
- Venda de plantas arquitetônicas: casas, sobrados, galpões, chácaras, condomínio.
- Arquitetos publicam e vendem; comissão de 15%–25%.
- Entrega digital com marca d'água e licença de uso.

### M9. Conteúdo, Notícias e Indicadores
- Portal de notícias com conteúdo diário (novidades, legislação, tendências, materiais, financiamento).
- Indicadores automáticos: CUB, INCC, SINAPI, inflação, aço, cimento, madeira.
- Tabela dinâmica de custos médios por cidade (R$/m² assentamento, pintura; R$/m³ concreto; R$/m² telhado).
- Biblioteca: NBR (links/resumos — atenção a direitos autorais ABNT), PDFs, guias, checklists, modelos de contrato.

### M10. Ranking e Selos
- Nota do fornecedor baseada em prazo, qualidade, preço, avaliações e recorrência.
- Selos: Bronze, Prata, Ouro, Platinum (critérios objetivos e auditáveis).

### M11. Publicidade
- Espaços patrocinados (fabricantes: Tigre, Votorantim, Quartzolit, Bosch, Suvinil...).
- Modelos CPC, CPM e destaque patrocinado.

---

## 5. Modelo de Receita

| # | Fonte | Preço/Taxa |
|---|---|---|
| 1 | Assinatura fornecedores | Bronze R$ 79 · Prata R$ 149 · Ouro R$ 299 · Platinum R$ 599/mês |
| 2 | Assinatura mão de obra | Gratuito (5 propostas/mês) · Profissional R$ 39 · Premium R$ 79/mês |
| 3 | Assinatura cliente | Gratuito · Premium R$ 29 · PRO R$ 59/mês |
| 4 | Comissão escrow | 2%–5% por transação (**principal receita no longo prazo**) |
| 5 | Venda de plantas | 15%–25% de comissão |
| 6 | Publicidade | CPC, CPM, destaque patrocinado |
| 7 | Seguros e garantias | Comissão via seguradoras parceiras |
| 8 | Crédito e financiamento | Comissão por operação aprovada (bancos parceiros) |
| 9 | Marketplace de materiais | 3%–8% por venda |

---

## 6. Priorização — Roadmap de Releases

### MVP (Release 1) — meses 1–4 · *"Contrate com segurança"*
Foco: resolver o loop central de confiança em **uma cidade-piloto** (ex.: Vitória/ES).
1. Cadastro e onboarding dos 3 perfis (cliente, prestador, fornecedor) + KYC light
2. Marketplace de mão de obra + perfis de fornecedores (M1/M2 básicos)
3. Sistema de orçamentos com comparador (M3)
4. Hub Financeiro escrow com milestones via parceiro BaaS (M4 essencial)
5. Contratos digitais por etapa + aceite + fotos (parte do M6)
6. IA especializada v1 — chat com RAG sobre base técnica curada (M5)
7. Avaliações e nota básica (M10 parcial)

### Release 2 — meses 5–8 · *"Gerencie a obra inteira"*
8. Gestão da obra completa: cronograma, financeiro, diário (M6)
9. Compras inteligentes + lista de materiais gerada por IA (M7)
10. Ranking completo + selos Bronze→Platinum (M10)
11. Planos pagos e paywall completo (todas as assinaturas)
12. App mobile (ou PWA robusto) para prestador em canteiro

### Release 3 — meses 9–12 · *"Ecossistema"*
13. Catálogo de projetos/plantas (M8)
14. Portal de notícias + indicadores automáticos (M9)
15. Publicidade self-service (M11)
16. Seguros, crédito e antecipação de recebíveis (parcerias)
17. Expansão geográfica (capitais do Sudeste → Brasil → LatAm)

---

## 7. Requisitos Não Funcionais

- **Segurança:** LGPD by design; criptografia em repouso e trânsito; PCI-DSS delegado ao parceiro de pagamento; MFA para operações financeiras.
- **Disponibilidade:** 99,9% para fluxos de pagamento; degradação graciosa da IA.
- **Performance:** LCP < 2,5 s no 4G (público de canteiro usa Android intermediário).
- **Mobile-first:** 100% das jornadas críticas utilizáveis em tela de 360 px.
- **Acessibilidade:** WCAG 2.1 AA nos fluxos principais.
- **Auditoria:** trilha imutável de eventos financeiros e de disputa.
- **Escalabilidade:** arquitetura preparada para multi-região (LatAm) e multi-moeda (fase futura).

---

## 8. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Regulatório (escrow/IP no Bacen) | Alto | Operar via parceiro BaaS licenciado desde o dia 1 |
| Cold start (marketplace vazio) | Alto | Lançamento em 1 cidade; aquisição manual de 200 prestadores + 50 fornecedores antes do go-live |
| Desintermediação (fechar "por fora") | Alto | Valor no escrow + garantia + selo; penalidade contratual; comissão baixa no início |
| IA responder errado em tema estrutural | Alto | RAG com fontes curadas, disclaimers, revisão de engenheiro no conteúdo-base |
| Direitos autorais (NBR/ABNT) | Médio | Resumos próprios + links oficiais; nunca reproduzir normas na íntegra |
| Concorrência (Construmarket, iFixit-likes, GetNinjas, Triider) | Médio | Diferencial = escrow + IA + gestão integrada no B2C |

---

## 9. Fora de Escopo (v1)
- BIM / colaboração de projetos executivos complexos
- Facilities e manutenção predial/industrial
- Multi-idioma e multi-moeda
- Logística própria de entrega de materiais
- Emissão própria de crédito (sempre via parceiros)

---

## 10. Glossário
- **Escrow / Conta Garantida:** custódia do pagamento até aprovação da etapa.
- **Milestone:** etapa de obra com escopo, valor, checklist e aceite.
- **RFQ:** Request for Quotation — pedido de orçamento.
- **RAG:** Retrieval-Augmented Generation — IA que responde com base em documentos indexados.
- **CUB / INCC / SINAPI:** indicadores oficiais de custo da construção.
- **BaaS / IP:** Banking as a Service / Instituição de Pagamento regulada pelo Bacen.
