/**
 * Géométrie du Notch.
 *
 *   0 ─────────────────────────────── total   <- bord haut de l'écran
 *    ╲ear                         ear╱        <- coins concaves (rayon `ear`)
 *     │                             │
 *     │            body             │
 *      ╲___________________________╱          <- coins convexes (rayon `radius`)
 *
 * `width` est la largeur du corps ; la largeur totale vaut width + 2 * ear.
 */

export interface NotchSize {
  width: number;
  height: number;
  radius: number;
  ear: number;
}

export const REST: NotchSize = { width: 132, height: 30, radius: 13, ear: 8 };
export const PEEK: NotchSize = { width: 400, height: 112, radius: 30, ear: 18 };
export const OPEN: NotchSize = { width: 740, height: 316, radius: 46, ear: 34 };

/** Marge invisible autour du Notch pour le hit-test (évite le scintillement en bordure). */
export const HIT_PADDING = {
  rest: { x: 8, bottom: 8 },
  open: { x: 4, bottom: 4 },
};

function clampRadius(width: number, height: number, radius: number, ear: number) {
  return Math.max(0, Math.min(radius, width / 2, height - ear));
}

/** Silhouette pleine (fermée), utilisée pour le remplissage. */
export function fillPath(width: number, height: number, radius: number, ear: number): string {
  const r = clampRadius(width, height, radius, ear);
  const e = ear;
  const right = width + e;
  return [
    `M 0 0`,
    `L ${right + e} 0`,
    `A ${e} ${e} 0 0 0 ${right} ${e}`,
    `L ${right} ${height - r}`,
    `A ${r} ${r} 0 0 1 ${right - r} ${height}`,
    `L ${e + r} ${height}`,
    `A ${r} ${r} 0 0 1 ${e} ${height - r}`,
    `L ${e} ${e}`,
    `A ${e} ${e} 0 0 0 0 0`,
    `Z`,
  ].join(" ");
}

/** Contour ouvert (sans le segment collé au bord de l'écran), utilisé pour la bordure. */
export function strokePath(width: number, height: number, radius: number, ear: number): string {
  const r = clampRadius(width, height, radius, ear);
  const e = ear;
  const right = width + e;
  return [
    `M 0 0`,
    `A ${e} ${e} 0 0 1 ${e} ${e}`,
    `L ${e} ${height - r}`,
    `A ${r} ${r} 0 0 0 ${e + r} ${height}`,
    `L ${right - r} ${height}`,
    `A ${r} ${r} 0 0 0 ${right} ${height - r}`,
    `L ${right} ${e}`,
    `A ${e} ${e} 0 0 1 ${right + e} 0`,
  ].join(" ");
}
