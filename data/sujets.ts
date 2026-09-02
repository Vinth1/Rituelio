// Banque de sujets de la « Roue des verbes ». Chaque sujet porte la LIGNE de
// conjugaison qu'il commande (0 = je, 1 = tu, 2 = il/elle/on, 3 = nous,
// 4 = vous, 5 = ils/elles), c'est-à-dire son index dans `Conjugaison.formes`.
// C'est ce qui permet de faire tirer « les élèves » ou « Léa et moi » au lieu
// d'un simple pronom, sans que le jeu ait à deviner la personne.
//
// `lib/conjugaison.ts` n'expose les pronoms que sous forme de VARIANTES
// acceptées à la correction (`PRONOMS_ACCEPTES`) : il manquait une liste
// d'affichage, la voici.

export type GenreSujet = "pronom" | "groupe-nominal" | "coordonne";

export type Sujet = {
  id: string;
  libelle: string; // tel qu'il s'affiche : « les élèves »
  ligne: number; // 0..5, index dans Conjugaison.formes
  genre: GenreSujet;
  // Sujet féminin : au passé composé avec « être », le participe s'accorde
  // (« ma sœur est arrivée »). On pioche alors la variante du conjugueur.
  feminin?: boolean;
};

export const GENRES_SUJET: { genre: GenreSujet; label: string }[] = [
  { genre: "pronom", label: "Pronoms personnels" },
  { genre: "groupe-nominal", label: "Groupes nominaux" },
  { genre: "coordonne", label: "Sujets coordonnés" },
];

export const SUJETS: Sujet[] = [
  // --- Pronoms personnels ---
  { id: "je", libelle: "je", ligne: 0, genre: "pronom" },
  { id: "tu", libelle: "tu", ligne: 1, genre: "pronom" },
  { id: "il", libelle: "il", ligne: 2, genre: "pronom" },
  { id: "elle", libelle: "elle", ligne: 2, genre: "pronom", feminin: true },
  { id: "on", libelle: "on", ligne: 2, genre: "pronom" },
  { id: "nous", libelle: "nous", ligne: 3, genre: "pronom" },
  { id: "vous", libelle: "vous", ligne: 4, genre: "pronom" },
  { id: "ils", libelle: "ils", ligne: 5, genre: "pronom" },
  { id: "elles", libelle: "elles", ligne: 5, genre: "pronom", feminin: true },

  // --- Groupes nominaux, 3e personne du singulier ---
  { id: "gn-chat", libelle: "le chat", ligne: 2, genre: "groupe-nominal" },
  { id: "gn-prof", libelle: "le professeur", ligne: 2, genre: "groupe-nominal" },
  { id: "gn-soeur", libelle: "ma sœur", ligne: 2, genre: "groupe-nominal", feminin: true },
  { id: "gn-voisin", libelle: "mon voisin", ligne: 2, genre: "groupe-nominal" },
  { id: "gn-voiture", libelle: "la voiture", ligne: 2, genre: "groupe-nominal", feminin: true },
  { id: "gn-histoire", libelle: "cette histoire", ligne: 2, genre: "groupe-nominal", feminin: true },
  { id: "gn-vent", libelle: "le vent", ligne: 2, genre: "groupe-nominal" },
  { id: "gn-equipe", libelle: "toute la classe", ligne: 2, genre: "groupe-nominal", feminin: true },

  // --- Groupes nominaux, 3e personne du pluriel ---
  { id: "gn-eleves", libelle: "les élèves", ligne: 5, genre: "groupe-nominal" },
  { id: "gn-parents", libelle: "mes parents", ligne: 5, genre: "groupe-nominal" },
  { id: "gn-oiseaux", libelle: "les oiseaux", ligne: 5, genre: "groupe-nominal" },
  { id: "gn-cousines", libelle: "mes cousines", ligne: 5, genre: "groupe-nominal", feminin: true },
  { id: "gn-nuages", libelle: "les nuages", ligne: 5, genre: "groupe-nominal" },
  { id: "gn-fleurs", libelle: "les fleurs", ligne: 5, genre: "groupe-nominal", feminin: true },

  // --- Sujets coordonnés : là où l'accord se joue vraiment ---
  { id: "co-lea-moi", libelle: "Léa et moi", ligne: 3, genre: "coordonne" },
  { id: "co-frere-moi", libelle: "mon frère et moi", ligne: 3, genre: "coordonne" },
  { id: "co-toi-moi", libelle: "toi et moi", ligne: 3, genre: "coordonne" },
  { id: "co-toi-voisin", libelle: "toi et ton voisin", ligne: 4, genre: "coordonne" },
  { id: "co-paul-toi", libelle: "Paul et toi", ligne: 4, genre: "coordonne" },
  { id: "co-chien-chat", libelle: "le chien et le chat", ligne: 5, genre: "coordonne" },
];
