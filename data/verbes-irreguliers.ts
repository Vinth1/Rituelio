// Modèles des verbes irréguliers (3e groupe), consommés par `lib/conjugueur.ts`.
// Donnée TECHNIQUE : on ne l'ouvre que pour ajouter un irrégulier. La liste des
// verbes proposés au prof, elle, vit dans `data/verbes.ts`.
//
// Un modèle ne stocke que le strict nécessaire : le présent en clair (c'est lui
// qui porte les irrégularités arbitraires — « il prend » sans -t, « vous faites »)
// et quelques radicaux. Le moteur dérive tout le reste.
//
// Beaucoup de verbes ne sont irréguliers qu'en famille : -indre, -uire, -endre,
// -aître… Les fabriques ci-dessous les construisent, ce qui évite des centaines
// de lignes recopiées et les fautes de frappe qui vont avec.
//
// Import RELATIF avec extension .ts : `npm test` passe par le type-stripping de
// Node, qui ne connaît pas l'alias « @/ ».
import type { Formes6, ModeleVerbe } from "../lib/conjugueur.ts";

// ---------------------------------------------------------------------------
// Fabriques de familles
// ---------------------------------------------------------------------------

// -endre, -ondre, -erdre : rendre, attendre, répondre, perdre… Le singulier se
// bâtit sur le radical nu (« il rend », sans terminaison).
function familleEnDre(infinitif: string, pp?: string): ModeleVerbe {
  const r = infinitif.slice(0, -2); // « rendre » → « rend »
  return {
    present: [r + "s", r + "s", r, r + "ons", r + "ez", r + "ent"],
    participePasse: pp ?? r + "u",
    radicalFutur: infinitif.slice(0, -1),
    radicalPasseSimple: r,
    voyellePasseSimple: "i",
  };
}

// -aindre, -eindre, -oindre : craindre, peindre, joindre. Singulier en -ins/-int,
// pluriel en -ign-, participe en -int.
function familleInDre(infinitif: string): ModeleVerbe {
  const r = infinitif.slice(0, -5); // « peindre » → « pe »
  const long = r + "ign";
  return {
    present: [
      r + "ins",
      r + "ins",
      r + "int",
      long + "ons",
      long + "ez",
      long + "ent",
    ],
    participePasse: r + "int",
    radicalFutur: infinitif.slice(0, -1),
    radicalPasseSimple: long,
    voyellePasseSimple: "i",
  };
}

// -uire : conduire, produire, construire, cuire…
function familleUire(infinitif: string): ModeleVerbe {
  const r = infinitif.slice(0, -4); // « conduire » → « cond »
  const long = r + "uis";
  return {
    present: [
      r + "uis",
      r + "uis",
      r + "uit",
      long + "ons",
      long + "ez",
      long + "ent",
    ],
    participePasse: r + "uit",
    radicalFutur: infinitif.slice(0, -1),
    radicalPasseSimple: long,
    voyellePasseSimple: "i",
  };
}

// -ir à radical variable : partir, sortir, dormir, servir, sentir, mentir.
// Le singulier perd la consonne finale du radical (« je pars », « il dort »).
function familleIrConsonne(infinitif: string): ModeleVerbe {
  const long = infinitif.slice(0, -2); // « partir » → « part »
  const court = long.slice(0, -1); // → « par »
  return {
    present: [
      court + "s",
      court + "s",
      court + "t",
      long + "ons",
      long + "ez",
      long + "ent",
    ],
    participePasse: long + "i",
    radicalFutur: infinitif,
    radicalPasseSimple: long,
    voyellePasseSimple: "i",
  };
}

