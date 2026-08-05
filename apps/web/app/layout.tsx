import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@conectaobra/ui/styles.css";
import { PostHogPageview } from "@/components/posthog-pageview";

export const metadata: Metadata = {
  title: "ConectaObra",
  description:
    "Marketplace da construção civil com pagamento garantido (escrow) e IA especializada.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Suspense fallback={null}>
          <PostHogPageview />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
