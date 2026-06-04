import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import EnTete from "@/components/EnTete";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