// -ir qui se conjugue comme un -er au présent : ouvrir, offrir, cueillir.
// Le participe passé est trop irrégulier pour être deviné (ouvert, offert).
function familleIrCommeEr(
  infinitif: string,
  pp: string,
  radicalFutur?: string,
): ModeleVerbe {
  const r = infinitif.slice(0, -2); // « ouvrir » → « ouvr »
  return {
    present: [r + "e", r + "es", r + "e", r + "ons", r + "ez", r + "ent"],
    participePasse: pp,
    radicalFutur: radicalFutur ?? infinitif,
    radicalPasseSimple: r,
    voyellePasseSimple: "i",
  };
}

// -aître : connaître, paraître (naître déroge sur le participe et le passé simple).
function familleAitre(infinitif: string): ModeleVerbe {
  const r = infinitif.slice(0, -5); // « connaître » → « conn »
  const long = r + "aiss";
  return {
    present: [
      r + "ais",
      r + "ais",
      r + "aît",
      long + "ons",
      long + "ez",
      long + "ent",
    ],
    participePasse: r + "u",
    radicalFutur: infinitif.slice(0, -1),
    radicalPasseSimple: r,
    voyellePasseSimple: "u",
  };
}

// -crire : écrire, décrire, inscrire.
function familleCrire(infinitif: string): ModeleVerbe {
  const r = infinitif.slice(0, -5); // « écrire » → « é »
  const long = r + "criv";
  return {
    present: [
      r + "cris",
      r + "cris",
      r + "crit",
      long + "ons",
      long + "ez",
      long + "ent",
    ],
    participePasse: r + "crit",
    radicalFutur: infinitif.slice(0, -1),
    radicalPasseSimple: long,
    voyellePasseSimple: "i",
  };
}

// -ttre : mettre, battre. Le « il » est le radical nu (« il met », « il bat »).
function familleTtre(
  infinitif: string,
  pp: string,
  radicalPasseSimple: string,
): ModeleVerbe {
  const court = infinitif.slice(0, -3); // « mettre » → « met »
  return {
    present: [
      court + "s",
      court + "s",
      court,
      court + "tons",
      court + "tez",
      court + "tent",
    ],
    participePasse: pp,
    radicalFutur: infinitif.slice(0, -1),
    radicalPasseSimple,
    voyellePasseSimple: "i",
  };
}

// ---------------------------------------------------------------------------
// Modèles de base
// ---------------------------------------------------------------------------

