// Gobble Dash — sound: every effect is synthesized with WebAudio, so the
// game ships no audio files and plays the same offline. Sounds start only
// after the player's first interaction (browsers block audio before that).

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    /** Call from any user gesture so later sounds are allowed to play. */
    unlock() {
      ensure();
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    /** The turkey's happy gobble on the title screen. */
    gobble() {
      if (!ensure()) return;
      tone(320, 0.09, 'square', 0.12, 0, 520);
      tone(280, 0.09, 'square', 0.12, 0.1, 460);
      tone(380, 0.12, 'square', 0.12, 0.2, 240);
      tone(300, 0.16, 'square', 0.1, 0.32, 520);
    },
    /** Whoosh as the turkey leaves the ground. */
    jump() {
      if (!ensure()) return;
      tone(240, 0.16, 'sine', 0.1, 0, 620);
    },
    /** Bright two-note chime for a pickup (higher for rarer food). */
    pickup(kind) {
      if (!ensure()) return;
      const base = kind === 'feather' ? 980 : kind === 'pie' ? 760 : 620;
      tone(base, 0.09, 'triangle', 0.14);
      tone(base * 1.5, 0.14, 'triangle', 0.14, 0.08);
    },
    /** Dull thud + descending buzz when the farmer lands a hit. */
    hit() {
      if (!ensure()) return;
      tone(160, 0.2, 'sawtooth', 0.16, 0, 70);
      tone(90, 0.24, 'square', 0.12, 0.05, 50);
    },
    /** Little victory arpeggio when the turkey escapes. */
    escape() {
      if (!ensure()) return;
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.11));
    },
    /** Sad slide-whistle down when the turkey is caught. */
    caught() {
      if (!ensure()) return;
      tone(420, 0.5, 'sine', 0.12, 0, 140);
      tone(210, 0.4, 'triangle', 0.1, 0.35, 110);
    },
  };
}
