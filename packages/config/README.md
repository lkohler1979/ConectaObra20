# @conectaobra/config

Validação de variáveis de ambiente com zod, usada por todos os serviços no boot
(CLAUDE.md §5). Ver `src/env.ts`.

```ts
import { z } from "zod";
import { baseEnvSchema, parseEnv } from "@conectaobra/config/env";

const envSchema = baseEnvSchema.extend({
  MEILISEARCH_HOST: z.string().url(),
});

export const env = parseEnv(envSchema);
```

Falhar rápido: se uma variável obrigatória faltar ou for inválida, `parseEnv`
lança um erro legível no boot em vez de deixar o serviço subir com config
quebrada.
