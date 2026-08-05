import { z } from "zod";
import { cpfCnpjSchema, telefoneSchema } from "@conectaobra/types/documents";

/**
 * Cadastro assistido (E10-02) — ferramenta de campo pra onboarding dos 200
 * prestadores-piloto. Combina, num único formulário, o que no fluxo
 * self-serve são duas etapas separadas: `POST /auth/register` (conta) e
 * `PUT /profile/prestador` (perfil) — o agente de campo preenche os dois de
 * uma vez conversando com o prestador, em vez de pedir pra ele se cadastrar
 * sozinho depois (sem SMS/e-mail de convite real — P-006/notificações
 * seguem stub — pedir cadastro "depois" não teria como ser lembrado).
 * `confirmouConsentimento` mapeia pra `aceitouTermos`/`aceitouPolitica` do
 * registro — o agente confirma que explicou e o prestador aceitou
 * verbalmente, mesmo efeito legal do checkbox do cadastro self-serve.
 */
export const cadastroAssistidoInputSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(160),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  telefone: telefoneSchema,
  cpfCnpj: cpfCnpjSchema,
  senha: z
    .string()
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(72, "Senha muito longa"),
  categorias: z.array(z.string().min(1)).min(1, "Informe ao menos uma categoria"),
  experienciaAnos: z.number().int().min(0).max(80).optional(),
  certificados: z.array(z.string().min(1)).default([]),
  raioAtendimentoKm: z.number().int().positive().max(500).optional(),
  confirmouConsentimento: z.literal(true, {
    errorMap: () => ({
      message: "Confirme que o prestador aceitou os Termos de Uso e a Política de Privacidade",
    }),
  }),
});
export type CadastroAssistidoInput = z.infer<typeof cadastroAssistidoInputSchema>;
