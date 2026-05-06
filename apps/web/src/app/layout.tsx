import { FirebaseAnalytics } from "@/components/firebase-analytics";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pong Ping - Ranking de Jogadores",
  description:
    "Descubra o ranking dos melhores jogadores de Pong Ping! Acompanhe as pontuações, estatísticas e conquistas dos competidores mais habilidosos. Veja quem está no topo do pódio e acompanhe suas jornadas para se tornar o campeão definitivo do Pong Ping.",
};

export const viewport: Viewport = {
  themeColor: "#f4f1e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="h-full antialiased">
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} antialiased`}
      >
        <TooltipProvider>{children}</TooltipProvider>
        <FirebaseAnalytics />
        <Toaster richColors />
      </body>
    </html>
  );
}
