"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@conectaobra/ui";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      {loading ? "Saindo…" : "Sair"}
    </Button>
  );
}
