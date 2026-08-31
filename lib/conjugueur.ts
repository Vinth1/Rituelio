// Moteur de conjugaison — génère les formes d'un verbe à partir de données
// COMPACTES, au lieu de les écrire à la main. C'est ce qui permet une banque de
// plusieurs centaines de verbes (data/verbes.ts) et le « verbe personnalisé »
// saisi par le prof : les deux passent par le même moteur.
//
// Module PUR : aucune dépendance navigateur ni serveur, donc importable par le
// jeu (client) comme par la correction des copies (serveur). Les imports y sont
// RELATIFS et portent l'extension .ts, parce que `npm test` exécute ces fichiers
// avec le type-stripping natif de Node, qui ne connaît pas l'alias « @/ ».
//
// Deux sortes de verbes :
//   - RÉGULIERS (1er et 2e groupes) : l'infinitif suffit. Les alternances
//     orthographiques (lançons, mangeons, appelle, achète, cède…) se déduisent
//     de la finale — voir `radicauxER`.
//   - IRRÉGULIERS (3e groupe) : décrits par un `ModeleVerbe` (data/verbes-irreguliers.ts),
//     qui stocke le présent en clair et quelques radicaux. Tout le reste en dérive.
//
// Les formes sont TOUJOURS données sans le pronom, dans l'ordre je, tu, il/elle/on,
// nous, vous, ils/elles. Pour un temps composé, la forme complète sans pronom
// (« ai parlé », « sommes allés »).

export type Groupe = "1er groupe" | "2e groupe" | "3e groupe";
export type Auxiliaire = "avoir" | "être";
export type Formes6 = [string, string, string, string, string, string];

export type Conjugaison = {
  temps: string;
  mode: string;
  formes: Formes6;
  // Lignes réellement demandées. Vaut [0,1,2,3,4,5] partout sauf à l'impératif,
  // qui n'a que la 2e personne du singulier et les 2 du pluriel.
  lignes: number[];
  // Formes alternatives également justes (accord du participe passé, « paye »
  // à côté de « paie »). Indexé comme `formes`.
  variantes?: (string[] | undefined)[];
};

// Un verbe irrégulier tient dans ce petit paquet de radicaux.
export type ModeleVerbe = {
  present: Formes6; // source de vérité : le présent porte les irrégularités arbitraires
  participePasse: string; // masculin singulier : « allé », « pris », « dû »
  participePasseFeminin?: string; // seulement si « + e » ne marche pas (dû → due)
  radicalFutur: string; // le -r final est inclus : « ser », « pourr », « prendr »
  radicalPasseSimple: string; // « f », « pr », « naqu »
  voyellePasseSimple: "a" | "i" | "u" | "in";
  auxiliaire?: Auxiliaire; // défaut « avoir »
  radicalImparfait?: string; // défaut = présent[3] moins « ons » ; « ét » pour être
  // Radical du subjonctif. Par défaut : présent[5] moins « ent » pour je/tu/il/ils,
  // et le radical de l'imparfait pour nous/vous. Les 6 formes en clair si tout casse.
  subjonctif?: Formes6 | { radical: string; radicalNousVous?: string };
  imperatif?: [string, string, string] | null; // null = ce verbe n'a pas d'impératif
};

// Une entrée de la banque. Volontairement minuscule : un verbe régulier tient sur
// une ligne. `modele` désigne une clé de MODELES (data/verbes-irreguliers.ts).
export type EntreeVerbe = {
  infinitif: string;
  groupe: Groupe;
  modele?: string;
  auxiliaire?: Auxiliaire;
  // Verbe personnalisé : cases corrigées à la main par le prof, qui écrasent le
  // moteur. Clé = `cleTempsMode()`.
  formesCorrigees?: Record<string, Formes6>;
};

// ---------------------------------------------------------------------------
// Temps enseignés au collège (cycles 3 et 4).
// ---------------------------------------------------------------------------

export const TEMPS_COLLEGE = [
  { temps: "présent", mode: "indicatif" },
  { temps: "imparfait", mode: "indicatif" },
  { temps: "passé simple", mode: "indicatif" },
  { temps: "futur simple", mode: "indicatif" },
  { temps: "passé composé", mode: "indicatif" },
  { temps: "plus-que-parfait", mode: "indicatif" },
  { temps: "présent", mode: "conditionnel" },
  { temps: "présent", mode: "subjonctif" },
  { temps: "présent", mode: "impératif" },
] as const satisfies readonly { temps: string; mode: string }[];

export function cleTempsMode(tm: { temps: string; mode: string }): string {
  return `${tm.mode}|${tm.temps}`;
}

