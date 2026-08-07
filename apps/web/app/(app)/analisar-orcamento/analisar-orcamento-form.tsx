"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  analisarOrcamentoInputSchema,
  type AnalisarOrcamentoInput,
  type AnaliseOrcamentoOutput,
} from "@conectaobra/types/ai-budget";
import { Alert, AlertDescription, Badge, Button, Card, CardContent, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CLASSIFICACAO_LABEL: Record<string, string> = {
  ABAIXO_DA_MEDIA: "Abaixo da média regional",
  DENTRO_DA_MEDIA: "Dentro da média regional",
  ACIMA_DA_MEDIA: "Acima da média regional",
};

const CLASSIFICACAO_BADGE: Record<string, "verified" | "warning" | "danger"> = {
  ABAIXO_DA_MEDIA: "verified",
  DENTRO_DA_MEDIA: "warning",
  ACIMA_DA_MEDIA: "danger",
};

export function AnalisarOrcamentoForm({
  defaultServico,
  defaultCidade,
  defaultValorCentavos,
}: {
  defaultServico?: string;
  defaultCidade?: string;
  defaultValorCentavos?: number;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<AnaliseOrcamentoOutput | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnalisarOrcamentoInput>({
    resolver: zodResolver(analisarOrcamentoInputSchema),
    defaultValues: {
      servico: defaultServico ?? "",
      cidade: defaultCidade ?? "",
      valorPropostoCentavos: defaultValorCentavos,
    },
  });

  async function onSubmit(values: AnalisarOrcamentoInput) {
    setErro(null);
    setResultado(null);
    const res = await fetch("/api/ai/analisar-orcamento", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(
        typeof data?.message === "string" ? data.message : "Não foi possível analisar o orçamento.",
      );
      return;
    }
    setResultado(data);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-4">
          {erro && (
            <Alert variant="danger">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2 flex flex-col gap-3">
            <FormField label="Serviço" htmlFor="servico" error={errors.servico?.message}>
              <Input id="servico" placeholder="Pintura, elétrica, hidráulica…" {...register("servico")} />
            </FormField>

            <FormField label="Cidade" htmlFor="cidade" error={errors.cidade?.message}>
              <Input id="cidade" placeholder="Vitória/ES" {...register("cidade")} />
            </FormField>

            <FormField
              label="Valor proposto (R$)"
              htmlFor="valorPropostoCentavos"
              error={errors.valorPropostoCentavos?.message}
            >
              <Input
                id="valorPropostoCentavos"
                type="number"
                step="0.01"
                min="0"
                {...register("valorPropostoCentavos", {
                  setValueAs: (v: string) => (v === "" ? undefined : Math.round(Number(v) * 100)),
                })}
              />
            </FormField>

            <Button type="submit" size="sm" className="self-start" disabled={isSubmitting}>
              {isSubmitting ? "Analisando…" : "Analisar orçamento"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-grafite">
                {resultado.servico} · {resultado.cidade}
              </span>
              {resultado.classificacao && (
                <Badge variant={CLASSIFICACAO_BADGE[resultado.classificacao] ?? "default"}>
                  {CLASSIFICACAO_LABEL[resultado.classificacao] ?? resultado.classificacao}
                </Badge>
              )}
            </div>
            <p className="text-lg font-black text-laranja">
              {formatMoney(resultado.valorPropostoCentavos)}
            </p>
            {resultado.custoMedioRegional && (
              <p className="text-xs text-[#7A828C]">
                Faixa regional: {formatMoney(resultado.custoMedioRegional.valorMinCentavos)} –{" "}
                {formatMoney(resultado.custoMedioRegional.valorMaxCentavos)} (média{" "}
                {formatMoney(resultado.custoMedioRegional.valorMedCentavos)} /{" "}
                {resultado.custoMedioRegional.unidade})
                {resultado.percentualDesvioDaMedia !== null && (
                  <>
                    {" "}
                    · desvio de {resultado.percentualDesvioDaMedia > 0 ? "+" : ""}
                    {resultado.percentualDesvioDaMedia.toFixed(1)}% da média
                  </>
                )}
              </p>
            )}
            <p className="text-sm text-grafite/80">{resultado.mensagem}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
