import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pong Ping - Ranking de Jogadores",
  description:
    "Descubra o ranking dos melhores jogadores de Pong Ping! Acompanhe as pontuações, estatísticas e conquistas dos competidores mais habilidosos. Veja quem está no topo do pódio e acompanhe suas jornadas para se tornar o campeão definitivo do Pong Ping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="h-full antialiased">
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