export function tempsModeDepuisCle(
  cle: string,
): { temps: string; mode: string } | null {
  const i = cle.indexOf("|");
  if (i < 0) return null;
  return { mode: cle.slice(0, i), temps: cle.slice(i + 1) };
}

// « imparfait · indicatif » — l'ordre des manuels met le temps d'abord.
export function libelleTempsMode(tm: { temps: string; mode: string }): string {
  return `${tm.temps} · ${tm.mode}`;
}

// ---------------------------------------------------------------------------
// Terminaisons
// ---------------------------------------------------------------------------

const TOUTES_LIGNES = [0, 1, 2, 3, 4, 5];
const LIGNES_IMPERATIF = [1, 3, 4];

const T_PRESENT_IR2: Formes6 = ["is", "is", "it", "issons", "issez", "issent"];
const T_IMPARFAIT: Formes6 = ["ais", "ais", "ait", "ions", "iez", "aient"];
const T_FUTUR: Formes6 = ["ai", "as", "a", "ons", "ez", "ont"];
const T_SUBJONCTIF: Formes6 = ["e", "es", "e", "ions", "iez", "ent"];

const T_PASSE_SIMPLE: Record<string, Formes6> = {
  a: ["ai", "as", "a", "âmes", "âtes", "èrent"],
  i: ["is", "is", "it", "îmes", "îtes", "irent"],
  u: ["us", "us", "ut", "ûmes", "ûtes", "urent"],
  in: ["ins", "ins", "int", "înmes", "întes", "inrent"],
};

// Auxiliaires aux deux seuls temps dont les temps composés ont besoin.
const AUX: Record<Auxiliaire, { present: Formes6; imparfait: Formes6 }> = {
  avoir: {
    present: ["ai", "as", "a", "avons", "avez", "ont"],
    imparfait: ["avais", "avais", "avait", "avions", "aviez", "avaient"],
  },
  être: {
    present: ["suis", "es", "est", "sommes", "êtes", "sont"],
    imparfait: ["étais", "étais", "était", "étions", "étiez", "étaient"],
  },
};

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

function formes6<T>(f: (i: number) => T): [T, T, T, T, T, T] {
  return [f(0), f(1), f(2), f(3), f(4), f(5)];
}

// Première lettre d'une terminaison, accents retirés : « âmes » → « a ».
function initiale(terminaison: string): string {
  return terminaison
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .charAt(0)
    .toLowerCase();
}

const CONSONNE = "bcdfghjklmnpqrstvwxzç";
const FIN_E_CONSONNE = new RegExp(`e[${CONSONNE}]$`);
const FIN_E_AIGU_CONSONNE = new RegExp(`é[${CONSONNE}]$`);

// ---------------------------------------------------------------------------
// 1er groupe : radicaux et alternances orthographiques
// ---------------------------------------------------------------------------

// Verbes en -eler / -eter qui prennent un accent grave au lieu de doubler la
// consonne (« j'achète », et non « j'achette »). Tous les autres doublent.
const ACCENT_GRAVE_ELER_ETER = new Set([
  "acheter",
  "racheter",
  "geler",
  "dégeler",
  "congeler",
  "surgeler",
  "harceler",
  "marteler",
  "modeler",
  "peler",
  "celer",
  "receler",
  "ciseler",
  "démanteler",
  "écarteler",
  "crocheter",
  "fureter",
  "haleter",
]);

type FamilleER = "rien" | "yer" | "doubler" | "e-grave" | "e-aigu";

type RadicauxER = {
  base: string; // devant une terminaison sonore : « parl », « appel », « céd »
  muet: string; // devant une terminaison muette : « parl », « appell », « cèd »
  futur: string; // radical du futur et du conditionnel, -r inclus
  muetVariante?: string; // « pay » à côté de « pai » (verbes en -ayer)
  liaison: "rien" | "cer" | "ger";
  famille: FamilleER;
};

// Remplace la voyelle qui précède la consonne finale par sa version accentuée.
function accentuerAvantDerniere(base: string, accentuee: string): string {
  return base.slice(0, -2) + accentuee + base.slice(-1);
}