const BASE: Record<string, ModeleVerbe> = {
  // --- Auxiliaires ---
  être: {
    present: ["suis", "es", "est", "sommes", "êtes", "sont"],
    participePasse: "été",
    radicalFutur: "ser",
    radicalPasseSimple: "f",
    voyellePasseSimple: "u",
    // Seul verbe dont le « nous » ne finit pas par -ons : le radical de
    // l'imparfait ne peut pas en être déduit.
    radicalImparfait: "ét",
    subjonctif: ["sois", "sois", "soit", "soyons", "soyez", "soient"],
    imperatif: ["sois", "soyons", "soyez"],
  },
  avoir: {
    present: ["ai", "as", "a", "avons", "avez", "ont"],
    participePasse: "eu",
    radicalFutur: "aur",
    radicalPasseSimple: "e",
    voyellePasseSimple: "u",
    subjonctif: ["aie", "aies", "ait", "ayons", "ayez", "aient"],
    imperatif: ["aie", "ayons", "ayez"],
  },

  // --- Grands irréguliers ---
  aller: {
    present: ["vais", "vas", "va", "allons", "allez", "vont"],
    participePasse: "allé",
    radicalFutur: "ir",
    radicalPasseSimple: "all",
    voyellePasseSimple: "a",
    auxiliaire: "être",
    subjonctif: { radical: "aill", radicalNousVous: "all" },
    // « vas » ne finit pas par -es : la règle générale ne s'applique pas.
    imperatif: ["va", "allons", "allez"],
  },
  faire: {
    present: ["fais", "fais", "fait", "faisons", "faites", "font"],
    participePasse: "fait",
    radicalFutur: "fer",
    radicalPasseSimple: "f",
    voyellePasseSimple: "i",
    subjonctif: { radical: "fass", radicalNousVous: "fass" },
  },
  // « vous dites » ne vaut que pour dire et redire : « vous contredisez ».
  dire: {
    present: ["dis", "dis", "dit", "disons", "dites", "disent"],
    participePasse: "dit",
    radicalFutur: "dir",
    radicalPasseSimple: "d",
    voyellePasseSimple: "i",
  },
  contredire: {
    present: [
      "contredis",
      "contredis",
      "contredit",
      "contredisons",
      "contredisez",
      "contredisent",
    ],
    participePasse: "contredit",
    radicalFutur: "contredir",
    radicalPasseSimple: "contred",
    voyellePasseSimple: "i",
  },

  // --- Verbes en -oir ---
  pouvoir: {
    present: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"],
    participePasse: "pu",
    radicalFutur: "pourr",
    radicalPasseSimple: "p",
    voyellePasseSimple: "u",
    subjonctif: { radical: "puiss", radicalNousVous: "puiss" },
    imperatif: null, // « pouvoir » n'a pas d'impératif
  },
  vouloir: {
    present: ["veux", "veux", "veut", "voulons", "voulez", "veulent"],
    participePasse: "voulu",
    radicalFutur: "voudr",
    radicalPasseSimple: "voul",
    voyellePasseSimple: "u",
    subjonctif: { radical: "veuill", radicalNousVous: "voul" },
    imperatif: ["veuille", "veuillons", "veuillez"],
  },
  savoir: {
    present: ["sais", "sais", "sait", "savons", "savez", "savent"],
    participePasse: "su",
    radicalFutur: "saur",
    radicalPasseSimple: "s",
    voyellePasseSimple: "u",
    subjonctif: { radical: "sach", radicalNousVous: "sach" },
    imperatif: ["sache", "sachons", "sachez"],
  },
  valoir: {
    present: ["vaux", "vaux", "vaut", "valons", "valez", "valent"],
    participePasse: "valu",
    radicalFutur: "vaudr",
    radicalPasseSimple: "val",
    voyellePasseSimple: "u",
    subjonctif: { radical: "vaill", radicalNousVous: "val" },
  },
  voir: {
    present: ["vois", "vois", "voit", "voyons", "voyez", "voient"],
    participePasse: "vu",
    radicalFutur: "verr",
    radicalPasseSimple: "v",
    voyellePasseSimple: "i",
  },
  devoir: {
    present: ["dois", "dois", "doit", "devons", "devez", "doivent"],
    participePasse: "dû",
    participePasseFeminin: "due", // le circonflexe tombe au féminin
    radicalFutur: "devr",
    radicalPasseSimple: "d",
    voyellePasseSimple: "u",
  },
  // « apercevoir » partage le radical « -cevoir » de recevoir, pas son préfixe.
  apercevoir: {
    present: ["aperçois", "aperçois", "aperçoit", "apercevons", "apercevez", "aperçoivent"],
    participePasse: "aperçu",
    radicalFutur: "apercevr",
    radicalPasseSimple: "aperç",
    voyellePasseSimple: "u",
  },
  recevoir: {
    present: ["reçois", "reçois", "reçoit", "recevons", "recevez", "reçoivent"],
    participePasse: "reçu",
    radicalFutur: "recevr",
    radicalPasseSimple: "reç",
    voyellePasseSimple: "u",
  },
  asseoir: {
    present: ["assieds", "assieds", "assied", "asseyons", "asseyez", "asseyent"],
    participePasse: "assis",
    radicalFutur: "assiér",
    radicalPasseSimple: "ass",
    voyellePasseSimple: "i",
  },

  // --- Familles à radical propre ---
  prendre: {
    present: ["prends", "prends", "prend", "prenons", "prenez", "prennent"],
    participePasse: "pris",
    radicalFutur: "prendr",
    radicalPasseSimple: "pr",
    voyellePasseSimple: "i",
  },
  venir: {
    present: ["viens", "viens", "vient", "venons", "venez", "viennent"],
    participePasse: "venu",
    radicalFutur: "viendr",
    radicalPasseSimple: "v",
    voyellePasseSimple: "in",
    auxiliaire: "être",
  },
  tenir: {
    present: ["tiens", "tiens", "tient", "tenons", "tenez", "tiennent"],
    participePasse: "tenu",
    radicalFutur: "tiendr",
    radicalPasseSimple: "t",
    voyellePasseSimple: "in",
  },
  acquérir: {
    present: [
      "acquiers",
      "acquiers",
      "acquiert",
      "acquérons",
      "acquérez",
      "acquièrent",
    ],
    participePasse: "acquis",
    radicalFutur: "acquerr",
    radicalPasseSimple: "acqu",
    voyellePasseSimple: "i",
  },
  courir: {
    present: ["cours", "cours", "court", "courons", "courez", "courent"],
    participePasse: "couru",
    radicalFutur: "courr", // deux r : « je courrai »
    radicalPasseSimple: "cour",
    voyellePasseSimple: "u",
  },
  mourir: {
    present: ["meurs", "meurs", "meurt", "mourons", "mourez", "meurent"],
    participePasse: "mort",
    radicalFutur: "mourr", // deux r : « je mourrai »
    radicalPasseSimple: "mour",
    voyellePasseSimple: "u",
    auxiliaire: "être",
  },
  fuir: {
    present: ["fuis", "fuis", "fuit", "fuyons", "fuyez", "fuient"],
    participePasse: "fui",
    radicalFutur: "fuir",
    radicalPasseSimple: "fu",
    voyellePasseSimple: "i",
  },
  // 2e groupe à tréma : le tréma tombe au singulier du présent.
  haïr: {
    present: ["hais", "hais", "hait", "haïssons", "haïssez", "haïssent"],
    participePasse: "haï",
    radicalFutur: "haïr",
    radicalPasseSimple: "haï",
    voyellePasseSimple: "i",
  },

  boire: {
    present: ["bois", "bois", "boit", "buvons", "buvez", "boivent"],
    participePasse: "bu",
    radicalFutur: "boir",
    radicalPasseSimple: "b",
    voyellePasseSimple: "u",
  },
  croire: {
    present: ["crois", "crois", "croit", "croyons", "croyez", "croient"],
    participePasse: "cru",
    radicalFutur: "croir",
    radicalPasseSimple: "cr",
    voyellePasseSimple: "u",
  },
  lire: {
    present: ["lis", "lis", "lit", "lisons", "lisez", "lisent"],
    participePasse: "lu",
    radicalFutur: "lir",
    radicalPasseSimple: "l",
    voyellePasseSimple: "u",
  },
  rire: {
    present: ["ris", "ris", "rit", "rions", "riez", "rient"],
    participePasse: "ri",
    radicalFutur: "rir",
    radicalPasseSimple: "r",
    voyellePasseSimple: "i",
  },
  plaire: {
    present: ["plais", "plais", "plaît", "plaisons", "plaisez", "plaisent"],
    participePasse: "plu",
    radicalFutur: "plair",
    radicalPasseSimple: "pl",
    voyellePasseSimple: "u",
  },
  vivre: {
    present: ["vis", "vis", "vit", "vivons", "vivez", "vivent"],
    participePasse: "vécu",
    radicalFutur: "vivr",
    radicalPasseSimple: "véc",
    voyellePasseSimple: "u",
  },
  suivre: {
    present: ["suis", "suis", "suit", "suivons", "suivez", "suivent"],
    participePasse: "suivi",
    radicalFutur: "suivr",
    radicalPasseSimple: "suiv",
    voyellePasseSimple: "i",
  },
  vaincre: {
    present: ["vaincs", "vaincs", "vainc", "vainquons", "vainquez", "vainquent"],
    participePasse: "vaincu",
    radicalFutur: "vaincr",
    radicalPasseSimple: "vainqu",
    voyellePasseSimple: "i",
  },
  rompre: {
    present: ["romps", "romps", "rompt", "rompons", "rompez", "rompent"],
    participePasse: "rompu",
    radicalFutur: "rompr",
    radicalPasseSimple: "romp",
    voyellePasseSimple: "i",
  },
  conclure: {
    present: ["conclus", "conclus", "conclut", "concluons", "concluez", "concluent"],
    participePasse: "conclu",
    radicalFutur: "conclur",
    radicalPasseSimple: "concl",
    voyellePasseSimple: "u",
  },
  naître: {
    ...familleAitre("naître"),
    participePasse: "né",
    radicalPasseSimple: "naqu",
    voyellePasseSimple: "i",
    auxiliaire: "être",
  },
  // Seul verbe du 1er groupe à porter un modèle : présent régulier en -yer,
  // mais futur en « enverr- ».
  envoyer: {
    present: ["envoie", "envoies", "envoie", "envoyons", "envoyez", "envoient"],
    participePasse: "envoyé",
    radicalFutur: "enverr",
    radicalPasseSimple: "envoy",
    voyellePasseSimple: "a",
  },

  // --- Familles construites ---
  rendre: familleEnDre("rendre"),
  peindre: familleInDre("peindre"),
  craindre: familleInDre("craindre"),
  joindre: familleInDre("joindre"),
  conduire: familleUire("conduire"),
  partir: familleIrConsonne("partir"),
  ouvrir: familleIrCommeEr("ouvrir", "ouvert"),
  offrir: familleIrCommeEr("offrir", "offert"),
  // « souffrir » n’est pas « s- » + « offrir » : son radical lui est propre.
  souffrir: familleIrCommeEr("souffrir", "souffert"),
  cueillir: familleIrCommeEr("cueillir", "cueilli", "cueiller"),
  connaître: familleAitre("connaître"),
  paraître: familleAitre("paraître"),
  écrire: familleCrire("écrire"),
  décrire: familleCrire("décrire"),
  mettre: familleTtre("mettre", "mis", "m"),
  battre: familleTtre("battre", "battu", "batt"),
};

