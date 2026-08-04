import type { Metadata, Viewport } from "next";
import "@conectaobra/ui/styles.css";

export const metadata: Metadata = {
  title: "ConectaObra Admin",
  description: "Painel interno — moderação de perfis, disputas e conteúdo.",
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
      <body>{children}</body>
    </html>
  );
}
