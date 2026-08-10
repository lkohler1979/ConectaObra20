"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  surplusCheckoutInputSchema,
  type SurplusCheckoutInput,
  type SurplusOrderPublic,
} from "@conectaobra/types/material-surplus";
import { Alert, AlertDescription, Button, Card, CardContent, Input } from "@conectaobra/ui";
import { FormField } from "@/components/form-field";

function formatMoney(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CheckoutForm({ listingId }: { listingId: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pedido, setPedido] = useState<SurplusOrderPublic | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SurplusCheckoutInput>({
    resolver: zodResolver(surplusCheckoutInputSchema),
  });

  async function onSubmit(values: SurplusCheckoutInput) {
    setErro(null);
    const res = await fetch(`/api/surplus-listings/${listingId}/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setErro(typeof data?.message === "string" ? data.message : "Não foi possível concluir a compra.");
      return;
    }
    setPedido(data as SurplusOrderPublic);
  }

  if (pedido) {
    return (
      <Alert variant="success">
        <AlertDescription>
          Compra confirmada! Total pago: {formatMoney(pedido.totalPagoCentavos)}. Combine a retirada
          diretamente com o anunciante pelo contato que você informou.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <h2 className="mb-3 text-sm font-bold text-grafite">Comprar — sem precisar de conta</h2>

        {erro && (
          <Alert variant="danger">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2 flex flex-col gap-3">
          <FormField label="Seu nome" htmlFor="compradorNome" error={errors.compradorNome?.message}>
            <Input id="compradorNome" {...register("compradorNome")} />
          </FormField>

          <FormField label="Seu e-mail" htmlFor="compradorEmail" error={errors.compradorEmail?.message}>
            <Input id="compradorEmail" type="email" {...register("compradorEmail")} />
          </FormField>

          <FormField
            label="Telefone (opcional)"
            htmlFor="compradorTelefone"
            error={errors.compradorTelefone?.message}
          >
            <Input id="compradorTelefone" {...register("compradorTelefone")} />
          </FormField>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processando…" : "Comprar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
