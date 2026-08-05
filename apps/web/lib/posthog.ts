import posthog from "posthog-js";

/**
 * Analytics de funil (E10-03) — PostHog, fornecedor em aberto (mesma
 * categoria de S3/PSP/SMS: nenhuma conta real existe ainda). Sem
 * `NEXT_PUBLIC_POSTHOG_KEY`, `getPostHog()` devolve `null` e todo `capture`
 * chamado por quem usa este módulo vira no-op — nunca bloqueia a UI.
 * Client-only (posthog-js roda no browser); `capture_pageview` fica
 * desligado aqui porque o app router do Next não dispara evento de
 * navegação nativo — o `<PostHogPageview>` (ver components/) chama
 * `capture("$pageview")` manualmente a cada troca de rota.
 */
let initialized = false;

export function getPostHog(): typeof posthog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return null;

  if (!initialized) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      person_profiles: "identified_only",
    });
    initialized = true;
  }
  return posthog;
}
