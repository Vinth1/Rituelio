// Vérifie le cloisonnement multi-prof de bout en bout, par HTTP :
// `npm run test:cloisonnement`, avec `npm run dev` lancé dans un autre terminal.
//
// Le script crée deux comptes jetables A et B (via l'inscription : CLE_INSCRIPTION
// doit être définie), fait créer à A une donnée de chaque type, puis tente, en
// tant que B, de les lire, modifier et supprimer avec les identifiants et codes
// de A. Chaque tentative doit échouer ET laisser les données de A intactes. À la
// fin, les deux comptes sont supprimés (la cascade emporte leurs données).
//
// LOCAL UNIQUEMENT : il refuse de tourner si le serveur ou la base ne sont pas sur
// cette machine — il crée des comptes et, tant qu'un trou existe, abîme les
// données du compte A.
//
// Option : RITUELIO_URL (défaut http://localhost:3000).
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Pas de .env.local : les variables doivent venir de l'environnement.
}

const BASE = (process.env.RITUELIO_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CLE = process.env.CLE_INSCRIPTION ?? "";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

function estLocal(url: string): boolean {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function arreter(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!estLocal(BASE)) arreter(`RITUELIO_URL doit être locale (reçu : ${BASE}).`);
if (!estLocal(DATABASE_URL)) {
  arreter("DATABASE_URL doit pointer vers une base locale (voir README > Développement).");
}
if (!CLE) arreter("CLE_INSCRIPTION manquante : l'inscription des comptes de test est impossible.");

// ===== Client HTTP minimal (le cookie de session est porté à la main) =====

// Les réponses JSON sont lues sans schéma : un script de test n'a pas à
// dupliquer les types de l'application.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
type Reponse = { status: number; json: Json };
type Appel = (methode: string, chemin: string, corps?: unknown) => Promise<Reponse>;
type Prof = { identifiant: string; appel: Appel };

async function requete(
  cookie: string | null,
  methode: string,
  chemin: string,
  corps?: unknown,
): Promise<Reponse & { cookies: string[] }> {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = cookie;
  let body: BodyInit | undefined;
  if (corps instanceof FormData) {
    body = corps;
  } else if (corps !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(corps);
  }
  const r = await fetch(BASE + chemin, { method: methode, headers, body, redirect: "manual" });
  const texte = await r.text();
  let json: Json = null;
  try {
    json = JSON.parse(texte);
  } catch {
    // Réponse non JSON (export xlsx, fichier image…) : seul le statut compte.
  }
  return { status: r.status, json, cookies: r.headers.getSetCookie() };
}

const anonyme: Appel = (methode, chemin, corps) => requete(null, methode, chemin, corps);

async function inscrire(lettre: string, suffixe: string): Promise<Prof> {
  const identifiant = `test-cloison-${lettre}-${suffixe}`;
  const r = await requete(null, "POST", "/api/auth/inscription", {
    email: `${identifiant}@exemple.test`,
    identifiant,
    motDePasse: crypto.randomUUID(),
    cleInscription: CLE,
  });
  const cookie = r.cookies.map((c) => c.split(";")[0]).find((c) => c.startsWith("rituelio_prof="));
  if (r.status !== 201 || !cookie) {
    throw new Error(`inscription du compte ${lettre} impossible (${r.status}) : ${JSON.stringify(r.json)}`);
  }
  return { identifiant, appel: (m, c, b) => requete(cookie, m, c, b) };
}

// Préparation : une étape qui échoue n'est pas un défaut de cloisonnement, le
// script s'arrête net.
function exiger(r: Reponse, statut: number, etape: string): Json {
  if (r.status !== statut) {
    throw new Error(`préparation « ${etape} » : statut ${r.status} (attendu ${statut}) — ${JSON.stringify(r.json)}`);
  }
  return r.json;
}

// ===== Compte rendu =====

const resultats: { libelle: string; ok: boolean }[] = [];

function section(titre: string): void {
  console.log(`\n▸ ${titre}`);
}

function verifier(libelle: string, ok: boolean, detail = ""): void {
  resultats.push({ libelle, ok });
  console.log(`  ${ok ? "✅" : "❌"} ${libelle}${!ok && detail ? `\n       → ${detail}` : ""}`);
}

const refuse = (r: Reponse) => r.status >= 400;
const ids = (liste: Json): string[] => (Array.isArray(liste) ? liste.map((x: Json) => x.id) : []);

// PNG 1×1 : de quoi exercer la banque d'images sans fichier sur disque.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

// ===== Scénario =====

async function scenario(A: Prof, B: Prof, suffixe: string, nettoyages: (() => Promise<unknown>)[]) {
  section("Préparation : A crée une donnée de chaque type");
  const classeA = crypto.randomUUID();
  const eleveA = crypto.randomUUID();
  exiger(
    await A.appel("PUT", "/api/classes", {
      classes: [{ id: classeA, nom: "Classe A", eleves: [{ id: eleveA, nom: "Élève A" }] }],
    }),
    200,
    "classe",
  );
  const matiereA = exiger(
    await A.appel("POST", "/api/ma-classe/matieres", { classeId: classeA, nom: "Français A" }),
    201,
    "matière",
  ).matiere.id;
  const entreeTache = { trimestre: 1, dateISO: "2026-09-15", bareme: 20, ponderation: 1 };
  const tacheA = exiger(
    await A.appel("POST", "/api/ma-classe/taches", { ...entreeTache, matiereId: matiereA, nom: "Tâche A" }),
    201,
    "tâche",
  ).tache.id;
  exiger(
    await A.appel("PUT", "/api/ma-classe/notes", { tacheId: tacheA, eleveId: eleveA, points: 15, commentaire: "" }),
    200,
    "note",
  );
  const entreeFait = { dateISO: "2026-09-15", type: "merit", raison: "Raison A", details: "" };
  const faitA = exiger(
    await A.appel("POST", "/api/ma-classe/comportement", { ...entreeFait, eleveId: eleveA, classeId: classeA }),
    201,
    "fait de comportement",
  ).fait.id;
  const entreeCreneau = { matiere: "Français", heureDebut: "08:00", heureFin: "08:45", salle: "A1" };
  const creneauA = exiger(
    await A.appel("POST", "/api/ma-classe/creneaux", { ...entreeCreneau, classeId: classeA, jour: 1 }),
    201,
    "créneau",
  ).id;
  const entreePrepa = {
    dateISO: "2026-09-14",
    objectifs: "",
    deroule: "",
    materiel: "",
    activitesRituelio: [],
    statut: "prete",
    notesApres: "",
  };
  const prepaA = exiger(
    await A.appel("PUT", "/api/ma-classe/prepas", { ...entreePrepa, creneauId: creneauA, titre: "Prépa A" }),
    200,
    "prépa",
  ).prepa.id;
  const reglagesA = {
    urlVulkan: "https://vulkan.exemple/a",
    urlClassdojo: "https://dojo.exemple/a",
    trimestres: [{ numero: 1, dateDebut: "2026-09-01", dateFin: "2026-12-20" }],
  };
  exiger(await A.appel("PUT", "/api/ma-classe/reglages", reglagesA), 200, "réglages");
  const epreuveA = exiger(await A.appel("POST", "/api/epreuves", { titre: "Épreuve A" }), 201, "épreuve").id;
  const tagA = `theme-a-${suffixe}`;
  const dicteeA = exiger(
    await A.appel("POST", "/api/dictees", { titre: "Dictée A", texte: "Le chat dort.", tags: [tagA] }),
    201,
    "dictée",
  ).dictee.id;

  const form = new FormData();
  form.set("fichier", new File([PNG_1X1], "a.png", { type: "image/png" }));
  form.set("titre", "Image A");
  form.set("tags", tagA);
  form.set("largeur", "1");
  form.set("hauteur", "1");
  const depot = await A.appel("POST", "/api/images", form);
  const imageA: string | null = depot.status === 201 ? depot.json.image.id : null;
  if (imageA) {
    nettoyages.push(() => A.appel("DELETE", `/api/images/${imageA}`));
  } else {
    console.log(`  ⚠️ banque d'images indisponible (${depot.status}) : ses vérifications sont sautées`);
  }

  const verbeA = exiger(
    await A.appel("POST", "/api/verbes-perso", { infinitif: "cloisonner", groupe: "1er groupe", auxiliaire: "avoir" }),
    201,
    "verbe perso",
  ).verbe.id;
  const codeA: string = exiger(
    await A.appel("POST", "/api/evaluations", {
      name: "Éval A",
      classeId: classeA,
      classeNom: "Classe A",
      date: "2026-09-15",
      verbes: [{ infinitif: "chanter", temps: "présent", mode: "indicatif" }],
      contraintes: ["Contrainte A"],
    }),
    201,
    "évaluation de conjugaison",
  ).code;
  const pronoms = ["je", "tu", "il", "nous", "vous", "ils"];
  const formes = ["chante", "chantes", "chante", "chantons", "chantez", "chantent"];
  const copieA = exiger(
    await anonyme("POST", `/api/evaluations/${codeA}/copies`, {
      prenom: "Élève A",
      tableaux: [{ lignes: pronoms.map((pronom, i) => ({ pronom, forme: formes[i] })) }],
      phrase: "Je chante.",
    }),
    201,
    "copie d'élève",
  ).id;
  console.log("  ✔ données de A en place");

  section("Préparation : B crée sa propre classe");
  const classeB = crypto.randomUUID();
  const eleveB = crypto.randomUUID();
  const classesB = [{ id: classeB, nom: "Classe B", eleves: [{ id: eleveB, nom: "Élève B" }] }];
  exiger(await B.appel("PUT", "/api/classes", { classes: classesB }), 200, "classe de B");
  const matiereB = exiger(
    await B.appel("POST", "/api/ma-classe/matieres", { classeId: classeB, nom: "Français B" }),
    201,
    "matière de B",
  ).matiere.id;
  const tacheB = exiger(
    await B.appel("POST", "/api/ma-classe/taches", { ...entreeTache, matiereId: matiereB, nom: "Tâche B" }),
    201,
    "tâche de B",
  ).tache.id;
  console.log("  ✔ données de B en place");

  // Lectures de contrôle, toujours faites en tant que A.
  const carnetA = async () => (await A.appel("GET", `/api/ma-classe/carnet?matiereId=${matiereA}&trimestre=1`)).json;
  const classesDeA = async () => (await A.appel("GET", "/api/classes")).json.classes as Json[];

  section("Sans session : l'espace prof est fermé");
  for (const chemin of [
    "/api/classes",
    "/api/ma-classe/creneaux",
    "/api/ma-classe/reglages",
    "/api/epreuves",
    "/api/dictees",
    "/api/images",
    "/api/verbes-perso",
    `/api/evaluations?classeId=${classeA}`,
    `/api/evaluations/${codeA}/copies`,
  ]) {
    const r = await anonyme("GET", chemin);
    verifier(`GET ${chemin.split("?")[0]} → 401`, r.status === 401, `statut ${r.status}`);
  }

  section("Classes & élèves (lecture)");
  {
    const r = await B.appel("GET", "/api/classes");
    const vues = (r.json?.classes ?? []) as Json[];
    verifier(
      "B ne voit ni la classe ni les élèves de A",
      r.status === 200 && !vues.some((c) => c.id === classeA || c.eleves.some((e: Json) => e.id === eleveA)),
    );
  }

  section("Carnet de notes");
  {
    const r = await B.appel("GET", `/api/ma-classe/matieres?classeId=${classeA}`);
    verifier("B ne voit pas les matières de A", r.json?.matieres?.length === 0, `statut ${r.status}`);
  }
  {
    const r = await B.appel("GET", `/api/ma-classe/carnet?matiereId=${matiereA}&trimestre=1`);
    verifier(
      "B ne voit ni les tâches ni les notes de A",
      r.json?.taches?.length === 0 && r.json?.notes?.length === 0,
      `statut ${r.status}`,
    );
  }
  {
    const r = await B.appel("GET", `/api/ma-classe/carnet/export?matiereId=${matiereA}&trimestre=1`);
    verifier("B ne peut pas exporter le carnet de A", r.status === 404, `statut ${r.status}`);
  }
  {
    const r = await B.appel("POST", "/api/ma-classe/matieres", { classeId: classeA, nom: "Matière pirate" });
    const matieres = (await A.appel("GET", `/api/ma-classe/matieres?classeId=${classeA}`)).json.matieres;
    verifier("B ne peut pas ajouter une matière à une classe de A", refuse(r) && matieres.length === 1, `statut ${r.status}`);
  }
  {
    const r = await B.appel("POST", "/api/ma-classe/taches", { ...entreeTache, matiereId: matiereA, nom: "Tâche pirate" });
    verifier("B ne peut pas ajouter une tâche à une matière de A", refuse(r), `statut ${r.status}`);
  }
  {
    const r = await B.appel("PUT", `/api/ma-classe/taches/${tacheA}`, { ...entreeTache, matiereId: matiereA, nom: "Tâche piratée" });
    const tache = (await carnetA()).taches.find((t: Json) => t.id === tacheA);
    verifier("B ne peut pas modifier une tâche de A", refuse(r) && tache?.nom === "Tâche A", `statut ${r.status}`);
  }
  {
    const r = await B.appel("PUT", "/api/ma-classe/notes", { tacheId: tacheA, eleveId: eleveA, points: 0, commentaire: "" });
    const note = (await carnetA()).notes.find((n: Json) => n.tacheId === tacheA && n.eleveId === eleveA);
    verifier("B ne peut pas modifier une note de A", refuse(r) && note?.points === 15, `statut ${r.status}`);
  }
  {
    const r = await B.appel("PUT", "/api/ma-classe/notes", { tacheId: tacheB, eleveId: eleveA, points: 0, commentaire: "" });
    verifier("B ne peut pas noter un élève de A dans son propre carnet", refuse(r), `statut ${r.status}`);
  }
  {
    await B.appel("DELETE", `/api/ma-classe/taches/${tacheA}`);
    await B.appel("DELETE", `/api/ma-classe/matieres/${matiereA}`);
    const carnet = await carnetA();
    const matieres = (await A.appel("GET", `/api/ma-classe/matieres?classeId=${classeA}`)).json.matieres;
    verifier(
      "Les suppressions de B n'atteignent ni la tâche ni la matière de A",
      ids(carnet.taches).includes(tacheA) && ids(matieres).includes(matiereA),
    );
  }

  section("Comportement");
  {
    const r = await B.appel("GET", `/api/ma-classe/comportement?classeId=${classeA}`);
    verifier("B ne voit pas les faits de A", r.json?.faits?.length === 0, `statut ${r.status}`);
  }
  {
    const r = await B.appel("POST", "/api/ma-classe/comportement", { ...entreeFait, eleveId: eleveA, classeId: classeA });
    verifier("B ne peut pas saisir un fait sur un élève de A", refuse(r), `statut ${r.status}`);
  }
  {
    const r = await B.appel("POST", "/api/ma-classe/comportement", { ...entreeFait, eleveId: eleveA, classeId: classeB });
    verifier("… même en le rattachant à sa propre classe", refuse(r), `statut ${r.status}`);
  }
  {
    await B.appel("DELETE", `/api/ma-classe/comportement/${faitA}`);
    const faits = (await A.appel("GET", `/api/ma-classe/comportement?classeId=${classeA}`)).json.faits;
    verifier("B ne peut pas supprimer un fait de A", ids(faits).includes(faitA));
  }

  section("Emploi du temps & prépas");
  {
    const r = await B.appel("GET", "/api/ma-classe/creneaux");
    verifier("B ne voit pas les créneaux de A", r.status === 200 && !ids(r.json?.creneaux).includes(creneauA), `statut ${r.status}`);
  }
  {
    const r = await B.appel("POST", "/api/ma-classe/creneaux", { ...entreeCreneau, classeId: classeA, jour: 2 });
    verifier("B ne peut pas créer un créneau sur une classe de A", refuse(r), `statut ${r.status}`);
  }
  {
    const r = await B.appel("PUT", `/api/ma-classe/creneaux/${creneauA}`, { ...entreeCreneau, classeId: classeB, jour: 3 });
    const creneau = (await A.appel("GET", "/api/ma-classe/creneaux")).json.creneaux.find((c: Json) => c.id === creneauA);
    verifier(
      "B ne peut pas modifier un créneau de A",
      refuse(r) && creneau?.classeId === classeA && creneau?.jour === 1,
      `statut ${r.status}`,
    );
  }
  {
    const r = await B.appel("GET", "/api/ma-classe/prepas?du=2026-09-01&au=2026-09-30");
    verifier("B ne voit pas les prépas de A", r.status === 200 && !ids(r.json?.prepas).includes(prepaA), `statut ${r.status}`);
  }
  {
    const r = await B.appel("PUT", "/api/ma-classe/prepas", { ...entreePrepa, creneauId: creneauA, titre: "Prépa piratée" });
    const prepa = (await A.appel("GET", "/api/ma-classe/prepas?du=2026-09-01&au=2026-09-30")).json.prepas.find(
      (p: Json) => p.id === prepaA,
    );
    verifier("B ne peut pas écrire la prépa d'un créneau de A", refuse(r) && prepa?.titre === "Prépa A", `statut ${r.status}`);
  }
  {
    await B.appel("DELETE", `/api/ma-classe/prepas/${prepaA}`);
    await B.appel("DELETE", `/api/ma-classe/creneaux/${creneauA}`);
    const creneaux = (await A.appel("GET", "/api/ma-classe/creneaux")).json.creneaux;
    const prepas = (await A.appel("GET", "/api/ma-classe/prepas?du=2026-09-01&au=2026-09-30")).json.prepas;
    verifier(
      "Les suppressions de B n'atteignent ni la prépa ni le créneau de A",
      ids(creneaux).includes(creneauA) && ids(prepas).includes(prepaA),
    );
  }

  section("Réglages Ma classe");
  {
    const r = await B.appel("GET", "/api/ma-classe/reglages");
    verifier("B ne voit pas les réglages de A", r.status === 200 && r.json?.urlVulkan !== reglagesA.urlVulkan, `statut ${r.status}`);
  }
  {
    await B.appel("PUT", "/api/ma-classe/reglages", {
      urlVulkan: "https://vulkan.exemple/b",
      urlClassdojo: "https://dojo.exemple/b",
      trimestres: [{ numero: 1, dateDebut: "2026-09-02", dateFin: "2026-12-19" }],
    });
    const r = (await A.appel("GET", "/api/ma-classe/reglages")).json;
    verifier(
      "Les réglages de B n'écrasent pas ceux de A",
      r.urlVulkan === reglagesA.urlVulkan && r.trimestres[0].dateDebut === "2026-09-01",
    );
  }

  section("Épreuves");
  {
    const liste = await B.appel("GET", "/api/epreuves");
    const une = await B.appel("GET", `/api/epreuves/${epreuveA}`);
    verifier(
      "B ne voit pas les épreuves de A",
      liste.status === 200 && !ids(liste.json?.epreuves).includes(epreuveA) && une.status === 404,
      `statuts ${liste.status} / ${une.status}`,
    );
  }
  {
    const r = await B.appel("PUT", `/api/epreuves/${epreuveA}`, {
      titre: "Épreuve piratée",
      description: "",
      melangeQuestions: false,
      questions: [],
    });
    await B.appel("DELETE", `/api/epreuves/${epreuveA}`);
    const epreuve = await A.appel("GET", `/api/epreuves/${epreuveA}`);
    verifier(
      "B ne peut ni modifier ni supprimer une épreuve de A",
      r.status === 404 && epreuve.json?.epreuve?.titre === "Épreuve A",
      `statut ${r.status}`,
    );
  }

  section("Dictées");
  {
    const liste = await B.appel("GET", "/api/dictees");
    const une = await B.appel("GET", `/api/dictees/${dicteeA}`);
    const tags = await B.appel("GET", "/api/dictees/tags");
    verifier(
      "B ne voit ni les dictées ni les tags de A",
      liste.status === 200 &&
        tags.status === 200 &&
        !ids(liste.json?.dictees).includes(dicteeA) &&
        une.status === 404 &&
        !(tags.json?.tags ?? []).some((t: Json) => t.tag === tagA),
      `statuts ${liste.status} / ${une.status} / ${tags.status}`,
    );
  }
  {
    const r = await B.appel("PUT", `/api/dictees/${dicteeA}`, { titre: "Dictée piratée", texte: "", tags: [] });
    const s = await B.appel("DELETE", `/api/dictees/${dicteeA}`);
    const dictee = await A.appel("GET", `/api/dictees/${dicteeA}`);
    verifier(
      "B ne peut ni modifier ni supprimer une dictée de A",
      refuse(r) && refuse(s) && dictee.json?.dictee?.titre === "Dictée A",
      `statuts ${r.status} / ${s.status}`,
    );
  }

  if (imageA) {
    section("Banque d'images");
    {
      const liste = await B.appel("GET", "/api/images");
      const fichier = await B.appel("GET", `/api/images/${imageA}/fichier`);
      const tags = await B.appel("GET", "/api/images/tags");
      verifier(
        "B ne voit ni les images, ni leurs fichiers, ni leurs thèmes",
        liste.status === 200 &&
          tags.status === 200 &&
          !ids(liste.json?.images).includes(imageA) &&
          fichier.status === 404 &&
          !(tags.json?.tags ?? []).some((t: Json) => t.tag === tagA),
        `statuts ${liste.status} / ${fichier.status} / ${tags.status}`,
      );
    }
    {
      const r = await B.appel("PATCH", `/api/images/${imageA}`, { titre: "Image piratée", tags: [] });
      const s = await B.appel("DELETE", `/api/images/${imageA}`);
      const image = (await A.appel("GET", "/api/images")).json.images.find((i: Json) => i.id === imageA);
      verifier(
        "B ne peut ni modifier ni supprimer une image de A",
        refuse(r) && refuse(s) && image?.titre === "Image A",
        `statuts ${r.status} / ${s.status}`,
      );
    }
  }

  section("Verbes personnalisés");
  {
    const r = await B.appel("GET", "/api/verbes-perso");
    verifier("B ne voit pas les verbes de A", r.status === 200 && !ids(r.json?.verbes).includes(verbeA), `statut ${r.status}`);
  }
  {
    await B.appel("DELETE", `/api/verbes-perso/${verbeA}`);
    const verbes = (await A.appel("GET", "/api/verbes-perso")).json.verbes;
    verifier("B ne peut pas supprimer un verbe de A", ids(verbes).includes(verbeA));
  }

  section("Évaluations de conjugaison");
  {
    const r = await B.appel("GET", `/api/evaluations?classeId=${classeA}`);
    verifier("B ne voit pas l'historique des évaluations de A", r.json?.evaluations?.length === 0, `statut ${r.status}`);
  }
  let codeB = "";
  {
    codeB = exiger(
      await B.appel("POST", "/api/evaluations", {
        name: "Éval B",
        classeId: classeA,
        classeNom: "Classe A",
        date: "2026-09-15",
        verbes: [{ infinitif: "chanter", temps: "présent", mode: "indicatif" }],
        contraintes: [],
      }),
      201,
      "évaluation de B",
    ).code;
    const evals = (await A.appel("GET", `/api/evaluations?classeId=${classeA}`)).json.evaluations;
    verifier(
      "Une évaluation de B ne s'accroche pas à une classe de A",
      evals.length === 1 && evals[0].code === codeA,
      `${evals.length} évaluation(s) dans l'historique de A`,
    );
  }
  {
    const r = await B.appel("GET", `/api/evaluations/${codeA}/carnet`);
    const s = await B.appel("POST", `/api/evaluations/${codeA}/carnet`, {
      matiereId: matiereB,
      trimestre: 1,
      dateISO: "2026-09-15",
      nom: "Import pirate",
      ponderation: 1,
      attributions: [{ submissionId: copieA, eleveId: eleveB }],
      absents: [],
    });
    verifier(
      "B ne peut pas importer une évaluation de A dans son carnet",
      r.status === 404 && refuse(s),
      `statuts ${r.status} / ${s.status}`,
    );
  }
  {
    const r = await B.appel("GET", `/api/evaluations/${codeA}/copies`);
    const lues = Array.isArray(r.json?.copies) ? r.json.copies.length : 0;
    verifier("B ne lit pas les copies de A", refuse(r) && lues === 0, `statut ${r.status}, ${lues} copie(s) lue(s)`);
  }
  const copieDeA = async () =>
    (await A.appel("GET", `/api/evaluations/${codeA}/copies`)).json.copies.find((c: Json) => c.id === copieA);
  const intacte = (copie: Json) =>
    copie?.commentaire === "" && copie?.noteForcee === null && copie?.contraintes.every((c: Json) => !c.validee);
  const correctionPirate = { contraintesValidees: ["Contrainte A"], commentaire: "Commentaire pirate", noteForcee: 0 };
  {
    const r = await B.appel("PATCH", `/api/evaluations/${codeA}/copies/${copieA}`, correctionPirate);
    const copie = await copieDeA();
    verifier(
      "B ne peut pas corriger une copie de A",
      refuse(r) && intacte(copie),
      `statut ${r.status} ; copie de A : note forcée ${copie?.noteForcee}, commentaire « ${copie?.commentaire} »`,
    );
  }
  {
    const r = await B.appel("PATCH", `/api/evaluations/${codeB}/copies/${copieA}`, correctionPirate);
    const copie = await copieDeA();
    verifier(
      "… ni en passant par le code de sa propre évaluation",
      refuse(r) && intacte(copie),
      `statut ${r.status} ; copie de A : note forcée ${copie?.noteForcee}, commentaire « ${copie?.commentaire} »`,
    );
  }
  {
    const r = await B.appel("PATCH", `/api/evaluations/${codeA}`, { statut: "terminee" });
    const statut = (await anonyme("GET", `/api/evaluations/${codeA}`)).json?.evaluation?.status;
    verifier(
      "B ne peut pas clôturer une évaluation de A",
      refuse(r) && statut === "ouverte",
      `statut ${r.status} ; évaluation de A : ${statut}`,
    );
  }

  // Contrôles inverses : un filtre qui refuserait tout le monde passerait les
  // vérifications ci-dessus. Le propriétaire doit garder la main.
  section("Évaluations de conjugaison : A garde la main");
  {
    const r = await A.appel("PATCH", `/api/evaluations/${codeA}/copies/${copieA}`, {
      contraintesValidees: ["Contrainte A"],
      commentaire: "Bien",
      noteForcee: 18,
    });
    const copie = await copieDeA();
    verifier(
      "A corrige sa copie",
      r.status === 200 && copie?.commentaire === "Bien" && copie?.noteForcee === 18 && copie?.contraintes[0]?.validee === true,
      `statut ${r.status}`,
    );
  }
  {
    const r = await A.appel("GET", `/api/evaluations/${codeA}/carnet`);
    const s = await A.appel("POST", `/api/evaluations/${codeA}/carnet`, {
      matiereId: matiereA,
      trimestre: 1,
      dateISO: "2026-09-15",
      nom: "Éval A importée",
      ponderation: 1,
      attributions: [{ submissionId: copieA, eleveId: eleveA }],
      absents: [],
    });
    const importee = (await carnetA()).taches.find((t: Json) => t.nom === "Éval A importée");
    verifier(
      "A envoie son évaluation dans son carnet",
      r.status === 200 && r.json?.preparation?.copies?.length === 1 && s.status === 201 && !!importee,
      `statuts ${r.status} / ${s.status}`,
    );
  }
  {
    const r = await A.appel("PATCH", `/api/evaluations/${codeA}`, { statut: "terminee" });
    const statut = (await anonyme("GET", `/api/evaluations/${codeA}`)).json?.evaluation?.status;
    verifier("A clôture son évaluation", r.status === 200 && statut === "terminee", `statut ${r.status} ; évaluation : ${statut}`);
  }

  // En dernier : si un trou réapparaît, ces écritures suppriment des données de A
  // (et, par cascade, ses notes et faits de comportement).
  section("Classes & élèves (écriture)");
  {
    const r = await B.appel("PUT", "/api/classes", {
      classes: [{ ...classesB[0], eleves: [...classesB[0].eleves, { id: eleveA, nom: "Élève piraté" }] }],
    });
    const eleve = (await classesDeA()).find((c) => c.id === classeA)?.eleves.find((e: Json) => e.id === eleveA);
    verifier(
      "B ne peut pas renommer un élève de A",
      refuse(r) && eleve?.nom === "Élève A",
      `statut ${r.status} ; élève de A : « ${eleve?.nom} »`,
    );
  }
  {
    const r = await B.appel("PUT", "/api/classes", {
      classes: [...classesB, { id: classeA, nom: "Classe piratée", eleves: [] }],
    });
    const classe = (await classesDeA()).find((c) => c.id === classeA);
    verifier(
      "B ne peut pas renommer une classe de A",
      refuse(r) && classe?.nom === "Classe A",
      `statut ${r.status} ; classe de A : « ${classe?.nom} »`,
    );
    verifier(
      "B ne peut pas vider une classe de A",
      ids(classe?.eleves).includes(eleveA),
      `${classe?.eleves.length ?? 0} élève(s) restant(s) dans la classe de A`,
    );
    const note = (await carnetA()).notes.find((n: Json) => n.tacheId === tacheA && n.eleveId === eleveA);
    const faits = (await A.appel("GET", `/api/ma-classe/comportement?classeId=${classeA}`)).json.faits;
    verifier(
      "… ni, par cascade, effacer ses notes et ses faits de comportement",
      note?.points === 15 && ids(faits).includes(faitA),
      `note ${note ? "présente" : "effacée"}, fait ${ids(faits).includes(faitA) ? "présent" : "effacé"}`,
    );
  }
  {
    const r = await B.appel("GET", "/api/classes");
    verifier(
      "Les envois refusés n'ont rien changé aux classes de B",
      r.status === 200 && r.json.classes.length === 1 && r.json.classes[0].eleves.length === 1,
      `statut ${r.status}`,
    );
  }

  // Contrôles inverses : le filtre ne doit pas bloquer le propriétaire.
  section("Classes & élèves : A garde la main");
  {
    const eleveNouveau = crypto.randomUUID();
    const r = await A.appel("PUT", "/api/classes", {
      classes: [
        {
          id: classeA,
          nom: "Classe A renommée",
          eleves: [
            { id: eleveA, nom: "Élève A renommé" },
            { id: eleveNouveau, nom: "Nouvel élève" },
          ],
        },
      ],
    });
    const classe = (await classesDeA()).find((c) => c.id === classeA);
    verifier(
      "A renomme sa classe, renomme un élève et en ajoute un",
      r.status === 200 &&
        classe?.nom === "Classe A renommée" &&
        classe?.eleves.find((e: Json) => e.id === eleveA)?.nom === "Élève A renommé" &&
        ids(classe?.eleves).includes(eleveNouveau),
      `statut ${r.status}`,
    );
    const s = await A.appel("PUT", "/api/classes", {
      classes: [{ id: classeA, nom: "Classe A renommée", eleves: [{ id: eleveA, nom: "Élève A renommé" }] }],
    });
    const apres = (await classesDeA()).find((c) => c.id === classeA);
    const note = (await carnetA()).notes.find((n: Json) => n.tacheId === tacheA && n.eleveId === eleveA);
    verifier(
      "A retire un élève sans toucher aux autres ni à leurs notes",
      s.status === 200 && ids(apres?.eleves).join() === eleveA && note?.points === 15,
      `statut ${s.status}`,
    );
  }
}

async function main() {
  try {
    await fetch(BASE);
  } catch {
    arreter(`serveur injoignable sur ${BASE} : lance d'abord \`npm run dev\`.`);
  }

  console.log(`Cloisonnement multi-prof — ${BASE}`);
  const suffixe = crypto.randomUUID().slice(0, 8);
  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
  const comptes: string[] = [];
  const nettoyages: (() => Promise<unknown>)[] = [];
  try {
    const A = await inscrire("a", suffixe);
    comptes.push(A.identifiant);
    const B = await inscrire("b", suffixe);
    comptes.push(B.identifiant);
    console.log(`Comptes jetables : ${A.identifiant} (A) et ${B.identifiant} (B)`);
    await scenario(A, B, suffixe, nettoyages);
  } catch (erreur) {
    console.error(`\n❌ Arrêt : ${(erreur as Error).message}`);
    process.exitCode = 2;
  } finally {
    // Fichiers d'abord (hors base), puis les comptes : la cascade emporte le reste.
    for (const nettoyer of nettoyages) await nettoyer().catch(() => {});
    if (comptes.length > 0) await sql`DELETE FROM prof_users WHERE identifiant = ANY(${comptes})`;
    await sql.end();
  }

  if (process.exitCode === 2) return;
  const echecs = resultats.filter((r) => !r.ok);
  console.log(`\nBilan : ${resultats.length} vérifications — ${resultats.length - echecs.length} ✅, ${echecs.length} ❌`);
  if (echecs.length > 0) {
    for (const e of echecs) console.log(`  ❌ ${e.libelle}`);
    process.exitCode = 1;
  }
}

await main();
