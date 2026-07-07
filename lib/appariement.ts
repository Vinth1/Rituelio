// Appariement des copies d'une évaluation (identifiées par un prénom libre saisi
// par l'élève) aux élèves de la classe officielle du carnet. Fonctions PURES,
// réutilisables côté client (pré-remplissage du mapping avant import) — aucune
// dépendance serveur.

export type CopieRef = { submissionId: string; prenom: string };
export type EleveRef = { id: string; nom: string };

// Normalise un nom pour la comparaison : sans accents, minuscules, espaces
// réduits. "Léa  M." → "lea m."
export function normaliserNom(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Premier mot (prénom) d'un nom déjà normalisé.
function premierMot(nomNorm: string): string {
  return nomNorm.split(" ")[0] ?? "";
}

// Le prénom d'une copie correspond-il à un élève ? Vrai si : égalité complète, ou
// le prénom de copie == le premier mot du nom de l'élève ("Léa" ↔ "Léa Martin"),
// ou le nom de l'élève commence par le prénom de copie. Comparaison normalisée.
function correspond(prenomNorm: string, eleveNomNorm: string): boolean {
  if (!prenomNorm || !eleveNomNorm) return false;
  if (prenomNorm === eleveNomNorm) return true;
  if (prenomNorm === premierMot(eleveNomNorm)) return true;
  if (eleveNomNorm.startsWith(prenomNorm + " ")) return true;
  return false;
}

// Id de l'élève apparié SANS AMBIGUÏTÉ à ce prénom, ou null si aucun candidat ou
// plusieurs (→ le prof tranche à la main).
export function apparierPrenom(prenom: string, eleves: EleveRef[]): string | null {
  const p = normaliserNom(prenom);
  const candidats = eleves.filter((e) => correspond(p, normaliserNom(e.nom)));
  return candidats.length === 1 ? candidats[0].id : null;
}

// Pré-appariement de toutes les copies : pour chaque submissionId, l'eleveId
// proposé ou null. Un élève réclamé par PLUSIEURS copies est laissé non apparié
// pour toutes les copies concernées (on ne devine pas : résolution manuelle).
export function apparierCopies(
  copies: CopieRef[],
  eleves: EleveRef[],
): Record<string, string | null> {
  const propose: Record<string, string | null> = {};
  const compteur = new Map<string, number>();
  for (const c of copies) {
    const id = apparierPrenom(c.prenom, eleves);
    propose[c.submissionId] = id;
    if (id) compteur.set(id, (compteur.get(id) ?? 0) + 1);
  }
  for (const c of copies) {
    const id = propose[c.submissionId];
    if (id && (compteur.get(id) ?? 0) > 1) propose[c.submissionId] = null;
  }
  return propose;
}
