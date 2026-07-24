# ConectaObra 2.0 — Pacote de Kickoff de Desenvolvimento
**Versão 1.0 · Julho 2026**

Tudo o que a equipe precisa para iniciar o desenvolvimento, na ordem de leitura:

| # | Documento | Conteúdo | Público |
|---|---|---|---|
| 01 | `01_PRD_ConectaObra_2.0.md` | Visão, personas, KPIs, módulos, roadmap de releases, riscos | Todos |
| 02 | `02_Especificacao_Tecnica.md` | Stack proposto, arquitetura, modelo de dados, APIs, RAG, compliance | Engenharia |
| 03 | `03_Estrutura_Projeto.md` | Monorepo, pastas, convenções, setup local | Engenharia |
| 04 | `04_Tasks_Backlog.md` | Sprint 0 + 10 épicos com tasks, prioridades e estimativas | PM + Engenharia |
| 05 | `05_Skills_e_Checklists.md` | Matriz de skills da equipe, DoR/DoD, checklists de escrow, IA e go-live | Todos |
| 06 | `06_Wireframes_ConectaObra.html` | Guia de cores + 10 wireframes navegáveis (abrir no navegador) | Design + Produto |

## Decisões pendentes antes do Sprint 0
1. **Stack tecnológico:** o documento de visão referenciava um stack fechado que não foi anexado — a especificação (doc 02) traz uma proposta marcada `[A VALIDAR]`. Confirmar ou substituir.
2. **PSP/BaaS do escrow:** spike S0-07 (Asaas, Pagar.me, Iugu, Dock ou QI Tech) — decisão mais crítica do projeto.
3. **Cidade-piloto:** sugerida Vitória/ES (exemplo da visão). Confirmar.
4. **Engenheiro civil consultor:** contratação necessária antes do épico E5 (base da IA).

## Primeiros 5 dias
- Dia 1: kickoff, validar stack e cidade-piloto, abrir contas sandbox (PSP, KYC, assinatura)
- Dia 2–3: S0-01/02/03 (monorepo, Docker, CI) + início do Design System (S0-04) a partir dos tokens dos wireframes
- Dia 4–5: schema Prisma (S0-05) + POC do PSP (S0-07)
