"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginInputSchema, type LoginInput } from "@conectaobra/types/auth";
import { Alert, AlertDescription, Button, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";
import { safeRedirect } from "@/lib/safe-redirect";
import { getPostHog } from "@/lib/posthog";

function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
  });

  async function onSubmit(values: LoginInput) {
    setErro(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErro(
        typeof data?.message === "string"
          ? data.message
          : "Não foi possível entrar. Confira e-mail e senha.",
      );
      return;
    }

    getPostHog()?.capture("login_concluido");
    router.push(safeRedirect(searchParams.get("redirect")));
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-areia px-5 py-10">
      <div>
        <Link href="/" className="text-sm font-semibold text-grafite hover:text-laranja">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-black text-grafite">Entrar</h1>
        <p className="mt-1 text-sm text-[#5B6875]">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-azul-planta">
            Criar conta
          </Link>
        </p>
      </div>

      {erro && (
        <Alert variant="danger">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>

        <FormField label="Senha" htmlFor="senha" error={errors.senha?.message}>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            {...register("senha")}
          />
        </FormField>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}
