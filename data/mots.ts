// Données des jeux « Mot du jour » et « Pendu ».
// Pour ajouter / modifier des mots : éditer le tableau `mots` ci-dessous
// (respecter le type Mot). Les mots sont choisis pour leur difficulté de
// LECTURE (lettres muettes, consonnes doublées, graphèmes complexes) ou
// d'ORTHOGRAPHE (accents, h muet, doubles consonnes, finales piégeuses).
//
// `niveau` = le niveau où le mot s'introduit. Le « Mot du jour » filtre de façon
// CUMULATIVE : choisir « jusqu'à la 5ᵉ » pioche aussi dans le CM1, le CM2 et la
// 6ᵉ. Un mot ne doit donc figurer qu'UNE fois, à son niveau d'entrée.
//
// `note` est un indice de lecture, optionnel (ex. « le -gt final est muet »).
// Elle n'est pas affichée par le jeu aujourd'hui : la réserver aux pièges qui ne
// se devinent pas à l'œil.
//
// Le Pendu pioche dans la banque entière et normalise les accents : les mots
// accentués passent sans souci, mais éviter les ligatures « œ » / « æ », dont
// les lettres ne sont pas devinables au clavier A–Z.

import type { Niveau } from "@/lib/niveaux";

export type Mot = {
  mot: string;
  niveau: Niveau; // niveau d'entrée du mot (filtrage cumulatif)
  note?: string; // indice de lecture, optionnel
};