function radicauxER(infinitif: string): RadicauxER {
  const base = infinitif.slice(0, -2);
  const derniere = base.slice(-1);
  const liaison = derniere === "c" ? "cer" : derniere === "g" ? "ger" : "rien";

  let famille: FamilleER = "rien";
  let muet = base;
  let muetVariante: string | undefined;

  if (infinitif.endsWith("yer")) {
    famille = "yer";
    muet = base.slice(0, -1) + "i";
    // -ayer accepte les deux orthographes : « je paie » et « je paye ».
    if (infinitif.endsWith("ayer")) muetVariante = base;
  } else if (base.endsWith("el") || base.endsWith("et")) {
    if (ACCENT_GRAVE_ELER_ETER.has(infinitif)) {
      famille = "e-grave";
      muet = accentuerAvantDerniere(base, "è");
    } else {
      famille = "doubler";
      muet = base + derniere;
    }
  } else if (FIN_E_CONSONNE.test(base)) {
    famille = "e-grave";
    muet = accentuerAvantDerniere(base, "è");
  } else if (FIN_E_AIGU_CONSONNE.test(base)) {
    famille = "e-aigu";
    muet = accentuerAvantDerniere(base, "è");
  }

  // Le futur se bâtit sur le radical muet — SAUF pour les verbes en é_er, qui
  // gardent l'accent aigu en orthographe traditionnelle : « je céderai ».
  // (« cèderai », rectification de 1990, passe de toute façon la correction,
  // qui ignore les accents.)
  const futur = famille === "e-aigu" ? infinitif : muet + "er";

  return { base, muet, futur, muetVariante, liaison, famille };
}

// Adoucit le radical devant une terminaison en a/o : « lanç-ons », « mange-ons ».
function adoucir(r: RadicauxER, terminaison: string): string {
  const lettre = initiale(terminaison);
  if (lettre !== "a" && lettre !== "o") return r.base;
  if (r.liaison === "cer") return r.base.slice(0, -1) + "ç";
  if (r.liaison === "ger") return r.base + "e";
  return r.base;
}

// ---------------------------------------------------------------------------
// Participe passé : accord après l'auxiliaire « être »
// ---------------------------------------------------------------------------

export function accordsParticipe(
  pp: string,
  feminin?: string,
): { ms: string; fs: string; mp: string; fp: string } {
  const ms = pp;
  const fs = feminin ?? pp + "e";
  const mp = /[sx]$/.test(pp) ? pp : pp + "s";
  const fp = fs + "s";
  return { ms, fs, mp, fp };
}

// Construit un temps composé : auxiliaire conjugué + participe passé.
// Avec « être », le participe s'accorde : masculin singulier lignes 0-2,
// masculin pluriel lignes 3-5. Le féminin est accepté en variante ; la ligne
// « vous » accepte aussi le singulier (vouvoiement de politesse).
function tempsCompose(
  formesAux: Formes6,
  pp: string,
  ppFeminin: string | undefined,
  aux: Auxiliaire,
): { formes: Formes6; variantes: (string[] | undefined)[] | undefined } {
  if (aux === "avoir") {
    return {
      formes: formes6((i) => `${formesAux[i]} ${pp}`),
      variantes: undefined,
    };
  }
  const a = accordsParticipe(pp, ppFeminin);
  const attendu = [a.ms, a.ms, a.ms, a.mp, a.mp, a.mp];
  const autres: string[][] = [
    [a.fs],
    [a.fs],
    [a.fs],
    [a.fp],
    [a.fp, a.ms, a.fs],
    [a.fp],
  ];
  return {
    formes: formes6((i) => `${formesAux[i]} ${attendu[i]}`),
    variantes: formes6((i) => autres[i].map((v) => `${formesAux[i]} ${v}`)),
  };
}

// ---------------------------------------------------------------------------
// Impératif : présent aux personnes 2, 4 et 5
// ---------------------------------------------------------------------------

// Le -s tombe quand la forme du présent finit par « es » : cela couvre d'un coup
// les verbes en -er (« tu manges » → « mange ») ET ouvrir/offrir/cueillir, qui se
// conjuguent comme eux au présent — sans se déclencher sur « finis » ni « prends ».
function imperatifDepuisPresent(present: Formes6): Formes6 {
  const tu = present[1].endsWith("es") ? present[1].slice(0, -1) : present[1];
  return ["", tu, "", present[3], present[4], ""];
}

// ---------------------------------------------------------------------------
// Conjugaison d'un verbe régulier
// ---------------------------------------------------------------------------

