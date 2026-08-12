import { z } from "zod";

/**
 * Perfis públicos (E2-03) — só campos seguros pra expor sem autenticação.
 * Nunca incluir email, telefone, cpfCnpj ou kycStatus aqui.
 */
export const publicProfileIdSchema = z.string().uuid();

export const publicPortfolioItemSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  fotos: z.array(z.string()),
});
export type PublicPortfolioItem = z.infer<typeof publicPortfolioItemSchema>;

export const publicPrestadorProfileSchema = z.object({
  userId: z.string().uuid(),
  nome: z.string(),
  categorias: z.array(z.string()),
  experienciaAnos: z.number().int().nullable(),
  raioAtendimentoKm: z.number().int().nullable(),
  selo: z.string().nullable(),
  notaMedia: z.number().nullable(),
  fotoUrl: z.string().nullable(),
  portfolio: z.array(publicPortfolioItemSchema),
});
export type PublicPrestadorProfile = z.infer<typeof publicPrestadorProfileSchema>;

export const publicProdutoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  categoria: z.string(),
  precoCentavos: z.number().int(),
  unidade: z.string(),
});
export type PublicProduto = z.infer<typeof publicProdutoSchema>;

export const publicFornecedorProfileSchema = z.object({
  userId: z.string().uuid(),
  razaoSocial: z.string(),
  categorias: z.array(z.string()),
  regioes: z.array(z.string()),
  tempoMercadoAnos: z.number().int().nullable(),
  selo: z.string().nullable(),
  notaMedia: z.number().nullable(),
  logoUrl: z.string().nullable(),
  produtos: z.array(publicProdutoSchema),
});
export type PublicFornecedorProfile = z.infer<typeof publicFornecedorProfileSchema>;
