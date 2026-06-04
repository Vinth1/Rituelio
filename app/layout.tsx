import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MenuLateral from "@/components/MenuLateral";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-800">
        <div className="flex min-h-screen flex-col md:flex-row">
          {/* Menu latéral : marque + catégories */}
          <aside className="border-b border-slate-200 bg-white p-4 md:w-64 md:shrink-0 md:border-r md:border-b-0">
            <div className="mb-6 flex items-center gap-2 px-2">
              <span className="text-2xl" aria-hidden="true">
                🎲
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Rituelio
              </span>
            </div>
            <MenuLateral />
          </aside>

          {/* Zone principale : chaque page s'affiche ici */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
