# @conectaobra/types

DTOs/contratos compartilhados entre `apps/web` e `services/api`, em zod
(convenção do `03_Estrutura_Projeto.md`). O mesmo schema valida no client e
no servidor — sem duplicar regra de negócio.

- `src/documents.ts` — validação de CPF/CNPJ por dígito verificador e
  telefone (E.164 simplificado).
- `src/auth.ts` — schemas de `POST /auth/register`, `/login`, `/refresh`,
  `/otp/request`, `/otp/verify` (task E1-01).

```ts
import { registerInputSchema } from "@conectaobra/types/auth";

const parsed = registerInputSchema.safeParse(formData);
```
