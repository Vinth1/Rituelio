// Diagnostic du cloisonnement multi-prof, en LECTURE SEULE : `npm run db:diagnostic`.
// À lancer sur la prod avant chaque migration du chantier multi-prof (voir
// docs/brief-multi-prof.md). N'affiche que des nombres et les identifiants des
// comptes prof : aucun nom d'élève, aucune note.
//
// Base visée : DATABASE_URL de l'environnement si elle est définie (elle prime sur
// .env.local), sinon celle de .env.local. Pour la prod, sous PowerShell :
//   $env:DATABASE_URL = "<URL Neon de prod>"; npm run db:diagnostic
//
// Toutes les requêtes tournent dans une transaction READ ONLY : Postgres refuse
// la moindre écriture, même par erreur.
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Pas de .env.local : DATABASE_URL doit venir de l'environnement.
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante — voir .env.example.");
  process.exit(1);
}

let hote = "(URL illisible)";
try {
  hote = new URL(url).host;
} catch {
  // On garde le libellé par défaut : la connexion dira ce qui ne va pas.
}

// Données rattachées à un compte, comptées par compte. Les tables sans colonne
// user_id (élèves, notes) sont comptées via leur parent.
const VOLUMES = `
  SELECT u.identifiant,
    (SELECT count(*) FROM classes WHERE user_id = u.id)::int AS "classes",
    (SELECT count(*) FROM eleves e JOIN classes c ON c.id = e.classe_id
      WHERE c.user_id = u.id)::int AS "élèves",
    (SELECT count(*) FROM matieres WHERE user_id = u.id)::int AS "matières",
    (SELECT count(*) FROM taches WHERE user_id = u.id)::int AS "tâches du carnet",
    (SELECT count(*) FROM notes_eleves n JOIN taches t ON t.id = n.tache_id
      WHERE t.user_id = u.id)::int AS "notes",
    (SELECT count(*) FROM faits_comportement WHERE user_id = u.id)::int AS "faits de comportement",
    (SELECT count(*) FROM consequences WHERE user_id = u.id)::int AS "conséquences",
    (SELECT count(*) FROM creneaux WHERE user_id = u.id)::int AS "créneaux",
    (SELECT count(*) FROM prepas_cours WHERE user_id = u.id)::int AS "prépas",
    (SELECT count(*) FROM trimestres WHERE user_id = u.id)::int AS "trimestres",
    (SELECT count(*) FROM sessions WHERE user_id = u.id)::int AS "évals conjugaison",
    (SELECT count(*) FROM submissions x JOIN sessions s ON s.id = x.session_id
      WHERE s.user_id = u.id)::int AS "copies conjugaison",
    (SELECT count(*) FROM epreuves WHERE user_id = u.id)::int AS "épreuves",
    (SELECT count(*) FROM passations WHERE user_id = u.id)::int AS "passations",
    (SELECT count(*) FROM dictees WHERE user_id = u.id)::int AS "dictées",
    (SELECT count(*) FROM images_prof WHERE user_id = u.id)::int AS "images",
    (SELECT count(*) FROM verbes_perso WHERE user_id = u.id)::int AS "verbes perso"
  FROM prof_users u
  ORDER BY u.created_at
`;

