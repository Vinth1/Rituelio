// Types partagés du module Comportement (client + serveur) et calculs PURS.
// La taxonomie (types de faits, listes de raisons) et le barème de points de la
// « balance » sont repris TELS QUELS du classeur école ITSW
// (Behaviour Tracking Document, feuille « Formatting ») pour rester compatibles
// avec le circuit officiel (ClassDojo). Aucun accès réseau/DB ici.

import { ajouterJours, deIso, isoDe, lundiDe } from "./semaine";

// Les 5 types de faits atomiques du classeur (colonne « Behaviour grades »).
// Gold Award / Behaviour Contract / Student Profile Award / Gold Pin sont des
// ESCALADES (récompenses/sanctions dérivées) et relèvent des conséquences (PR 7).
export type TypeFait = "merit" | "demerit" | "incident" | "accident" | "win-cident";

export type FaitComportement = {
  id: string;
  eleveId: string;
  classeId: string;
  dateISO: string; // "AAAA-MM-JJ"
  type: TypeFait;
  raison: string; // taxonomie école (ou texte libre pour accident / win-cident)
  details?: string;
  consequenceId?: string; // undefined en PR 6 (le lien se fera en PR 7)
};

export type InfoType = {
  cle: TypeFait;
  libelle: string; // libellé officiel ITSW (conservé tel quel)
  description: string; // aide en français
  points: number; // contribution à la balance (barème classeur école)
  couleur: string; // clé d'accent lib/couleurs.ts
  positif: boolean; // pour le regroupement visuel
};

// Barème de points de la balance = feuille « Formatting » du classeur (V34:W43) :
//   Merit +1 · Demerit −1 · Incident −4 · Accident 0 · Win-cident +4.
// (Gold Award +3 et Behaviour Contract −8 sont des escalades → PR 7.)
export const TYPES_FAIT: InfoType[] = [
  {
    cle: "merit",
    libelle: "Merit",
    description: "Comportement positif remarqué.",
    points: 1,
    couleur: "green",
    positif: true,
  },
  {
    cle: "win-cident",
    libelle: "Win-cident",
    description: "Acte positif exceptionnel (au-delà d'un merit).",
    points: 4,
    couleur: "teal",
    positif: true,
  },
  {
    cle: "demerit",
    libelle: "Demerit",
    description: "Manquement mineur aux règles.",
    points: -1,
    couleur: "amber",
    positif: false,
  },
  {
    cle: "incident",
    libelle: "Incident",
    description: "Fait grave (ou cumul de demerits).",
    points: -4,
    couleur: "rose",
    positif: false,
  },
  {
    cle: "accident",
    libelle: "Accident",
    description: "Incident non intentionnel (sans point).",
    points: 0,
    couleur: "blue",
    positif: false,
  },
];

const PAR_CLE = new Map(TYPES_FAIT.map((t) => [t.cle, t]));

export function infoType(type: TypeFait): InfoType {
  return PAR_CLE.get(type) ?? TYPES_FAIT[0];
}

export function estTypeFait(x: unknown): x is TypeFait {
  return typeof x === "string" && PAR_CLE.has(x as TypeFait);
}

// Listes de raisons reprises TELLES QUELLES du classeur (feuille « Formatting »,
// lignes Merit/Demerit/Incident). Accident et Win-cident n'ont pas de liste
// prédéfinie dans le classeur → saisie en texte libre.
export const RAISONS: Record<TypeFait, string[]> = {
  merit: [
    "following the school rules more than 95% of the time during the preceding week",
    "helping other pupils in a meaningful way without being asked",
    "keeping lockers/cubbies tidy without being reminded",
    "reading 3 grade-level books a month (one in each learned language)",
    "completing extra credit projects/assignments",
    "entering subject competitions",
    "keeping notebooks clean and tidy",
    "following proper line and hallway behavior",
    "proper breaks/canteen behavior",
    "Followed the 5 school rules throughout the entire lesson",
    "Submitting Homework",
    "Cleaning the Classroom",
    "Outstanding class participation",
    "proper in/out transfer behavior",
  ],
  demerit: [
    "not following school rules 15% or more during the previous week",
    "touching/eating someone else's food",
    "continuing to play in a dangerous manner/ in an out of bounds area after being warned",
    "not changing shoes",
    "making negative comments about others",
    "not having all necessary supplies in the classroom for lessons",
    "throwing items without the permission of a teacher",
    "lying",
    "not dressing appropriately for outdoors",
    "not following proper line and hallway behavior",
    "repeated misbehaviors in class",
    "improper breaks/canteen behavior",
    "misbehaving during in/out transfer",
    "walking around school by himself/herself",
    "improper use of school property",
    "not submitting homework",
    "not cleaning the classroom",
    "late to class/school",
    "refusing to complete work",
  ],
  incident: [
    "3 demerits in a week",
    "10 demerits in a trimester",
    "Rough Play Resulting in a Minor Injury",
    "Bullying",
    "Stealing",
    "Anything of a sexual nature",
    "using derogatory language linked to race, nationality, culture",
    "inappropriate bathroom and changing etiquette",
    "inappropriate laptop usage",
    "Possession of dangerous or hazardous items (lighters, knives, etc.)",
    "Writing or drawing on or intentionally damaging school property",
    "Incidents of physical harm either inflicted by another pupil on purpose",
    "public safety (running in street, touching cars, etc.)",
    "Playing with toys or electronic devices - first offence",
    "Playing with toys or electronic devices - second offence",
    "Playing with toys or electronic devices - third offence",
    "Failure to comply with an assigned consequence",
  ],
  accident: [],
  "win-cident": [],
};