export const mots: Mot[] = [
  // ============================================================
  //                       CM1  (130 mots)
  // ============================================================

  // ---------- Lettres finales muettes ----------
  { mot: "doigt", niveau: "cm1", note: "le -gt final est muet (on dit « doi »)" },
  { mot: "vingt", niveau: "cm1", note: "le -gt final est muet, comme dans « doigt »" },
  { mot: "tabac", niveau: "cm1", note: "le -c final est muet (on dit « taba »)" },
  { mot: "porc", niveau: "cm1", note: "le -c final est muet (on dit « por »)" },
  { mot: "blanc", niveau: "cm1", note: "le -c final est muet (on dit « blan »)" },
  { mot: "tronc", niveau: "cm1", note: "le -c final est muet (on dit « tron »)" },
  { mot: "cerf", niveau: "cm1", note: "le -f final est muet (on dit « cèr »)" },
  { mot: "clef", niveau: "cm1", note: "le -f final est muet (se prononce « clé »)" },
  { mot: "gentil", niveau: "cm1", note: "le -l final est muet (on dit « genti »)" },
  { mot: "outil", niveau: "cm1", note: "le -l final est muet (on dit « outi »)" },
  { mot: "fusil", niveau: "cm1", note: "le -l final est muet (on dit « fusi »)" },
  { mot: "nid", niveau: "cm1", note: "le -d final est muet (on dit « ni »)" },
  { mot: "pied", niveau: "cm1", note: "le -d final est muet (on dit « pié »)" },
  { mot: "grand", niveau: "cm1", note: "le -d final est muet" },
  { mot: "rond", niveau: "cm1", note: "le -d final est muet" },
  { mot: "quand", niveau: "cm1", note: "« qu » se lit « k » et le -d est muet" },
  { mot: "renard", niveau: "cm1", note: "le -d final est muet" },
  { mot: "accord", niveau: "cm1", note: "deux c, et le -d final est muet" },
  { mot: "tapis", niveau: "cm1", note: "le -s final est muet" },
  { mot: "souris", niveau: "cm1", note: "le -s final est muet" },
  { mot: "bras", niveau: "cm1", note: "le -s final est muet" },
  { mot: "gros", niveau: "cm1", note: "le -s final est muet" },
  { mot: "jamais", niveau: "cm1", note: "le -s final est muet" },
  { mot: "toujours", niveau: "cm1", note: "le -s final est muet" },
  { mot: "temps", niveau: "cm1", note: "le -ps final est muet (on dit « tan »)" },
  { mot: "corps", niveau: "cm1", note: "le -ps final est muet (on dit « cor »)" },
  { mot: "prix", niveau: "cm1", note: "le -x final est muet" },
  { mot: "croix", niveau: "cm1", note: "le -x final est muet" },
  { mot: "voix", niveau: "cm1", note: "le -x final est muet" },
  { mot: "noix", niveau: "cm1", note: "le -x final est muet" },
  { mot: "doux", niveau: "cm1", note: "le -x final est muet" },
  { mot: "dent", niveau: "cm1", note: "le -t final est muet" },
  { mot: "chat", niveau: "cm1", note: "le -t final est muet" },
  { mot: "rat", niveau: "cm1", note: "le -t final est muet" },
  { mot: "lit", niveau: "cm1", note: "le -t final est muet" },
  { mot: "chocolat", niveau: "cm1", note: "le -t final est muet" },
  { mot: "souvent", niveau: "cm1", note: "le -t final est muet" },
  { mot: "début", niveau: "cm1", note: "le -t final est muet" },
  { mot: "bout", niveau: "cm1", note: "le -t final est muet" },
  { mot: "beaucoup", niveau: "cm1", note: "le -p final est muet" },
  { mot: "loup", niveau: "cm1", note: "le -p final est muet" },
  { mot: "sirop", niveau: "cm1", note: "le -p final est muet" },
  { mot: "drap", niveau: "cm1", note: "le -p final est muet" },
  { mot: "galop", niveau: "cm1", note: "le -p final est muet" },
  { mot: "sang", niveau: "cm1", note: "le -g final est muet (on dit « san »)" },
  { mot: "long", niveau: "cm1", note: "le -g final est muet (on dit « lon »)" },
  { mot: "poing", niveau: "cm1", note: "le -g final est muet (on dit « poin »)" },
  { mot: "tard", niveau: "cm1", note: "le -d final est muet" },

  // ---------- Prononciations surprenantes ----------
  { mot: "femme", niveau: "cm1", note: "se prononce « fame » (le e se lit « a »)" },
  { mot: "monsieur", niveau: "cm1", note: "se prononce « meussieu »" },
  { mot: "fils", niveau: "cm1", note: "le l est muet, le s se prononce (« fisse »)" },
  { mot: "oignon", niveau: "cm1", note: "se prononce « o-gnon » (le i ne se lit pas)" },
  { mot: "pays", niveau: "cm1", note: "se prononce « pé-i »" },
  { mot: "sept", niveau: "cm1", note: "le p est muet (se prononce « sète »)" },
  { mot: "maison", niveau: "cm1", note: "le s entre deux voyelles se lit « z »" },
  { mot: "moins", niveau: "cm1", note: "le -s est muet (on dit « moin »)" },

  // ---------- h muet ----------
  { mot: "heure", niveau: "cm1", note: "le h ne se prononce pas" },
  { mot: "homme", niveau: "cm1" },
  { mot: "hiver", niveau: "cm1" },
  { mot: "habiter", niveau: "cm1" },
  { mot: "histoire", niveau: "cm1" },
  { mot: "heureux", niveau: "cm1", note: "h muet au début, -x muet à la fin" },
  { mot: "hôtel", niveau: "cm1" },
  { mot: "herbe", niveau: "cm1" },
  { mot: "hirondelle", niveau: "cm1" },
  { mot: "humide", niveau: "cm1" },
  { mot: "hameau", niveau: "cm1" },
  { mot: "haut", niveau: "cm1", note: "h aspiré : on dit « le haut », et le -t est muet" },

  // ---------- Consonnes doublées ----------
  { mot: "pomme", niveau: "cm1" },
  { mot: "terre", niveau: "cm1" },
  { mot: "appeler", niveau: "cm1", note: "deux p, un seul l" },
  { mot: "flamme", niveau: "cm1" },
  { mot: "dessert", niveau: "cm1", note: "deux s (le désert n'en a qu'un)" },
  { mot: "addition", niveau: "cm1" },
  { mot: "carrefour", niveau: "cm1" },
  { mot: "ballon", niveau: "cm1" },
  { mot: "collège", niveau: "cm1" },
  { mot: "courrier", niveau: "cm1" },
  { mot: "verre", niveau: "cm1" },
  { mot: "arriver", niveau: "cm1" },
  { mot: "pierre", niveau: "cm1" },
  { mot: "serrure", niveau: "cm1" },
  { mot: "tonnerre", niveau: "cm1", note: "deux n puis deux r" },
  { mot: "personne", niveau: "cm1" },
  { mot: "donner", niveau: "cm1" },
  { mot: "année", niveau: "cm1" },
  { mot: "lunettes", niveau: "cm1" },
  { mot: "immeuble", niveau: "cm1" },
  { mot: "comment", niveau: "cm1", note: "deux m, et le -t final est muet" },
  { mot: "assiette", niveau: "cm1", note: "deux s puis deux t" },
  { mot: "poisson", niveau: "cm1" },
  { mot: "chaussure", niveau: "cm1" },
  { mot: "adresse", niveau: "cm1", note: "un seul d, mais deux s" },
  { mot: "attendre", niveau: "cm1" },
  { mot: "difficile", niveau: "cm1", note: "deux f, un seul c" },
  { mot: "effacer", niveau: "cm1" },

  // ---------- Accents et cédille ----------
  { mot: "élève", niveau: "cm1", note: "un accent aigu, puis un accent grave" },
  { mot: "fenêtre", niveau: "cm1" },
  { mot: "théâtre", niveau: "cm1", note: "th au début, accent circonflexe ensuite" },
  { mot: "bientôt", niveau: "cm1" },
  { mot: "garçon", niveau: "cm1", note: "la cédille garde le son « s »" },
  { mot: "leçon", niveau: "cm1" },
  { mot: "oiseau", niveau: "cm1" },
  { mot: "tête", niveau: "cm1" },
  { mot: "même", niveau: "cm1" },
  { mot: "rêve", niveau: "cm1" },
  { mot: "bête", niveau: "cm1" },
  { mot: "gâteau", niveau: "cm1" },
  { mot: "pâte", niveau: "cm1", note: "l'accent distingue « la pâte » de « la patte »" },
  { mot: "château", niveau: "cm1" },
  { mot: "côté", niveau: "cm1" },
  { mot: "août", niveau: "cm1", note: "se prononce « out » ou « ou »" },
  { mot: "père", niveau: "cm1" },
  { mot: "mère", niveau: "cm1" },
  { mot: "frère", niveau: "cm1" },
  { mot: "lumière", niveau: "cm1" },
  { mot: "rivière", niveau: "cm1" },
  { mot: "problème", niveau: "cm1" },
  { mot: "après", niveau: "cm1", note: "le -s final est muet" },

  // ---------- Sons complexes ----------
  { mot: "ceinture", niveau: "cm1", note: "« ein » se lit « in »" },
  { mot: "peinture", niveau: "cm1", note: "« ein » se lit « in »" },
  { mot: "besoin", niveau: "cm1", note: "« oin » se lit « ouin »" },
  { mot: "famille", niveau: "cm1", note: "ici « -ill- » se lit « y »" },
  { mot: "fille", niveau: "cm1", note: "« -ill- » se lit « y » (contrairement à « ville »)" },
  { mot: "travail", niveau: "cm1" },
  { mot: "soleil", niveau: "cm1" },
  { mot: "réveil", niveau: "cm1" },
  { mot: "vieux", niveau: "cm1", note: "le -x final est muet" },
  { mot: "yeux", niveau: "cm1", note: "se prononce « ieu » (« les yeux » = « lé-zieu »)" },
  { mot: "ancien", niveau: "cm1", note: "« ien » se lit « iin »" },

  // ============================================================
  //                       CM2  (130 mots)
  // ============================================================

  // ---------- Le groupe -ill- et ses finales ----------
  { mot: "tranquille", niveau: "cm2", note: "« -ill- » se prononce « il » (« trankil »)" },
  { mot: "ville", niveau: "cm2", note: "se prononce « vil » (pas « vi-ye »)" },
  { mot: "million", niveau: "cm2", note: "ici « -ill- » se lit « y » (« mi-lion »)" },
  { mot: "feuille", niveau: "cm2" },
  { mot: "bouteille", niveau: "cm2" },
  { mot: "brouillard", niveau: "cm2" },
  { mot: "écureuil", niveau: "cm2", note: "la finale « -euil » se lit « euye »" },
  { mot: "orgueil", niveau: "cm2", note: "« -ueil » se lit « euye » (« or-gueuye »)" },
  { mot: "cueillir", niveau: "cm2", note: "« cu » se lit « queu » (« keu-yir »)" },
  { mot: "vanille", niveau: "cm2" },
  { mot: "chenille", niveau: "cm2" },
  { mot: "papillon", niveau: "cm2" },
  { mot: "bataille", niveau: "cm2" },
  { mot: "muraille", niveau: "cm2" },
  { mot: "volaille", niveau: "cm2" },
  { mot: "épouvantail", niveau: "cm2" },
  { mot: "portefeuille", niveau: "cm2" },
  { mot: "chevreuil", niveau: "cm2" },
  { mot: "fauteuil", niveau: "cm2" },
  { mot: "bouilloire", niveau: "cm2" },
  { mot: "oreiller", niveau: "cm2" },
  { mot: "abeille", niveau: "cm2" },
  { mot: "corbeille", niveau: "cm2" },

  // ---------- ph et th ----------
  { mot: "éléphant", niveau: "cm2", note: "« ph » se prononce « f »" },
  { mot: "pharmacie", niveau: "cm2", note: "« ph » se prononce « f »" },
  { mot: "photographie", niveau: "cm2", note: "deux « ph », donc deux sons « f »" },
  { mot: "phrase", niveau: "cm2", note: "« ph » se prononce « f »" },
  { mot: "phare", niveau: "cm2" },
  { mot: "orphelin", niveau: "cm2" },
  { mot: "catastrophe", niveau: "cm2" },
  { mot: "alphabet", niveau: "cm2", note: "« ph » se lit « f » et le -t final est muet" },
  { mot: "téléphone", niveau: "cm2" },
  { mot: "sphère", niveau: "cm2" },
  { mot: "pharaon", niveau: "cm2" },
  { mot: "thermomètre", niveau: "cm2", note: "« th » se prononce « t »" },
  { mot: "athlète", niveau: "cm2", note: "« th » se prononce « t »" },

  // ---------- gu, gn, ge ----------
  { mot: "guerre", niveau: "cm2", note: "le u de « gu » ne s'entend pas" },
  { mot: "guitare", niveau: "cm2" },
  { mot: "baguette", niveau: "cm2" },
  { mot: "anguille", niveau: "cm2" },
  { mot: "aiguille", niveau: "cm2", note: "se prononce « é-gui-ye »" },
  { mot: "bague", niveau: "cm2" },
  { mot: "langue", niveau: "cm2" },
  { mot: "distinguer", niveau: "cm2" },
  { mot: "déguisement", niveau: "cm2" },
  { mot: "orgue", niveau: "cm2" },
  { mot: "nageoire", niveau: "cm2", note: "le e garde le son « j » devant le o" },
  { mot: "plongeon", niveau: "cm2", note: "le e garde le son « j » devant le o" },
  { mot: "bourgeon", niveau: "cm2", note: "le e garde le son « j » devant le o" },
  { mot: "pigeon", niveau: "cm2", note: "le e garde le son « j » devant le o" },
  { mot: "montagne", niveau: "cm2" },
  { mot: "champignon", niveau: "cm2" },
  { mot: "agneau", niveau: "cm2" },
  { mot: "poignée", niveau: "cm2" },
  { mot: "araignée", niveau: "cm2" },
  { mot: "quatorze", niveau: "cm2", note: "« qu » se prononce « k »" },
  { mot: "ennui", niveau: "cm2", note: "« enn » se lit « an-n » (« an-nui »)" },

  // ---------- Le y ----------
  { mot: "crayon", niveau: "cm2", note: "le y vaut deux i (« crè-ion »)" },
  { mot: "voyage", niveau: "cm2", note: "le y vaut deux i (« vo-ia-ge »)" },
  { mot: "balayer", niveau: "cm2" },
  { mot: "moyen", niveau: "cm2" },
  { mot: "essuyer", niveau: "cm2" },
  { mot: "rayon", niveau: "cm2" },
  { mot: "tuyau", niveau: "cm2" },
  { mot: "appuyer", niveau: "cm2" },
  { mot: "payer", niveau: "cm2" },
  { mot: "royaume", niveau: "cm2" },
  { mot: "loyal", niveau: "cm2" },
  { mot: "joyeux", niveau: "cm2" },
  { mot: "noyau", niveau: "cm2" },

  // ---------- Finales -tion / -ssion ----------
  { mot: "attention", niveau: "cm2", note: "« -tion » se lit « sion »" },
  { mot: "récréation", niveau: "cm2" },
  { mot: "permission", niveau: "cm2" },
  { mot: "passion", niveau: "cm2" },
  { mot: "discussion", niveau: "cm2" },
  { mot: "opération", niveau: "cm2" },
  { mot: "population", niveau: "cm2" },
  { mot: "invitation", niveau: "cm2" },
  { mot: "respiration", niveau: "cm2" },
  { mot: "solution", niveau: "cm2" },
  { mot: "émotion", niveau: "cm2" },
  { mot: "expression", niveau: "cm2" },
  { mot: "impression", niveau: "cm2" },
  { mot: "profession", niveau: "cm2" },
  { mot: "mission", niveau: "cm2" },

  // ---------- Finales muettes -et / -ot / -ard / -ai ----------
  { mot: "tabouret", niveau: "cm2", note: "le -t final est muet" },
  { mot: "paquet", niveau: "cm2", note: "le -t final est muet" },
  { mot: "jouet", niveau: "cm2" },
  { mot: "carnet", niveau: "cm2" },
  { mot: "bracelet", niveau: "cm2" },
  { mot: "robinet", niveau: "cm2" },
  { mot: "sifflet", niveau: "cm2", note: "deux f, et le -t final est muet" },
  { mot: "perroquet", niveau: "cm2", note: "deux r, et le -t final est muet" },
  { mot: "chariot", niveau: "cm2", note: "un seul r, et le -t final est muet" },
  { mot: "escargot", niveau: "cm2", note: "le -t final est muet" },
  { mot: "abricot", niveau: "cm2", note: "le -t final est muet" },
  { mot: "tricot", niveau: "cm2" },
  { mot: "épinard", niveau: "cm2", note: "le -d final est muet" },
  { mot: "placard", niveau: "cm2", note: "le -d final est muet" },
  { mot: "canard", niveau: "cm2", note: "le -d final est muet" },
  { mot: "balai", niveau: "cm2", note: "finit par -ai, sans -t (à ne pas confondre avec « ballet »)" },
  { mot: "arrêt", niveau: "cm2" },
  { mot: "forêt", niveau: "cm2" },
  { mot: "dessin", niveau: "cm2" },

  // ---------- Consonnes doublées ----------
  { mot: "appartement", niveau: "cm2" },
  { mot: "apporter", niveau: "cm2" },
  { mot: "attacher", niveau: "cm2" },
  { mot: "attraper", niveau: "cm2" },
  { mot: "occuper", niveau: "cm2" },
  { mot: "accrocher", niveau: "cm2" },
  { mot: "accident", niveau: "cm2", note: "deux c, et le -t final est muet" },
  { mot: "succès", niveau: "cm2", note: "deux c, et le -s final est muet" },
  { mot: "offrir", niveau: "cm2" },
  { mot: "souffler", niveau: "cm2" },
  { mot: "terrible", niveau: "cm2" },
  { mot: "horrible", niveau: "cm2", note: "h muet au début, deux r ensuite" },

  // ---------- Accents ----------
  { mot: "pêche", niveau: "cm2" },
  { mot: "flèche", niveau: "cm2" },
  { mot: "bêtise", niveau: "cm2" },
  { mot: "crème", niveau: "cm2" },
  { mot: "règle", niveau: "cm2" },
  { mot: "sévère", niveau: "cm2", note: "un accent aigu puis un accent grave" },
  { mot: "caractère", niveau: "cm2" },
  { mot: "mystère", niveau: "cm2", note: "le y se lit « i »" },
  { mot: "goûter", niveau: "cm2" },
  { mot: "flûte", niveau: "cm2" },
  { mot: "bûche", niveau: "cm2" },
  { mot: "piqûre", niveau: "cm2" },
  { mot: "coûter", niveau: "cm2" },
  { mot: "dégât", niveau: "cm2", note: "accent aigu puis accent circonflexe, et -t muet" },

  // ============================================================
  //                       6ᵉ  (130 mots)
  // ============================================================

  // ---------- Lettres muettes à l'intérieur ----------
  { mot: "compter", niveau: "6e", note: "le p ne se prononce pas (« conté »)" },
  { mot: "sculpter", niveau: "6e", note: "le p ne se prononce pas (« skulté »)" },
  { mot: "sculpture", niveau: "6e", note: "ici le p S'ENTEND (« skulp-ture »)" },
  { mot: "baptême", niveau: "6e", note: "le p ne se prononce pas (« batême »)" },
  { mot: "automne", niveau: "6e", note: "le m ne se prononce pas (« oto-ne »)" },

  // ---------- Finales en -ct : muettes ou non ----------
  { mot: "respect", niveau: "6e", note: "le -ct final est muet (on dit « respè »)" },
  { mot: "instinct", niveau: "6e", note: "le -ct final est muet (« instin »)" },
  { mot: "distinct", niveau: "6e", note: "le -ct final est muet (« distin »)" },
  { mot: "suspect", niveau: "6e", note: "le -ct peut se taire (« suspè ») ou s'entendre" },
  { mot: "aspect", niveau: "6e", note: "le -ct final est muet (« aspè »)" },
  { mot: "exact", niveau: "6e", note: "ici le -ct S'ENTEND (« ègzakt »)" },
  { mot: "contact", niveau: "6e", note: "ici le -ct S'ENTEND" },
  { mot: "intact", niveau: "6e", note: "ici le -ct S'ENTEND" },
  { mot: "direct", niveau: "6e", note: "ici le -ct S'ENTEND" },
  { mot: "correct", niveau: "6e", note: "deux r, et le -ct s'entend" },
  { mot: "strict", niveau: "6e" },
  { mot: "abject", niveau: "6e" },
  { mot: "verdict", niveau: "6e" },
  { mot: "district", niveau: "6e" },
  { mot: "estomac", niveau: "6e", note: "le -c final est muet (« estoma »)" },

  // ---------- Finales -tie qui se lisent « si » ----------
  { mot: "démocratie", niveau: "6e", note: "« -tie » se lit « si » (« démocrassi »)" },
  { mot: "diplomatie", niveau: "6e", note: "« -tie » se lit « si »" },
  { mot: "acrobatie", niveau: "6e", note: "« -tie » se lit « si »" },
  { mot: "inertie", niveau: "6e", note: "« -tie » se lit « si »" },
  { mot: "prophétie", niveau: "6e", note: "« ph » se lit « f » et « -tie » se lit « si »" },

  // ---------- Prononciations savantes ----------
  { mot: "second", niveau: "6e", note: "le c se prononce « g » (« segon »)" },
  { mot: "examen", niveau: "6e", note: "le -en final se prononce « in » (« examin »)" },
  { mot: "album", niveau: "6e", note: "le -um final se prononce « ome »" },
  { mot: "maximum", niveau: "6e", note: "le -um final se prononce « ome »" },
  { mot: "aquarium", niveau: "6e", note: "« qu » se prononce « kw » (« akwarium »)" },

  // ---------- Le x : « gz » ou « ks » ----------
  { mot: "exercice", niveau: "6e", note: "le x se lit « gz » (« é-gzer-cice »)" },
  { mot: "exemple", niveau: "6e", note: "le x se lit « gz » (« é-gzemple »)" },
  { mot: "exagérer", niveau: "6e", note: "le x se lit « gz »" },
  { mot: "exister", niveau: "6e", note: "le x se lit « gz »" },
  { mot: "exotique", niveau: "6e", note: "le x se lit « gz »" },
  { mot: "exécuter", niveau: "6e", note: "le x se lit « gz »" },
  { mot: "exil", niveau: "6e", note: "le x se lit « gz » et le -l s'entend" },
  { mot: "exploser", niveau: "6e", note: "ici le x se lit « ks »" },
  { mot: "expliquer", niveau: "6e", note: "ici le x se lit « ks »" },
  { mot: "expédition", niveau: "6e", note: "ici le x se lit « ks »" },
  { mot: "exprimer", niveau: "6e", note: "ici le x se lit « ks »" },
  { mot: "luxe", niveau: "6e", note: "le x se lit « ks »" },

  // ---------- « ch » qui se lit « k » ----------
  { mot: "chœur", niveau: "6e", note: "« ch » se prononce « k » (« keur »)" },
  { mot: "orchestre", niveau: "6e", note: "« ch » se prononce « k » (« orkestre »)" },
  { mot: "écho", niveau: "6e", note: "« ch » se prononce « k » (« éko »)" },
  { mot: "technique", niveau: "6e", note: "« ch » se prononce « k » (« teknique »)" },
  { mot: "technologie", niveau: "6e", note: "« ch » se prononce « k »" },
  { mot: "technicien", niveau: "6e", note: "« ch » se prononce « k »" },
  { mot: "chronologie", niveau: "6e", note: "« ch » se prononce « k » (« kronologie »)" },
  { mot: "chronomètre", niveau: "6e", note: "« ch » se prononce « k »" },
  { mot: "chorale", niveau: "6e", note: "« ch » se prononce « k » (« korale »)" },
  { mot: "archange", niveau: "6e", note: "« ch » se prononce « k » (« arkange »)" },
  { mot: "orchidée", niveau: "6e", note: "« ch » se prononce « k » (« orkidée »)" },
  { mot: "chrétien", niveau: "6e", note: "« ch » se prononce « k »" },
  { mot: "chrome", niveau: "6e", note: "« ch » se prononce « k »" },
  { mot: "charisme", niveau: "6e", note: "« ch » se prononce « k » (« karisme »)" },
  { mot: "monarchie", niveau: "6e", note: "« ch » se prononce « k » (« monarki »)" },
  { mot: "anarchie", niveau: "6e", note: "« ch » se prononce « k »" },
  { mot: "hiérarchie", niveau: "6e", note: "h muet, et « ch » se prononce « k »" },

  // ---------- th, rh ----------
  { mot: "thym", niveau: "6e", note: "se prononce « tin »" },
  { mot: "hypothèse", niveau: "6e", note: "le y se lit « i », le th se lit « t »" },
  { mot: "théorie", niveau: "6e" },
  { mot: "thème", niveau: "6e" },
  { mot: "labyrinthe", niveau: "6e", note: "un y au milieu, un th à la fin" },
  { mot: "panthère", niveau: "6e" },
  { mot: "python", niveau: "6e", note: "un y et un th (« piton »)" },
  { mot: "arithmétique", niveau: "6e" },
  { mot: "rhume", niveau: "6e", note: "« rh » se prononce « r »" },
  { mot: "rhinocéros", niveau: "6e", note: "« rh » se prononce « r » et le -s final s'entend" },

  // ---------- Le y savant ----------
  { mot: "rythme", niveau: "6e", note: "le y et le th (« ritme »)" },
  { mot: "symétrie", niveau: "6e" },
  { mot: "système", niveau: "6e" },
  { mot: "mythe", niveau: "6e" },
  { mot: "mythologie", niveau: "6e" },
  { mot: "cycle", niveau: "6e" },
  { mot: "bicyclette", niveau: "6e", note: "un y au milieu, deux t à la fin" },
  { mot: "cygne", niveau: "6e", note: "un y, à ne pas confondre avec « signe »" },
  { mot: "pyramide", niveau: "6e" },
  { mot: "style", niveau: "6e" },
  { mot: "physique", niveau: "6e", note: "un y et un « ph » qui se lit « f »" },
  { mot: "hymne", niveau: "6e", note: "h muet et y (« imne »)" },
  { mot: "géographie", niveau: "6e" },
  { mot: "paysage", niveau: "6e", note: "se prononce « pé-i-zage »" },

  // ---------- Tréma ----------
  { mot: "héroïne", niveau: "6e", note: "le tréma sépare le o et le i (« é-ro-ine »)" },
  { mot: "naïf", niveau: "6e", note: "le tréma sépare le a et le i" },
  { mot: "maïs", niveau: "6e", note: "le tréma sépare le a et le i (« ma-isse »)" },
  { mot: "égoïste", niveau: "6e" },
  { mot: "ouïe", niveau: "6e", note: "le tréma sépare le u et le i (« ou-i »)" },
  { mot: "inouï", niveau: "6e" },
  { mot: "aïeul", niveau: "6e" },
  { mot: "laïque", niveau: "6e" },
  { mot: "mosaïque", niveau: "6e" },
  { mot: "faïence", niveau: "6e" },
  { mot: "haïr", niveau: "6e", note: "h aspiré et tréma (« a-ir »)" },
  { mot: "stoïque", niveau: "6e" },
  { mot: "ambiguïté", niveau: "6e", note: "le tréma est sur le i, pas sur le u" },
  { mot: "canoë", niveau: "6e", note: "le tréma sépare le o et le e (« kano-é »)" },

  // ---------- h aspiré et h muet ----------
  { mot: "haricot", niveau: "6e", note: "h aspiré : on dit « le haricot », pas « l'haricot »" },
  { mot: "hibou", niveau: "6e", note: "h aspiré : « le hibou »" },
  { mot: "hasard", niveau: "6e", note: "le s se lit « z » et le -d est muet" },
  { mot: "honte", niveau: "6e", note: "h aspiré : « la honte »" },
  { mot: "hurler", niveau: "6e", note: "h aspiré" },
  { mot: "hangar", niveau: "6e", note: "h aspiré" },
  { mot: "hérisson", niveau: "6e", note: "h aspiré, et deux s" },
  { mot: "huître", niveau: "6e", note: "h muet et accent circonflexe" },
  { mot: "hameçon", niveau: "6e", note: "h muet, et la cédille garde le son « s »" },
  { mot: "horizon", niveau: "6e", note: "h muet" },
  { mot: "humain", niveau: "6e", note: "h muet" },
  { mot: "habitude", niveau: "6e", note: "h muet" },
  { mot: "hôpital", niveau: "6e" },

  // ---------- Consonnes doublées savantes ----------
  { mot: "apparence", niveau: "6e" },
  { mot: "appétit", niveau: "6e", note: "deux p, et le -t final est muet" },
  { mot: "opposer", niveau: "6e", note: "un seul p au début, deux ensuite" },
  { mot: "occasion", niveau: "6e" },
  { mot: "accompagner", niveau: "6e" },
  { mot: "affirmer", niveau: "6e" },
  { mot: "effort", niveau: "6e", note: "deux f, et le -t final est muet" },
  { mot: "efficace", niveau: "6e" },
  { mot: "suffire", niveau: "6e" },
  { mot: "illusion", niveau: "6e" },
  { mot: "illustration", niveau: "6e" },
  { mot: "allergie", niveau: "6e" },
  { mot: "annoncer", niveau: "6e" },
  { mot: "annuler", niveau: "6e" },
  { mot: "ennemi", niveau: "6e", note: "ici « enn » se lit « èn » (« èn-mi »)" },

  // ---------- Accents et cédille ----------
  { mot: "bâtiment", niveau: "6e" },
  { mot: "dîner", niveau: "6e" },
  { mot: "reçu", niveau: "6e" },
  { mot: "déçu", niveau: "6e" },
  { mot: "façade", niveau: "6e" },

  // ============================================================
  //                        5ᵉ  (40 mots)
  // ============================================================

  // ---------- Groupes de consonnes savants ----------
  { mot: "chirurgien", niveau: "5e", note: "« ch » se lit « ch », mais le u de « gien » est muet" },
  { mot: "psychologie", niveau: "5e", note: "le p se prononce, « ch » se lit « k » (« psi-ko »)" },
  { mot: "psychiatre", niveau: "5e", note: "« psi-kiatre »" },
  { mot: "asthme", niveau: "5e", note: "le th est muet (« asme »)" },
  { mot: "isthme", niveau: "5e", note: "le th est muet (« isme »)" },
  { mot: "eczéma", niveau: "5e", note: "« cz » se lit « gz » (« ègzéma »)" },
  { mot: "archéologie", niveau: "5e", note: "« ch » se prononce « k »" },
  { mot: "chaos", niveau: "5e", note: "se prononce « ka-o »" },

  // ---------- Le son « an » caché ----------
  { mot: "paon", niveau: "5e", note: "se prononce « pan »" },
  { mot: "faon", niveau: "5e", note: "se prononce « fan »" },
  { mot: "taon", niveau: "5e", note: "se prononce « tan »" },
  { mot: "condamner", niveau: "5e", note: "le m est muet (« condané »)" },
  { mot: "solennel", niveau: "5e", note: "« enn » se lit « an » (« solanel »)" },
  { mot: "gageure", niveau: "5e", note: "se prononce « ga-jur »" },

  // ---------- Lettres muettes (suite) ----------
  { mot: "dompter", niveau: "5e", note: "le p est muet (« donté »)" },
  { mot: "prompt", niveau: "5e", note: "se prononce « pron »" },
  { mot: "exempt", niveau: "5e", note: "se prononce « ègzan »" },
  { mot: "sourcil", niveau: "5e", note: "le -l final est muet (« sourci »)" },
  { mot: "persil", niveau: "5e", note: "le -l final est muet (« persi »)" },
  { mot: "gril", niveau: "5e", note: "le -l final est muet (« gri »)" },

  // ---------- Adverbes en -amment / -emment ----------
  { mot: "prudemment", niveau: "5e", note: "« -emment » se prononce « aman »" },
  { mot: "évidemment", niveau: "5e", note: "« -emment » se prononce « aman »" },
  { mot: "savamment", niveau: "5e", note: "« -amment » se prononce « aman »" },
  { mot: "couramment", niveau: "5e" },
  { mot: "suffisamment", niveau: "5e" },

  // ---------- Préfixes à consonne doublée ----------
  { mot: "immangeable", niveau: "5e", note: "deux m après le préfixe im-" },
  { mot: "immobile", niveau: "5e" },
  { mot: "irréel", niveau: "5e", note: "deux r après le préfixe ir-" },
  { mot: "irrégulier", niveau: "5e" },
  { mot: "innombrable", niveau: "5e", note: "deux n après le préfixe in-" },

  // ---------- Doubles difficultés ----------
  { mot: "accueillir", niveau: "5e", note: "« cu » se lit « queu », après deux c" },
  { mot: "recueillir", niveau: "5e" },
  { mot: "dictionnaire", niveau: "5e", note: "deux n, et « -tio- » se lit « sio »" },
  { mot: "professionnel", niveau: "5e", note: "un f, deux s, deux n" },
  { mot: "exceptionnel", niveau: "5e", note: "« xc » se lit « ks », puis deux n" },
  { mot: "bibliothèque", niveau: "5e" },
  { mot: "mathématiques", niveau: "5e" },
  { mot: "sympathique", niveau: "5e" },
  { mot: "abréviation", niveau: "5e" },
  { mot: "orthographe", niveau: "5e", note: "th puis ph : deux graphies grecques dans un même mot" },

  // ============================================================
  //                        4ᵉ  (40 mots)
  // ============================================================

  // ---------- Pièges de lecture ----------
  { mot: "abasourdi", niveau: "4e", note: "le s se lit « z » (« abazourdi »)" },
  { mot: "exsangue", niveau: "4e", note: "se prononce « èk-sangue »" },
  { mot: "écueil", niveau: "4e", note: "« cu » se lit « queu » (« é-keuye »)" },
  { mot: "cercueil", niveau: "4e", note: "« cu » se lit « queu » (« ser-keuye »)" },
  { mot: "recueil", niveau: "4e" },
  { mot: "paradigme", niveau: "4e" },
  { mot: "dilemme", niveau: "4e", note: "se prononce « di-lème », avec deux m" },
  { mot: "ésotérique", niveau: "4e" },
  { mot: "schisme", niveau: "4e", note: "« sch » se lit « ch » (« chisme »)" },
  { mot: "agenda", niveau: "4e", note: "le -en- se lit « in » (« a-jin-da »)" },
  { mot: "appendice", niveau: "4e", note: "le -en- se lit « in » (« a-pin-dice »)" },
  { mot: "référendum", niveau: "4e", note: "le -um final se prononce « ome »" },

  // ---------- « qu » et « gu » qui s'entendent ----------
  { mot: "ubiquité", niveau: "4e", note: "« qu » se lit « kw » (« u-bi-kwi-té »)" },
  { mot: "équidistant", niveau: "4e", note: "« qu » se lit « kw »" },
  { mot: "quadrupède", niveau: "4e", note: "« qu » se lit « kw » (« kwa-dru-pède »)" },
  { mot: "loquace", niveau: "4e", note: "« qu » se lit « kw » (« lo-kwace »)" },
  { mot: "adéquat", niveau: "4e", note: "« qu » se lit « kw » et le -t est muet" },
  { mot: "aiguiser", niveau: "4e", note: "le u ne s'entend pas (« é-gui-zé »)" },
  { mot: "linguistique", niveau: "4e", note: "« gu » se lit « gw » (« lin-gwis-tique »)" },
  { mot: "bilingue", niveau: "4e" },

  // ---------- h muet à l'intérieur ----------
  { mot: "envahissant", niveau: "4e", note: "le h ne s'entend pas mais sépare les voyelles" },
  { mot: "véhément", niveau: "4e" },
  { mot: "hétérogène", niveau: "4e" },

  // ---------- Le y savant ----------
  { mot: "paroxysme", niveau: "4e" },
  { mot: "cataclysme", niveau: "4e" },
  { mot: "syntaxe", niveau: "4e" },
  { mot: "sarcophage", niveau: "4e" },
  { mot: "anticonstitutionnel", niveau: "4e", note: "un des plus longs mots courants du français" },

  // ---------- Consonnes doublées piégeuses ----------
  { mot: "concurrence", niveau: "4e", note: "un seul c au début, deux r ensuite" },
  { mot: "occurrence", niveau: "4e", note: "deux c ET deux r" },
  { mot: "dysfonctionnement", niveau: "4e", note: "dys- avec un y, puis deux n" },
  { mot: "développement", niveau: "4e", note: "un seul l, mais deux p" },
  { mot: "apercevoir", niveau: "4e", note: "un seul p (contrairement à « apparaître »)" },
  { mot: "apparaître", niveau: "4e", note: "deux p, et un accent circonflexe sur le i" },
  { mot: "bonhomie", niveau: "4e", note: "un seul m, alors que « bonhomme » en prend deux" },
  { mot: "imbécillité", niveau: "4e", note: "deux l, alors que « imbécile » n'en a qu'un" },
  { mot: "embarras", niveau: "4e", note: "deux r et un -s final muet" },
  { mot: "échafaudage", niveau: "4e" },

  // ---------- Paronymes ----------
  { mot: "prémices", niveau: "4e", note: "les débuts de quelque chose (à ne pas confondre avec « prémisses »)" },
  { mot: "prémisses", niveau: "4e", note: "les points de départ d'un raisonnement" },
];
