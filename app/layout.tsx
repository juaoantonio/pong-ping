import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
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
    <html lang="pt-br" className={`${interSans} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
