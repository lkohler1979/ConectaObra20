"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getPostHog } from "@/lib/posthog";

/** Dispara `$pageview` a cada troca de rota do App Router — posthog-js não escuta isso sozinho (SPA). */
export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const client = getPostHog();
    if (!client) return;
    const query = searchParams.toString();
    client.capture("$pageview", { $current_url: query ? `${pathname}?${query}` : pathname });
  }, [pathname, searchParams]);

  return null;
}
