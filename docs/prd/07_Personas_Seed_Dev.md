# Personas de Seed — Ambiente de Dev

> Gerado por `services/api/prisma/seed.ts` (rodar com `pnpm --filter @conectaobra/api seed`).
> Dados fictícios — CPF/CNPJ e demais informações não são reais. Usar apenas em ambiente local/dev.

Todos os usuários abaixo compartilham a mesma senha de teste: **`senha12345`**.

| Persona | Nome | Email | Tipo | Observações |
|---|---|---|---|---|
| Admin | Admin ConectaObra | admin@conectaobra.example.com | ADMIN | Mediador de disputas (E4-09) |
| Cliente | Ana Cliente | ana.cliente@example.com | CLIENTE_PF | Dono da obra/RFQ de exemplo |
| Prestador | Carlos Prestador | carlos.prestador@example.com | PRESTADOR | Categorias: elétrica, hidráulica |
| Engenheiro | Júlia Engenheira | julia.engenheira@example.com | TECNICO | Reaproveita ProfilePrestador (P-015); CREA-ES 123456 |
| Fornecedor | Materiais Vitória Ltda | contato@materiaisvitoria.example.com | FORNECEDOR | Categorias: cimento, acabamento |

## Como testar

```bash
curl -X POST http://localhost:3355/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@conectaobra.example.com","senha":"senha12345"}'
```

(ajustar a porta/host se o docker-compose de dev estiver rodando com `API_PORT` sobrescrito).
