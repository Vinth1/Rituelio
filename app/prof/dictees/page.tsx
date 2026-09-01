import type { Metadata } from "next";
import ListeDictees from "@/components/dictees/ListeDictees";

export const metadata: Metadata = {
  title: "Dictées — Rituelio",
  description: "Dépose tes textes de dictée et retrouve-les par hashtag.",
};

// La garde d'auth est assurée par le layout /prof/dictees.
export default function PageDictees() {
  return <ListeDictees />;
}
