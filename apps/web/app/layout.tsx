import type { Metadata, Viewport } from "next";
import "@conectaobra/ui/styles.css";

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
      <body>{children}</body>
    </html>
  );
}
