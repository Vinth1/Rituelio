"use client";

// Roue de la fortune réutilisable (SVG) : un secteur coloré par élève,
// prénoms radiaux, aiguille fixe en haut. Purement visuelle : le parent
// pilote la rotation (calculée avec `rotationVers`) et l'animation se fait
// par transition CSS quand la prop `rotation` change.
// Utilisée par « Roue du hasard » et « Questions de cours ».
import type { Eleve } from "@/lib/classes";

// Palette FIXE de couleurs vives pour les secteurs : remplissage SVG en style
// inline (on ne peut pas construire de classe Tailwind dynamiquement, cf. lib/couleurs.ts).
const COULEURS_SECTEURS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export const DUREE_ROUE_MS = 4200; // durée de l'animation
const TOURS_MIN = 5; // tours complets minimum à chaque lancer

// Rotation cible pour amener le centre du secteur `index` (parmi `total`)
// sous l'aiguille (en haut), en ajoutant des tours complets depuis
// `rotationActuelle` pour que la roue tourne toujours dans le même sens.
export function rotationVers(
  rotationActuelle: number,
  index: number,
  total: number,
): number {
  const seg = 360 / total;
  const angleCentre = (index + 0.5) * seg;
  const cible = (((-angleCentre) % 360) + 360) % 360;
  const courante = ((rotationActuelle % 360) + 360) % 360;
  const delta = (cible - courante + 360) % 360;
  return rotationActuelle + TOURS_MIN * 360 + delta;
}

function tronquer(nom: string, max: number) {
  return nom.length > max ? `${nom.slice(0, max - 1)}…` : nom;
}

type Props = {
  eleves: Eleve[]; // instantané affiché — à figer entre deux lancers côté parent
  rotation: number;
  taille?: number; // diamètre du SVG en px
};

export default function Roue({ eleves, rotation, taille = 320 }: Props) {
  const rayon = taille / 2;
  const n = eleves.length;
  const seg = n > 0 ? 360 / n : 0;

  // Point du cercle pour un angle mesuré depuis le sommet (12 h), sens horaire.
  function point(angleDeg: number, r: number) {
    const a = (angleDeg * Math.PI) / 180;
    return { x: rayon + r * Math.sin(a), y: rayon - r * Math.cos(a) };
  }

  return (
    <div className="relative" style={{ width: taille, height: taille }}>
      {/* Aiguille fixe en haut */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-md"
        style={{
          width: 0,
          height: 0,
          borderLeft: "13px solid transparent",
          borderRight: "13px solid transparent",
          borderTop: "22px solid var(--color-encre)",
        }}
      />
      <svg
        width={taille}
        height={taille}
        viewBox={`0 0 ${taille} ${taille}`}
        role="img"
        aria-label={`Roue de ${n} élève${n > 1 ? "s" : ""}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: `transform ${DUREE_ROUE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {n === 1 ? (
          <circle cx={rayon} cy={rayon} r={rayon - 2} fill={COULEURS_SECTEURS[0]} />
        ) : (
          eleves.map((el, i) => {
            const p1 = point(i * seg, rayon - 2);
            const p2 = point((i + 1) * seg, rayon - 2);
            const large = seg > 180 ? 1 : 0;
            const d = `M ${rayon} ${rayon} L ${p1.x} ${p1.y} A ${rayon - 2} ${rayon - 2} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
            return (
              <path
                key={el.id}
                d={d}
                fill={COULEURS_SECTEURS[i % COULEURS_SECTEURS.length]}
                stroke="white"
                strokeWidth={1}
              />
            );
          })
        )}

        {/* Prénoms (radiaux, redressés sur la moitié basse) */}
        {eleves.map((el, i) => {
          const aM = n === 1 ? 0 : (i + 0.5) * seg;
          const pM = point(aM, rayon * 0.62);
          const flip = aM > 90 && aM < 270;
          const fontSize = n <= 8 ? 16 : n <= 16 ? 13 : n <= 24 ? 11 : 9;
          const maxCar = n <= 8 ? 14 : n <= 16 ? 11 : 8;
          return (
            <text
              key={el.id}
              x={pM.x}
              y={pM.y}
              fill="white"
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth={0.6}
              paintOrder="stroke"
              fontSize={fontSize}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${aM + (flip ? 180 : 0)} ${pM.x} ${pM.y})`}
            >
              {tronquer(el.nom, maxCar)}
            </text>
          );
        })}

        {/* Moyeu central */}
        <circle
          cx={rayon}
          cy={rayon}
          r={26}
          fill="var(--color-surface)"
          stroke="var(--color-ligne)"
          strokeWidth={2}
        />
        <text
          x={rayon}
          y={rayon}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={22}
        >
          🎡
        </text>
      </svg>
    </div>
  );
}
