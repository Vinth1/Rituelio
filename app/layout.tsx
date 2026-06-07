import type { Metadata } from "next";
import { Nunito, Fredoka, Gochi_Hand, Quicksand } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import EnTete from "@/components/EnTete";

// Corps de texte mode jour (« Bonbon Pop ») : Nunito, arrondie et lisible.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

// Titres mode jour : Fredoka (police variable, gourmande et ronde).
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

// Titres mode nuit (« Tableau ») : Gochi Hand, façon craie (non variable → poids fixe).
const gochi = Gochi_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gochi",
});

// Corps de texte mode nuit : Quicksand (police variable).
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Rituelio — Jeux et rituels de classe",
  description:
    "Sélecteur de jeux et d'activités pour l'enseignement du français.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${nunito.variable} ${fredoka.variable} ${gochi.variable} ${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-fond text-encre">
        <Providers>
          <EnTete />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