// ---------------------------------------------------------------------------
// Verbes construits sur un modèle par préfixation
// ---------------------------------------------------------------------------

function prefixer(m: ModeleVerbe, p: string): ModeleVerbe {
  const six = (f: Formes6): Formes6 => [
    p + f[0],
    p + f[1],
    p + f[2],
    p + f[3],
    p + f[4],
    p + f[5],
  ];
  return {
    ...m,
    present: six(m.present),
    participePasse: p + m.participePasse,
    participePasseFeminin: m.participePasseFeminin
      ? p + m.participePasseFeminin
      : undefined,
    radicalFutur: p + m.radicalFutur,
    radicalPasseSimple: p + m.radicalPasseSimple,
    radicalImparfait:
      m.radicalImparfait !== undefined ? p + m.radicalImparfait : undefined,
    subjonctif: Array.isArray(m.subjonctif)
      ? six(m.subjonctif)
      : m.subjonctif
        ? {
            radical: p + m.subjonctif.radical,
            radicalNousVous: m.subjonctif.radicalNousVous
              ? p + m.subjonctif.radicalNousVous
              : undefined,
          }
        : undefined,
    imperatif:
      m.imperatif === null || m.imperatif === undefined
        ? m.imperatif
        : [p + m.imperatif[0], p + m.imperatif[1], p + m.imperatif[2]],
  };
}

