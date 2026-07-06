// Génération du carnet de notes au format Excel du classeur école (ITSW).
// Une feuille pour la matière ; une section par trimestre exporté. Pour chaque
// tâche : Date / Task Name / Total Marks / Weighting en tête, puis 1 ligne par
// élève avec, par tâche, 4 colonnes Mark / % / Grade / Comment. Absent → "NA".
// Module serveur uniquement (dépend d'exceljs).
import ExcelJS from "exceljs";
import { arrondi1, gradeITSW, pourcentage, type NoteEleve, type Tache } from "@/lib/carnet";
import { carnetDe, elevesDeClasse, matiereComplete } from "./carnet";
import { ANNEE_COURANTE } from "./reglages";

type Eleve = { id: string; nom: string };

function ecrireSection(
  ws: ExcelJS.Worksheet,
  r0: number,
  trimestre: number,
  taches: Tache[],
  notes: NoteEleve[],
  eleves: Eleve[],
): number {
  const noteMap = new Map<string, NoteEleve>();
  notes.forEach((n) => noteMap.set(`${n.tacheId}:${n.eleveId}`, n));
  const col0 = (i: number) => 2 + i * 4; // 1re colonne (Mark) de la tâche i

  ws.getCell(r0, 1).value = `Trimester ${trimestre}`;
  ws.getCell(r0, 1).font = { bold: true };

  const [rDate, rTask, rTotal, rWeight] = [r0 + 1, r0 + 2, r0 + 3, r0 + 4];
  ws.getCell(rDate, 1).value = "Date";
  ws.getCell(rTask, 1).value = "Task Name";
  ws.getCell(rTotal, 1).value = "Total Marks";
  ws.getCell(rWeight, 1).value = "Weighting";
  for (const rr of [rDate, rTask, rTotal, rWeight]) {
    ws.getCell(rr, 1).font = { italic: true, color: { argb: "FF666666" } };
  }
  taches.forEach((t, i) => {
    const c = col0(i);
    ws.mergeCells(rDate, c, rDate, c + 3);
    ws.getCell(rDate, c).value = t.dateISO;
    ws.mergeCells(rTask, c, rTask, c + 3);
    ws.getCell(rTask, c).value = t.nom;
    ws.getCell(rTask, c).font = { bold: true };
    ws.mergeCells(rTotal, c, rTotal, c + 3);
    ws.getCell(rTotal, c).value = t.bareme;
    ws.mergeCells(rWeight, c, rWeight, c + 3);
    ws.getCell(rWeight, c).value = t.ponderation;
    for (const rr of [rDate, rTask, rTotal, rWeight]) {
      ws.getCell(rr, c).alignment = { horizontal: "center" };
    }
  });

  const rHead = r0 + 5;
  ws.getCell(rHead, 1).value = "Student Name";
  ws.getCell(rHead, 1).font = { bold: true };
  taches.forEach((_t, i) => {
    const c = col0(i);
    ["Mark", "%", "Grade", "Comment"].forEach((lbl, k) => {
      const cell = ws.getCell(rHead, c + k);
      cell.value = lbl;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
    });
  });

  let r = rHead + 1;
  for (const e of eleves) {
    ws.getCell(r, 1).value = e.nom;
    taches.forEach((t, i) => {
      const c = col0(i);
      const n = noteMap.get(`${t.id}:${e.id}`);
      const points = n?.points ?? null;
      const commentaire = (n?.commentaire ?? "").trim();
      const absent = points === null && commentaire.toLowerCase() === "absent";
      const pct = pourcentage(points, t.bareme);
      const grade = gradeITSW(pct);
      // Mark (nombre ou vide), % / Grade (nombres, ou "NA" si absent), Comment.
      ws.getCell(r, c).value = points === null ? null : points;
      ws.getCell(r, c + 1).value = absent ? "NA" : pct === null ? null : arrondi1(pct);
      ws.getCell(r, c + 2).value = absent ? "NA" : grade;
      ws.getCell(r, c + 3).value = commentaire || null;
      for (const cc of [c, c + 1, c + 2]) {
        ws.getCell(r, cc).alignment = { horizontal: "center" };
      }
    });
    r += 1;
  }
  return r;
}

export async function genererCarnetXlsx(
  userId: string,
  matiereId: string,
  trimestres: number[],
): Promise<{ buffer: Buffer; nomFichier: string } | null> {
  const matiere = await matiereComplete(userId, matiereId);
  if (!matiere) return null;
  const eleves = await elevesDeClasse(userId, matiere.classeId);

  const sections: { trimestre: number; taches: Tache[]; notes: NoteEleve[] }[] = [];
  for (const tri of trimestres) {
    const { taches, notes } = await carnetDe(userId, matiereId, tri);
    sections.push({ trimestre: tri, taches, notes });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Rituelio";
  const ws = wb.addWorksheet(matiere.nom.slice(0, 31) || "Matière");

  ws.getCell("A1").value = matiere.nom;
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A2").value = `${matiere.classeNom} — ${ANNEE_COURANTE}`;

  // Largeurs de colonnes (sur le nombre max de tâches parmi les sections).
  const maxT = Math.max(0, ...sections.map((s) => s.taches.length));
  ws.getColumn(1).width = 24;
  for (let i = 0; i < maxT; i++) {
    const c = 2 + i * 4;
    ws.getColumn(c).width = 8;
    ws.getColumn(c + 1).width = 7;
    ws.getColumn(c + 2).width = 7;
    ws.getColumn(c + 3).width = 18;
  }

  let row = 4;
  for (const s of sections) {
    row = ecrireSection(ws, row, s.trimestre, s.taches, s.notes, eleves) + 2;
  }

  const data = await wb.xlsx.writeBuffer();
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
  return {
    buffer,
    nomFichier: `Notes_${matiere.classeNom}_${matiere.nom}_${ANNEE_COURANTE}`,
  };
}