// ===== Calculs de balance =====

// Balance de points d'une liste de faits (compatible colonne « Balance » du doc).
export function balance(faits: { type: TypeFait }[]): number {
  return faits.reduce((s, f) => s + infoType(f.type).points, 0);
}

// Nombre de faits par type.
export function compteParType(faits: { type: TypeFait }[]): Record<TypeFait, number> {
  const base: Record<TypeFait, number> = {
    merit: 0,
    demerit: 0,
    incident: 0,
    accident: 0,
    "win-cident": 0,
  };
  for (const f of faits) base[f.type] += 1;
  return base;
}

// ===== Suggestions d'escalade (comptage + signalement, sans rien créer) =====
// Seuils du classeur, sur des fenêtres calculables sans configuration (semaine
// ISO lundi→dimanche, mois calendaire). Le seuil « 10 demerits par trimestre →
// Incident » existe aussi au classeur mais requiert les bornes de trimestre
// (réglages) : il sera branché avec les conséquences (PR 7).
export type Fenetre = "semaine" | "mois";

export type Seuil = {
  type: TypeFait;
  fenetre: Fenetre;
  seuil: number;
  suggestion: string; // escalade proposée au prof (jamais créée automatiquement)
};

export const SEUILS: Seuil[] = [
  { type: "merit", fenetre: "semaine", seuil: 5, suggestion: "Gold Award" },
  { type: "demerit", fenetre: "semaine", seuil: 3, suggestion: "Incident" },
  { type: "incident", fenetre: "semaine", seuil: 2, suggestion: "Behaviour Contract" },
  { type: "incident", fenetre: "mois", seuil: 3, suggestion: "Behaviour Contract" },
];

const LIBELLE_FENETRE: Record<Fenetre, string> = {
  semaine: "cette semaine",
  mois: "ce mois-ci",
};

// Vrai si `dateISO` tombe dans la fenêtre (semaine ISO ou mois) contenant `refISO`.
function dansFenetre(dateISO: string, fenetre: Fenetre, refISO: string): boolean {
  if (fenetre === "mois") return dateISO.slice(0, 7) === refISO.slice(0, 7);
  const lundi = lundiDe(deIso(refISO));
  const dimanche = ajouterJours(lundi, 6);
  return dateISO >= lundi && dateISO <= dimanche;
}

export type SignalEscalade = {
  seuil: Seuil;
  compte: number;
  message: string;
};

// Évalue les seuils atteints pour une liste de faits (d'un même élève), à la date
// `refISO` (aujourd'hui par défaut d'appel). Affichage seulement : ne crée rien.
export function evaluerSeuils(
  faits: { type: TypeFait; dateISO: string }[],
  refISO: string,
): SignalEscalade[] {
  const signaux: SignalEscalade[] = [];
  for (const s of SEUILS) {
    const compte = faits.filter(
      (f) => f.type === s.type && dansFenetre(f.dateISO, s.fenetre, refISO),
    ).length;
    if (compte >= s.seuil) {
      const info = infoType(s.type);
      signaux.push({
        seuil: s,
        compte,
        message: `${compte} ${info.libelle.toLowerCase()}${
          compte > 1 ? "s" : ""
        } ${LIBELLE_FENETRE[s.fenetre]} — envisager « ${s.suggestion} » ?`,
      });
    }
  }
  return signaux;
}

// Date du jour en ISO local (raccourci pour les valeurs par défaut d'UI).
export function aujourdhuiISO(): string {
  return isoDe(new Date());
}
