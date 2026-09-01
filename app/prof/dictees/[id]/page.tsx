import EditeurDictee from "@/components/dictees/EditeurDictee";

type Ctx = { params: Promise<{ id: string }> };

// La garde d'auth est assurée par le layout /prof/dictees.
export default async function PageEditeurDictee({ params }: Ctx) {
  const { id } = await params;
  return <EditeurDictee dicteeId={id} />;
}
