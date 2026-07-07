import EditeurEpreuve from "@/components/epreuves/EditeurEpreuve";

type Ctx = { params: Promise<{ id: string }> };

// La garde d'auth est assurée par le layout /prof/epreuves.
export default async function PageEditeurEpreuve({ params }: Ctx) {
  const { id } = await params;
  return <EditeurEpreuve epreuveId={id} />;
}
