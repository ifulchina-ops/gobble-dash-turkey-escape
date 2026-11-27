// A tiny seeded random generator (mulberry32) so a ?seed=N run of the game
// plays out the same way every time: the screenshot scenes and any replay
// of a run stay deterministic instead of depending on Math.random.

export function createRandom(seed) {
  let a = seed >>> 0;
  return {
    /** Next float in [0, 1). */
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Next integer in [min, max] inclusive. */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Pick one entry of an array. */
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    },
    /** True with probability p. */
    chance(p) {
      return this.next() < p;
    },
  };
}
