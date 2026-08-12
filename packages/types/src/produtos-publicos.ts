import { z } from "zod";

/** `GET /public/produtos/:id` — página pública individual do produto. */
export const publicProdutoDetalheSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  categoria: z.string(),
  descricao: z.string().nullable(),
  precoCentavos: z.number().int(),
  unidade: z.string(),
  fotos: z.array(z.string()),
  fornecedorId: z.string().uuid(),
  fornecedorNome: z.string(),
});
export type PublicProdutoDetalhe = z.infer<typeof publicProdutoDetalheSchema>;
