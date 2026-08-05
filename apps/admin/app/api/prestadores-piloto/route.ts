import { NextResponse, type NextRequest } from "next/server";
import type { UserPublic } from "@conectaobra/types/auth";
import { cadastroAssistidoInputSchema } from "@/lib/cadastro-assistido";
import { ApiUnavailableError, apiFetchOrThrow } from "@/lib/api-client";
import { ACCESS_COOKIE } from "@/lib/session";

interface RegisterApiResponse {
  user: UserPublic;
  tokens:
    | { mfaRequired: false; accessToken: string; refreshToken: string; expiresIn: number }
    | { mfaRequired: true; mfaToken: string };
}

export async function POST(req: NextRequest) {
  // Sessão do ADMIN logado neste painel — não é o token usado nas chamadas
  // abaixo (essas usam o token do prestador recém-criado, ver adiante).
  const adminAccessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!adminAccessToken) {
    return NextResponse.json({ message: "Sem sessão" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = cadastroAssistidoInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  let registerRes: Response;
  try {
    registerRes = await apiFetchOrThrow("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        tipo: "PRESTADOR",
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        cpfCnpj: input.cpfCnpj,
        senha: input.senha,
        aceitouTermos: true,
        aceitouPolitica: true,
      }),
    });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return NextResponse.json(
        { message: "Serviço indisponível no momento. Tente novamente em instantes." },
        { status: 502 },
      );
    }
    throw err;
  }

  const registerData = await registerRes.json();
  if (!registerRes.ok) {
    // Erro na criação da conta (e-mail/CPF já cadastrado etc.) — nada foi
    // criado, seguro devolver direto.
    return NextResponse.json(registerData, { status: registerRes.status });
  }

  const { user, tokens } = registerData as RegisterApiResponse;
  if (tokens.mfaRequired) {
    // Não deveria acontecer pra uma conta recém-criada (MFA começa desligado).
    return NextResponse.json(
      { message: "Conta criada em estado inesperado (MFA). Contate o suporte." },
      { status: 500 },
    );
  }

  let profileRes: Response;
  try {
    profileRes = await apiFetchOrThrow("/profile/prestador", {
      method: "PUT",
      headers: { authorization: `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({
        categorias: input.categorias,
        experienciaAnos: input.experienciaAnos,
        certificados: input.certificados,
        raioAtendimentoKm: input.raioAtendimentoKm,
      }),
    });
  } catch (err) {
    if (err instanceof ApiUnavailableError) {
      return NextResponse.json(
        {
          message:
            "Conta criada, mas o serviço ficou indisponível ao salvar o perfil. O prestador precisa completar o perfil depois.",
          user,
        },
        { status: 502 },
      );
    }
    throw err;
  }

  if (!profileRes.ok) {
    const profileError = await profileRes.json().catch(() => null);
    // Conta já existe nesse ponto — não há como desfazer via admin (exclusão
    // de conta exige a senha do próprio usuário, E1-08). Devolve o que foi
    // criado + o erro, pra o agente saber que precisa completar o perfil
    // manualmente depois (ou pedir pro prestador logar e preencher).
    return NextResponse.json(
      {
        message:
          "Conta criada, mas não foi possível salvar o perfil. O prestador precisa completar o perfil depois.",
        user,
        profileError,
      },
      { status: 207 },
    );
  }

  return NextResponse.json({ user }, { status: 201 });
}