// Liens entre deux comptes DIFFÉRENTS : chaque requête doit renvoyer 0. Un « <> »
// ignore les propriétaires NULL, comptés à part (évals sans propriétaire).
const INCOHERENCES: [string, string][] = [
  [
    "créneau → classe d'un autre compte",
    `SELECT count(*)::int AS n FROM creneaux x JOIN classes c ON c.id = x.classe_id
     WHERE x.user_id <> c.user_id`,
  ],
  [
    "matière → classe d'un autre compte",
    `SELECT count(*)::int AS n FROM matieres x JOIN classes c ON c.id = x.classe_id
     WHERE x.user_id <> c.user_id`,
  ],
  [
    "tâche → matière d'un autre compte",
    `SELECT count(*)::int AS n FROM taches x JOIN matieres m ON m.id = x.matiere_id
     WHERE x.user_id <> m.user_id`,
  ],
  [
    "note → élève d'un autre compte",
    `SELECT count(*)::int AS n FROM notes_eleves n
     JOIN taches t ON t.id = n.tache_id
     JOIN eleves e ON e.id = n.eleve_id JOIN classes c ON c.id = e.classe_id
     WHERE t.user_id <> c.user_id`,
  ],
  [
    "fait de comportement → classe d'un autre compte",
    `SELECT count(*)::int AS n FROM faits_comportement f JOIN classes c ON c.id = f.classe_id
     WHERE f.user_id <> c.user_id`,
  ],
  [
    "fait de comportement → élève d'un autre compte",
    `SELECT count(*)::int AS n FROM faits_comportement f
     JOIN eleves e ON e.id = f.eleve_id JOIN classes c ON c.id = e.classe_id
     WHERE f.user_id <> c.user_id`,
  ],
  [
    "conséquence → fait d'un autre compte",
    `SELECT count(*)::int AS n FROM consequences x JOIN faits_comportement f ON f.id = x.fait_id
     WHERE x.user_id <> f.user_id`,
  ],
  [
    "conséquence → élève d'un autre compte",
    `SELECT count(*)::int AS n FROM consequences x
     JOIN eleves e ON e.id = x.eleve_id JOIN classes c ON c.id = e.classe_id
     WHERE x.user_id <> c.user_id`,
  ],
  [
    "prépa → créneau d'un autre compte",
    `SELECT count(*)::int AS n FROM prepas_cours p JOIN creneaux c ON c.id = p.creneau_id
     WHERE p.user_id <> c.user_id`,
  ],
  [
    "éval conjugaison → classe d'un autre compte",
    `SELECT count(*)::int AS n FROM sessions s JOIN classes c ON c.id = s.class_id
     WHERE s.user_id <> c.user_id`,
  ],
  [
    "copie conjugaison → élève d'un autre compte",
    `SELECT count(*)::int AS n FROM submissions x
     JOIN sessions s ON s.id = x.session_id
     JOIN eleves e ON e.id = x.eleve_id JOIN classes c ON c.id = e.classe_id
     WHERE s.user_id <> c.user_id`,
  ],
  [
    "tâche importée → éval d'un autre compte",
    `SELECT count(*)::int AS n FROM taches t JOIN sessions s ON s.code = t.session_code
     WHERE t.user_id <> s.user_id`,
  ],
  [
    "passation → classe d'un autre compte",
    `SELECT count(*)::int AS n FROM passations p JOIN classes c ON c.id = p.class_id
     WHERE p.user_id <> c.user_id`,
  ],
  [
    "passation → épreuve d'un autre compte",
    `SELECT count(*)::int AS n FROM passations p JOIN epreuves e ON e.id = p.epreuve_id
     WHERE p.user_id <> e.user_id`,
  ],
  [
    "copie d'épreuve → élève d'un autre compte",
    `SELECT count(*)::int AS n FROM copies x
     JOIN passations p ON p.id = x.passation_id
     JOIN eleves e ON e.id = x.eleve_id JOIN classes c ON c.id = e.classe_id
     WHERE p.user_id <> c.user_id`,
  ],
];

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const bilan = await sql.begin("read only", async (tx) => {
    const volumes = (await tx.unsafe(VOLUMES)) as unknown as Record<string, string | number>[];
    const [orphelines] = (await tx.unsafe(
      "SELECT count(*)::int AS n FROM sessions WHERE user_id IS NULL",
    )) as unknown as { n: number }[];
    const incoherences: { lien: string; n: number }[] = [];
    for (const [lien, requete] of INCOHERENCES) {
      const [ligne] = (await tx.unsafe(requete)) as unknown as { n: number }[];
      incoherences.push({ lien, n: ligne.n });
    }
    return { volumes, orphelines: orphelines.n, incoherences };
  });

  console.log(`Diagnostic du cloisonnement — base ${hote} (lecture seule)\n`);

  // 1. Comptes et volumes : une colonne par compte, plus lisible qu'une ligne.
  console.log(`1. Comptes prof : ${bilan.volumes.length}`);
  if (bilan.volumes.length > 0) {
    const tableau: Record<string, Record<string, string | number>> = {};
    for (const compte of bilan.volumes) {
      for (const [cle, valeur] of Object.entries(compte)) {
        if (cle === "identifiant") continue;
        tableau[cle] ??= {};
        tableau[cle][String(compte.identifiant)] = valeur;
      }
    }
    console.table(tableau);
  }

  // 2. Évaluations de conjugaison sans propriétaire (seule colonne user_id nullable).
  console.log(`\n2. Évaluations de conjugaison sans propriétaire : ${bilan.orphelines}`);

  // 3. Liens entre comptes différents.
  const total = bilan.incoherences.reduce((s, i) => s + i.n, 0);
  console.log(`\n3. Liens vers les données d'un autre compte : ${total}`);
  for (const i of bilan.incoherences) {
    if (i.n > 0) console.log(`   ❌ ${i.lien} : ${i.n}`);
  }

  // Verdict.
  console.log("\nVerdict");
  let bloquant = false;
  if (total > 0) {
    bloquant = true;
    console.log(
      "   ❌ Des données pointent vers un autre compte : ne pas ouvrir les\n" +
        "      inscriptions, analyser ces lignes d'abord.",
    );
  }
  if (bilan.orphelines > 0) {
    if (bilan.volumes.length <= 1) {
      console.log(
        "   ⚠️ Des évaluations n'ont pas de propriétaire : la migration de la PR 2\n" +
          "      les rattache au compte unique. À faire AVANT qu'un 2e compte existe.",
      );
    } else {
      bloquant = true;
      console.log(
        "   ❌ Des évaluations n'ont pas de propriétaire et plusieurs comptes\n" +
          "      existent : rattachement automatique impossible, à trancher à la main.",
      );
    }
  }
  if (bilan.volumes.length > 1) {
    console.log(
      "   ⚠️ Plusieurs comptes existent déjà : vérifier qu'ils sont tous attendus.",
    );
  }
  if (!bloquant && bilan.orphelines === 0 && bilan.volumes.length <= 1) {
    console.log("   ✅ Rien à signaler.");
  } else if (!bloquant) {
    console.log("   ✅ Aucun lien entre comptes.");
  }
  if (bloquant) process.exitCode = 1;
} catch (erreur) {
  console.error("❌ Diagnostic impossible :", erreur);
  process.exitCode = 1;
} finally {
  await sql.end();
}
