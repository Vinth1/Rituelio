import { jeux } from "@/data/jeux";
import Catalogue from "@/components/Catalogue";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="sr-only">Rituelio — catalogue des jeux et rituels</h1>
      <Catalogue jeux={jeux} />
    </div>
  );
}
