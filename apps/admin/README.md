# @conectaobra/admin

Painel interno (moderação de perfis, disputas, conteúdo) — E10-01. Next.js, mesmo padrão de `apps/web` (Route Handlers proxeando `services/api`, cookies httpOnly). Acesso exclusivo a contas `ADMIN`; login rejeita qualquer outro tipo antes de emitir cookie de sessão.

Roda em `http://localhost:3001` (`pnpm --filter @conectaobra/admin dev`). Ver `docs/prd/03_Estrutura_Projeto.md` para a estrutura-alvo deste workspace.
