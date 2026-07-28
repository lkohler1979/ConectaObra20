"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerInputSchema,
  type PublicUserType,
  type RegisterInput,
} from "@conectaobra/types/auth";
import { Alert, AlertDescription, Button, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

const TIPO_OPTIONS: { value: PublicUserType; label: string }[] = [
  { value: "CLIENTE_PF", label: "Cliente (pessoa física)" },
  { value: "CLIENTE_PJ", label: "Cliente (empresa)" },
  { value: "PRESTADOR", label: "Prestador de serviço" },
  { value: "FORNECEDOR", label: "Fornecedor de materiais" },
];

export default function CadastroPage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { tipo: "CLIENTE_PF" },
  });

  async function onSubmit(values: RegisterInput) {
    setErro(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string"
          ? data.message
          : "Não foi possível concluir o cadastro. Tente novamente.",
      );
      return;
    }

    router.push("/conta");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-areia px-5 py-10">
      <div>
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-black text-grafite">Criar conta</h1>
        <p className="mt-1 text-sm text-[#5B6875]">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-azul-planta">
            Entrar
          </Link>
        </p>
      </div>

      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Eu sou" htmlFor="tipo" error={errors.tipo?.message}>
          <select
            id="tipo"
            {...register("tipo")}
            className="w-full rounded-md border-[1.5px] border-concreto bg-white px-3 py-[11px] text-sm text-grafite focus:border-azul-planta focus:outline-none focus:ring-2 focus:ring-azul-planta-claro"
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Nome completo" htmlFor="nome" error={errors.nome?.message}>
          <Input id="nome" autoComplete="name" {...register("nome")} />
        </FormField>

        <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>

        <FormField label="Telefone (com DDD)" htmlFor="telefone" error={errors.telefone?.message}>
          <Input
            id="telefone"
            autoComplete="tel"
            placeholder="27999998888"
            {...register("telefone")}
          />
        </FormField>

        <FormField label="CPF ou CNPJ" htmlFor="cpfCnpj" error={errors.cpfCnpj?.message}>
          <Input id="cpfCnpj" placeholder="Só números" {...register("cpfCnpj")} />
        </FormField>

        <FormField label="Senha" htmlFor="senha" error={errors.senha?.message}>
          <Input id="senha" type="password" autoComplete="new-password" {...register("senha")} />
        </FormField>

        <label className="flex items-start gap-2 text-sm text-grafite">
          <input type="checkbox" className="mt-1" {...register("aceitouTermos")} />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="font-semibold text-azul-planta">
              Termos de Uso
            </Link>
          </span>
        </label>
        {errors.aceitouTermos && (
          <p className="-mt-3 text-xs text-vermelho">{errors.aceitouTermos.message}</p>
        )}

        <label className="flex items-start gap-2 text-sm text-grafite">
          <input type="checkbox" className="mt-1" {...register("aceitouPolitica")} />
          <span>
            Li e aceito a{" "}
            <Link href="/privacidade" className="font-semibold text-azul-planta">
              Política de Privacidade
            </Link>
          </span>
        </label>
        {errors.aceitouPolitica && (
          <p className="-mt-3 text-xs text-vermelho">{errors.aceitouPolitica.message}</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
    </main>
  );
}
