// Route du mode projection : charge le jeu et affiche la vue plein écran.
import { notFound } from "next/navigation";
import { jeux } from "@/data/jeux";
import VueProjection from "@/components/VueProjection";

export default async function PageProjection({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jeu = jeux.find((j) => j.id === id);
  if (!jeu) notFound();
  return <VueProjection jeu={jeu} />;
}
