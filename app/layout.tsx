import { FirebaseAnalytics } from "@/components/firebase-analytics";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <TooltipProvider>{children}</TooltipProvider>
        <FirebaseAnalytics />
        <Toaster richColors />
      </body>
    </html>
  );
}