// [modèle de base, préfixe] — l'auxiliaire se règle dans data/verbes.ts.
const COMPOSES: Record<string, [string, string]> = {
  apprendre: ["prendre", "ap"],
  comprendre: ["prendre", "com"],
  surprendre: ["prendre", "sur"],
  reprendre: ["prendre", "re"],
  entreprendre: ["prendre", "entre"],
  permettre: ["mettre", "per"],
  promettre: ["mettre", "pro"],
  remettre: ["mettre", "re"],
  admettre: ["mettre", "ad"],
  soumettre: ["mettre", "sou"],
  transmettre: ["mettre", "trans"],
  commettre: ["mettre", "com"],
  obtenir: ["tenir", "ob"],
  retenir: ["tenir", "re"],
  contenir: ["tenir", "con"],
  maintenir: ["tenir", "main"],
  soutenir: ["tenir", "sou"],
  appartenir: ["tenir", "appar"],
  entretenir: ["tenir", "entre"],
  devenir: ["venir", "de"],
  revenir: ["venir", "re"],
  parvenir: ["venir", "par"],
  survenir: ["venir", "sur"],
  intervenir: ["venir", "inter"],
  prévenir: ["venir", "pré"],
  convenir: ["venir", "con"],
  repartir: ["partir", "re"],
  couvrir: ["ouvrir", "c"],
  découvrir: ["ouvrir", "déc"],
  recouvrir: ["ouvrir", "rec"],
  sourire: ["rire", "sou"],
  revoir: ["voir", "re"],
  poursuivre: ["suivre", "pour"],
  survivre: ["vivre", "sur"],
  interrompre: ["rompre", "inter"],
  reconnaître: ["connaître", "re"],
  disparaître: ["paraître", "dis"],
  revivre: ["vivre", "re"],
  redire: ["dire", "re"],
  refaire: ["faire", "re"],
  satisfaire: ["faire", "satis"],
  relire: ["lire", "re"],
  recourir: ["courir", "re"],
  parcourir: ["courir", "par"],
  rejoindre: ["joindre", "re"],
};