function conjuguerER(
  infinitif: string,
  aux: Auxiliaire,
  temps: string,
  mode: string,
): Conjugaison | null {
  const r = radicauxER(infinitif);
  const pp = r.base + "é";
  const varMuet = (t: string): string[] | undefined =>
    r.muetVariante ? [r.muetVariante + t] : undefined;

  const present: Formes6 = [
    r.muet + "e",
    r.muet + "es",
    r.muet + "e",
    adoucir(r, "ons") + "ons",
    r.base + "ez",
    r.muet + "ent",
  ];
  const varPresent = r.muetVariante
    ? [varMuet("e"), varMuet("es"), varMuet("e"), undefined, undefined, varMuet("ent")]
    : undefined;

  if (mode === "indicatif" && temps === "présent") {
    return {
      temps,
      mode,
      formes: present,
      lignes: TOUTES_LIGNES,
      variantes: varPresent,
    };
  }
  if (mode === "indicatif" && temps === "imparfait") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => adoucir(r, T_IMPARFAIT[i]) + T_IMPARFAIT[i]),
    };
  }
  if (mode === "indicatif" && temps === "passé simple") {
    const t = T_PASSE_SIMPLE.a;
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => adoucir(r, t[i]) + t[i]),
    };
  }
  if (mode === "indicatif" && temps === "futur simple") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => r.futur + T_FUTUR[i]),
    };
  }
  if (mode === "conditionnel" && temps === "présent") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => r.futur + T_IMPARFAIT[i]),
    };
  }
  if (mode === "subjonctif" && temps === "présent") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) =>
        i === 3 || i === 4 ? r.base + T_SUBJONCTIF[i] : r.muet + T_SUBJONCTIF[i],
      ),
      variantes: varPresent,
    };
  }
  if (mode === "impératif" && temps === "présent") {
    return {
      temps,
      mode,
      formes: imperatifDepuisPresent(present),
      lignes: LIGNES_IMPERATIF,
    };
  }
  if (
    mode === "indicatif" &&
    (temps === "passé composé" || temps === "plus-que-parfait")
  ) {
    const b = temps === "passé composé" ? AUX[aux].present : AUX[aux].imparfait;
    const { formes, variantes } = tempsCompose(b, pp, undefined, aux);
    return { temps, mode, formes, lignes: TOUTES_LIGNES, variantes };
  }
  return null;
}

function conjuguerIR2(
  infinitif: string,
  aux: Auxiliaire,
  temps: string,
  mode: string,
): Conjugaison | null {
  const base = infinitif.slice(0, -2);
  const long = base + "iss";
  const pp = base + "i";
  const present: Formes6 = formes6((i) => base + T_PRESENT_IR2[i]);

  if (mode === "indicatif" && temps === "présent") {
    return { temps, mode, formes: present, lignes: TOUTES_LIGNES };
  }
  if (mode === "indicatif" && temps === "imparfait") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => long + T_IMPARFAIT[i]),
    };
  }
  if (mode === "indicatif" && temps === "passé simple") {
    const t = T_PASSE_SIMPLE.i;
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => base + t[i]),
    };
  }
  if (mode === "indicatif" && temps === "futur simple") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => infinitif + T_FUTUR[i]),
    };
  }
  if (mode === "conditionnel" && temps === "présent") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => infinitif + T_IMPARFAIT[i]),
    };
  }
  if (mode === "subjonctif" && temps === "présent") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => long + T_SUBJONCTIF[i]),
    };
  }
  if (mode === "impératif" && temps === "présent") {
    return {
      temps,
      mode,
      formes: imperatifDepuisPresent(present),
      lignes: LIGNES_IMPERATIF,
    };
  }
  if (
    mode === "indicatif" &&
    (temps === "passé composé" || temps === "plus-que-parfait")
  ) {
    const b = temps === "passé composé" ? AUX[aux].present : AUX[aux].imparfait;
    const { formes, variantes } = tempsCompose(b, pp, undefined, aux);
    return { temps, mode, formes, lignes: TOUTES_LIGNES, variantes };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Conjugaison d'un verbe irrégulier, à partir de son modèle
// ---------------------------------------------------------------------------

// Radical de l'imparfait : le « nous » du présent moins « ons ». Vrai pour tout
// le monde (nous faisons → faisais, nous buvons → buvions) sauf « être », dont
// le « nous » ne finit pas par « ons » — d'où `radicalImparfait`.
function radicalImparfaitDe(m: ModeleVerbe): string {
  if (m.radicalImparfait !== undefined) return m.radicalImparfait;
  return m.present[3].endsWith("ons") ? m.present[3].slice(0, -3) : m.present[3];
}

function conjuguerModele(
  m: ModeleVerbe,
  temps: string,
  mode: string,
): Conjugaison | null {
  const aux = m.auxiliaire ?? "avoir";
  const radImp = radicalImparfaitDe(m);

  if (mode === "indicatif" && temps === "présent") {
    return { temps, mode, formes: [...m.present], lignes: TOUTES_LIGNES };
  }
  if (mode === "indicatif" && temps === "imparfait") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => radImp + T_IMPARFAIT[i]),
    };
  }
  if (mode === "indicatif" && temps === "passé simple") {
    const t = T_PASSE_SIMPLE[m.voyellePasseSimple];
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => m.radicalPasseSimple + t[i]),
    };
  }
  if (mode === "indicatif" && temps === "futur simple") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => m.radicalFutur + T_FUTUR[i]),
    };
  }
  if (mode === "conditionnel" && temps === "présent") {
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) => m.radicalFutur + T_IMPARFAIT[i]),
    };
  }
  if (mode === "subjonctif" && temps === "présent") {
    if (Array.isArray(m.subjonctif)) {
      return { temps, mode, formes: [...m.subjonctif], lignes: TOUTES_LIGNES };
    }
    // Par défaut : radical du « ils » du présent, et celui de l'imparfait pour
    // nous/vous — ce qui règle d'un coup venir, prendre, boire, devoir, voir…
    const court =
      m.subjonctif?.radical ??
      (m.present[5].endsWith("ent") ? m.present[5].slice(0, -3) : m.present[5]);
    const longue = m.subjonctif?.radicalNousVous ?? radImp;
    return {
      temps,
      mode,
      lignes: TOUTES_LIGNES,
      formes: formes6((i) =>
        i === 3 || i === 4 ? longue + T_SUBJONCTIF[i] : court + T_SUBJONCTIF[i],
      ),
    };
  }
  if (mode === "impératif" && temps === "présent") {
    if (m.imperatif === null) return null;
    if (m.imperatif) {
      const imp = m.imperatif;
      return {
        temps,
        mode,
        lignes: LIGNES_IMPERATIF,
        formes: ["", imp[0], "", imp[1], imp[2], ""],
      };
    }
    return {
      temps,
      mode,
      formes: imperatifDepuisPresent(m.present),
      lignes: LIGNES_IMPERATIF,
    };
  }
  if (
    mode === "indicatif" &&
    (temps === "passé composé" || temps === "plus-que-parfait")
  ) {
    const b = temps === "passé composé" ? AUX[aux].present : AUX[aux].imparfait;
    const { formes, variantes } = tempsCompose(
      b,
      m.participePasse,
      m.participePasseFeminin,
      aux,
    );
    return { temps, mode, formes, lignes: TOUTES_LIGNES, variantes };
  }
  return null;
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

