import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import EnTete from "@/components/EnTete";

// Police arrondie et lisible, appliquée à tout le site.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
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
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <Providers>
          <EnTete />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
