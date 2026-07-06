import type { Metadata } from "next";
import PrepaHebdo from "@/components/ma-classe/PrepaHebdo";

export const metadata: Metadata = {
  title: "Prépa hebdo — Ma classe — Rituelio",
};

// La garde d'auth est assurée par app/ma-classe/layout.tsx.
// searchParams (date, creneau) permet d'ouvrir directement une fiche (deep-link
// depuis le tableau de bord).
export default async function PagePrepa({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; creneau?: string }>;
}) {
  const { date, creneau } = await searchParams;
  return <PrepaHebdo dateInitiale={date} creneauInitial={creneau} />;
}