// Groupe supposé d'un infinitif inconnu (verbe personnalisé). Heuristique
// assumée : un verbe en -ir est rangé au 2e groupe, ce qui est le cas le plus
// fréquent ; si c'est un partir/dormir, le prof corrigera les formes proposées.
export function groupeDevine(infinitif: string): Groupe {
  const inf = infinitif.trim().toLowerCase();
  if (inf.endsWith("er")) return "1er groupe";
  if (inf.endsWith("ir")) return "2e groupe";
  return "3e groupe";
}

// Conjugue un verbe à un temps donné. Renvoie null si le couple temps/mode est
// inconnu, si le verbe n'a pas ce temps (impératif de « pouvoir »), ou si c'est
// un 3e groupe sans modèle — dans ce dernier cas le prof saisit les formes.
export function conjuguer(
  v: EntreeVerbe,
  temps: string,
  mode: string,
  modeles: Record<string, ModeleVerbe> = {},
): Conjugaison | null {
  const corrigee = v.formesCorrigees?.[cleTempsMode({ temps, mode })];
  if (corrigee) {
    const lignes = mode === "impératif" ? LIGNES_IMPERATIF : TOUTES_LIGNES;
    return { temps, mode, formes: [...corrigee], lignes };
  }
  if (v.modele) {
    const m = modeles[v.modele];
    if (!m) return null;
    // L'auxiliaire de l'entrée prime : « descendre » se conjugue comme « rendre »
    // mais se construit avec être.
    const effectif = v.auxiliaire ? { ...m, auxiliaire: v.auxiliaire } : m;
    return conjuguerModele(effectif, temps, mode);
  }
  const aux = v.auxiliaire ?? "avoir";
  if (v.groupe === "1er groupe") return conjuguerER(v.infinitif, aux, temps, mode);
  if (v.groupe === "2e groupe") return conjuguerIR2(v.infinitif, aux, temps, mode);
  return null;
}

// Les 9 cases d'un verbe, dans l'ordre d'enseignement. Les temps que le verbe
// n'a pas (impératif de « pouvoir ») sont simplement absents.
export function conjuguerTout(
  v: EntreeVerbe,
  modeles: Record<string, ModeleVerbe> = {},
): Conjugaison[] {
  const out: Conjugaison[] = [];
  for (const tm of TEMPS_COLLEGE) {
    const c = conjuguer(v, tm.temps, tm.mode, modeles);
    if (c) out.push(c);
  }
  return out;
}