// ---------------------------------------------------------------------------
// Table finale
// ---------------------------------------------------------------------------

export const MODELES: Record<string, ModeleVerbe> = {
  ...BASE,
  // Familles supplémentaires bâties par fabrique.
  attendre: familleEnDre("attendre"),
  entendre: familleEnDre("entendre"),
  descendre: familleEnDre("descendre"),
  vendre: familleEnDre("vendre"),
  répondre: familleEnDre("répondre"),
  perdre: familleEnDre("perdre"),
  mordre: familleEnDre("mordre"),
  tordre: familleEnDre("tordre"),
  confondre: familleEnDre("confondre"),
  défendre: familleEnDre("défendre"),
  prétendre: familleEnDre("prétendre"),
  suspendre: familleEnDre("suspendre"),
  fondre: familleEnDre("fondre"),
  atteindre: familleInDre("atteindre"),
  éteindre: familleInDre("éteindre"),
  teindre: familleInDre("teindre"),
  plaindre: familleInDre("plaindre"),
  contraindre: familleInDre("contraindre"),
  construire: familleUire("construire"),
  produire: familleUire("produire"),
  traduire: familleUire("traduire"),
  détruire: familleUire("détruire"),
  réduire: familleUire("réduire"),
  introduire: familleUire("introduire"),
  cuire: familleUire("cuire"),
  séduire: familleUire("séduire"),
  sortir: familleIrConsonne("sortir"),
  dormir: familleIrConsonne("dormir"),
  servir: familleIrConsonne("servir"),
  sentir: familleIrConsonne("sentir"),
  mentir: familleIrConsonne("mentir"),
  ressentir: familleIrConsonne("ressentir"),
  apparaître: familleAitre("apparaître"),
  inscrire: familleCrire("inscrire"),
  // Verbes bâtis par préfixation d'un modèle de base.
  ...Object.fromEntries(
    Object.entries(COMPOSES).map(([nom, [base, prefixe]]) => {
      return [nom, prefixer(BASE[base], prefixe)];
    }),
  ),
};
