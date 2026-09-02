"use client";

// Une roue de loterie en SVG : un secteur par item, qui tourne et s'arrête sur
// le gagnant. Pensée vidéoprojecteur, partagée par l'outil « Roue des prénoms »
// et le jeu « Roue des verbes » (qui en aligne trois).
//
// Le composant est PRÉSENTATIONNEL : c'est le parent qui détient l'angle, tire
// le gagnant AVANT l'animation et calcule, avec `angleVers`, la rotation qui
// amène le bon secteur sous le repère. La roue ne « triche » donc jamais à
// l'arrivée.
//
// Accessibilité : la rotation est une transition CSS, que le bloc
// prefers-reduced-motion de globals.css réduit déjà à un tirage instantané ;
// c'est au parent d'annoncer le résultat dans une zone aria-live.
import { teinteRoue } from "@/lib/couleurs";

export type ItemRoue = { id: string; libelle: string };

export const TOURS = 4; // tours complets avant l'arrêt
export const DUREE_MS = 4000; // durée de la rotation (suit la transition CSS)

const CENTRE = 100;
const RAYON = 95;

// Point du cercle à l'angle `deg`, compté depuis le haut, dans le sens horaire.
function point(deg: number, rayon: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: CENTRE + rayon * Math.cos(rad),
    y: CENTRE + rayon * Math.sin(rad),
  };
}

// Chemin SVG de la part de camembert n° `i` d'une roue de `n` parts.
function secteur(i: number, n: number): string {
  const a0 = (i * 360) / n;
  const a1 = ((i + 1) * 360) / n;
  const p0 = point(a0, RAYON);
  const p1 = point(a1, RAYON);
  const grandArc = a1 - a0 > 180 ? 1 : 0;
  return `M ${CENTRE} ${CENTRE} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${RAYON} ${RAYON} 0 ${grandArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

// Le texte rétrécit quand les parts se resserrent.
function tailleTexte(n: number): number {
  if (n <= 10) return 8;
  if (n <= 18) return 6;
  if (n <= 28) return 4.6;
  return 3.8;
}

// Place le libellé au milieu du secteur `i`, toujours à l'endroit : sur la
// moitié gauche de la roue, on le retourne bout pour bout, sans quoi il se
// lirait la tête en bas.
function libelleSecteur(i: number, n: number): { transform: string; x: number } {
  const milieu = (i * 360) / n + 180 / n;
  const rayon = RAYON * 0.58;
  return milieu <= 180
    ? {
        transform: `rotate(${milieu - 90} ${CENTRE} ${CENTRE})`,
        x: CENTRE + rayon,
      }
    : {
        transform: `rotate(${milieu - 270} ${CENTRE} ${CENTRE})`,
        x: CENTRE - rayon,
      };
}

// Les libellés trop longs sont coupés : un secteur ne peut pas tout afficher.
function abreger(libelle: string, maxCar: number): string {
  return libelle.length > maxCar
    ? `${libelle.slice(0, maxCar - 1)}…`
    : libelle;
}

// Angle cumulatif à donner à la roue pour amener le secteur `index` sous le
// repère (0°, en haut) après `TOURS` tours complets. La roue avance toujours :
// on part de `angleActuel` et on n'y retranche jamais rien.
export function angleVers(
  index: number,
  n: number,
  angleActuel: number,
): number {
  const milieu = (index * 360) / n + 180 / n;
  const ecart = (((-milieu - angleActuel) % 360) + 360) % 360;
  return angleActuel + TOURS * 360 + ecart;
}

export default function Roue({
  items,
  angle,
  onFin,
  label,
  maxCar = 14,
}: {
  items: ItemRoue[];
  angle: number;
  onFin: () => void;
  label: string;
  maxCar?: number;
}) {
  const n = items.length;
  if (n === 0) return null;

  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label} className="w-full">
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: "100px 100px",
          transition: `transform ${DUREE_MS}ms cubic-bezier(0.15, 0.85, 0.25, 1)`,
        }}
        onTransitionEnd={onFin}
      >
        {n === 1 ? (
          <circle cx={CENTRE} cy={CENTRE} r={RAYON} fill={teinteRoue(0, 1)} />
        ) : (
          items.map((item, i) => (
            <path
              key={item.id}
              d={secteur(i, n)}
              fill={teinteRoue(i, n)}
              stroke="#ffffff"
              strokeWidth="0.6"
            />
          ))
        )}
        {items.map((item, i) => {
          const place = libelleSecteur(i, n);
          return (
            <text
              key={`t-${item.id}`}
              transform={place.transform}
              x={place.x}
              y={CENTRE}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={tailleTexte(n)}
              fontWeight="700"
              fill="#ffffff"
              stroke="#00000066"
              strokeWidth="0.9"
              style={{ paintOrder: "stroke" }}
            >
              {abreger(item.libelle, maxCar)}
            </text>
          );
        })}
      </g>
      {/* Moyeu fixe */}
      <circle cx={CENTRE} cy={CENTRE} r="14" fill="#ffffff" stroke="#00000022" />
      {/* Repère : c’est le libellé sous cette pointe qui gagne. Cerné de blanc
          pour rester lisible sur toutes les teintes. */}
      <path
        d="M 100 20 L 92 4 L 108 4 Z"
        fill="#26314f"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
