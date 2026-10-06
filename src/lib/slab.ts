// Deterministic "butcher block" edge: square slabs of unequal width and depth hanging from a
// charcoal section into a paper one. Generated at build time so every page load matches.

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export type Slab = { x: number; w: number; h: number; fill: string; rules: boolean };

const WIDTHS = [64, 96, 112, 160, 208];

/** Slabs across a 1440-wide viewBox. `height` is the deepest a slab may reach. */
export function slabRow(seed: number, height: number): Slab[] {
  const r = rng(seed);
  const out: Slab[] = [];
  let x = 0;
  let accents = 0;
  while (x < 1440) {
    const w = WIDTHS[Math.floor(r() * WIDTHS.length)];
    const deep = r();
    const h = Math.round((0.28 + deep * 0.72) * height);
    let fill = 'var(--char-950)';
    const roll = r();
    // one ember and one tamarind slab per row at most, like the cover composition
    if (roll > 0.86 && accents === 0 && x > 200) {
      fill = 'var(--ember-600)';
      accents++;
    } else if (roll < 0.12 && accents < 2 && x > 500) {
      fill = 'var(--tamarind-700)';
      accents = 2;
    }
    out.push({ x, w: Math.min(w, 1440 - x), h, fill, rules: fill === 'var(--char-950)' && deep > 0.72 && w >= 112 });
    x += w;
  }
  return out;
}
