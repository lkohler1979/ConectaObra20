"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserPublic } from "@conectaobra/types/auth";
import {
  cadastroAssistidoInputSchema,
  type CadastroAssistidoInput,
} from "@/lib/cadastro-assistido";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
} from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

/** Campos de lista (categorias/certificados) usam texto separado por vírgula — mesmo padrão do perfil self-serve. */
function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

interface CadastradoNaSessao {
  user: UserPublic;
  perfilCompleto: boolean;
}

export function PilotoForm({ contagemInicial }: { contagemInicial: number }) {
  const [cadastrados, setCadastrados] = useState<CadastradoNaSessao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CadastroAssistidoInput>({
    resolver: zodResolver(cadastroAssistidoInputSchema),
  });

  async function onSubmit(values: CadastroAssistidoInput) {
    setErro(null);
    setAviso(null);
    const res = await fetch("/api/prestadores-piloto", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);

    if (res.status === 201) {
      setCadastrados((prev) => [{ user: data.user, perfilCompleto: true }, ...prev]);
      reset();
      return;
    }
    if (res.status === 207) {
      setCadastrados((prev) => [{ user: data.user, perfilCompleto: false }, ...prev]);
      setAviso(
        typeof data?.message === "string"
          ? data.message
          : "Conta criada, mas o perfil não foi salvo.",
      );
      reset();
      return;
    }
    setErro(
      typeof data?.message === "string" ? data.message : "Não foi possível cadastrar o prestador.",
    );
  }

  const total = contagemInicial + cadastrados.length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-4">
          <div>
            <CardTitle>Progresso do piloto</CardTitle>
            <p className="text-sm text-[#5B6875]">Meta: 200 prestadores cadastrados</p>
          </div>
          <span className="text-2xl font-black text-laranja">{total}/200</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {erro && (
            <Alert variant="danger">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}
          {aviso && (
            <Alert variant="disclaimer">
              <AlertDescription>{aviso}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2 flex flex-col gap-3">
            <FormField label="Nome completo" htmlFor="nome" error={errors.nome?.message}>
              <Input id="nome" {...register("nome")} />
            </FormField>

            <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" {...register("email")} />
            </FormField>

            <FormField label="Telefone (com DDD)" htmlFor="telefone" error={errors.telefone?.message}>
              <Input id="telefone" placeholder="27999998888" {...register("telefone")} />
            </FormField>

            <FormField label="CPF ou CNPJ" htmlFor="cpfCnpj" error={errors.cpfCnpj?.message}>
              <Input id="cpfCnpj" placeholder="Só números" {...register("cpfCnpj")} />
            </FormField>

            <FormField
              label="Senha temporária (informe ao prestador)"
              htmlFor="senha"
              error={errors.senha?.message}
            >
              <Input id="senha" type="text" {...register("senha")} />
            </FormField>

            <FormField
              label="Categorias (separadas por vírgula)"
              htmlFor="categorias"
              error={errors.categorias?.message}
            >
              <Input
                id="categorias"
                placeholder="pedreiro, eletricista, pintor"
                {...register("categorias", { setValueAs: (v: string) => fromCsv(v) })}
              />
            </FormField>

            <FormField
              label="Experiência (anos, opcional)"
              htmlFor="experienciaAnos"
              error={errors.experienciaAnos?.message}
            >
              <Input
                id="experienciaAnos"
                type="number"
                min={0}
                {...register("experienciaAnos", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </FormField>

            <FormField
              label="Certificados (separados por vírgula, opcional)"
              htmlFor="certificados"
              error={errors.certificados?.message}
            >
              <Input
                id="certificados"
                placeholder="CREA-ES 123456"
                {...register("certificados", { setValueAs: (v: string) => fromCsv(v) })}
              />
            </FormField>

            <FormField
              label="Raio de atendimento (km, opcional)"
              htmlFor="raioAtendimentoKm"
              error={errors.raioAtendimentoKm?.message}
            >
              <Input
                id="raioAtendimentoKm"
                type="number"
                min={0}
                {...register("raioAtendimentoKm", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
              />
            </FormField>

            <label className="flex items-start gap-2 text-sm text-grafite">
              <input type="checkbox" className="mt-1" {...register("confirmouConsentimento")} />
              <span>
                Confirmo que expliquei os Termos de Uso e a Política de Privacidade e o prestador
                aceitou verbalmente.
              </span>
            </label>
            {errors.confirmouConsentimento && (
              <p className="-mt-2 text-xs text-vermelho">
                {errors.confirmouConsentimento.message}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="self-start">
              {isSubmitting ? "Cadastrando…" : "Cadastrar prestador"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {cadastrados.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold text-grafite">Cadastrados nesta sessão</h2>
          <div className="flex flex-col gap-2">
            {cadastrados.map(({ user, perfilCompleto }) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <span className="text-sm font-bold text-grafite">{user.nome}</span>
                    <p className="text-xs text-[#7A828C]">{user.email}</p>
                  </div>
                  {!perfilCompleto && <Badge variant="warning">Perfil incompleto</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
