# @conectaobra/ui

Design System v0 do ConectaObra 2.0 (task **S0-04**). Tokens e componentes fiéis à
paleta e aos padrões definidos em `CLAUDE.md §6` e nos wireframes
(`docs/prd/06_Wireframes_ConectaObra.html`).

## Conteúdo

- `src/tokens/` — cores, tipografia, radius e shadow (fonte de verdade dos tokens).
- `tailwind.preset.ts` — preset Tailwind com os tokens acima, para os apps consumirem.
- `src/styles/globals.css` — variáveis CSS + estilos base (fonte, fundo, faixa `.hazard`).
- `src/components/` — 15 componentes base: `Button`, `Badge`, `Card`, `Input`,
  `Textarea`, `Select`, `Checkbox`, `Tabs`, `Dialog`, `Alert` (com variante
  `disclaimer` para avisos da IA), `Progress`, `Avatar`, `StatusPill`,
  `ChatBubble`, `StepIndicator`.

Stack: Tailwind CSS + Radix UI + `class-variance-authority`, conforme
`docs/prd/02_Especificacao_Tecnica.md`.

## Uso nos apps (`apps/web`, `apps/admin`)

```ts
// tailwind.config.ts do app
import uiPreset from "@conectaobra/ui/tailwind.preset";

export default {
  presets: [uiPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
```

```tsx
import "@conectaobra/ui/styles.css";
import { Button, Badge } from "@conectaobra/ui";
```

## Status

Escrito nesta sessão sem `pnpm install` (sem acesso à rede no ambiente) — ver
`PENDENCIAS.md` P-007. Antes de consumir em `apps/web`/`apps/admin`, rodar:

```bash
pnpm install
pnpm --filter @conectaobra/ui build
```

e validar tipos/lint (`pnpm --filter @conectaobra/ui lint`).

Pendente para uma próxima iteração: `Table`, `Tooltip`, `RadioGroup`, `Switch`,
`Spinner`/`Skeleton` e o setup de Storybook para revisão visual pelo Product
Designer (ver `05_Skills_e_Checklists.md`, papel Product Designer em S0-04).
