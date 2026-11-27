// The screenshot scenes behind ?shot=start|play|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (jump the fence, duck the knife, chase the
// corn), so the frame is what a short game really looks like and the same
// seed always gives the same frame. The end scene's pilot reacts late on
// purpose, so it gets caught — like a hurried player on Thanksgiving eve.

import { STEP } from './config.js';
import { EVENT_OVER, KIND_KNIFE } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 30;
const END_LIMIT_SECONDS = 600;
/** How far ahead (seconds) the pilot looks when it decides to jump or duck. */
const HORIZON_PLAY = 0.75;
const HORIZON_END = 0.16;
const SAMPLE = 1 / 30;
/** Extra clearance the pilot keeps between the turkey and an obstacle. */
const MARGIN = 12;

/** The soonest an obstacle ahead will reach the turkey's box, in seconds. */
function timeToReach(state, obstacle) {
  const gap = obstacle.x - (state.player.x + state.player.width);
  const closing = state.speed + (obstacle.kind === KIND_KNIFE ? 190 : 0);
  return gap <= 0 ? 0 : gap / closing;
}

function autopilot(state, horizon, sloppy) {
  const p = state.player;
  let nearest = null;
  let nearestTime = Infinity;
  for (const ob of state.obstacles) {
    if (!ob.active) continue;
    const t = timeToReach(state, ob);
    if (t < nearestTime) {
      nearestTime = t;
      nearest = ob;
    }
  }
  if (nearest === null || nearestTime > horizon) return { jump: false, duck: false };
  if (nearest.kind === KIND_KNIFE) {
    // A knife flies at head height: duck under it, never jump into it.
    // The sloppy pilot never ducks — it eats the knife.
    return { jump: false, duck: !sloppy && nearestTime < 0.55 };
  }
  // Jump with room to spare: airtime is ~0.91 s and the turkey must stay
  // above the obstacle's top for the whole overlap, so it jumps early
  // enough to be high when the obstacle arrives and late enough to still
  // be high when its tail passes. The sloppy pilot jumps far too late,
  // so it lands on the obstacle instead.
  const jumpWindow = sloppy ? 0.05 : 0.3 + nearest.width / (4 * state.speed);
  if (p.onGround && nearestTime < jumpWindow) return { jump: true, duck: false };
  return { jump: false, duck: false };
}

/**
 * Set `world` to the named scene (start, play or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 * The end scene's pilot is a hurried player: it reacts late, never ducks,
 * and flat-out misses every third obstacle — so it gets caught, as a
 * hurried player is.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { jump: false, duck: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = name === 'end' ? HORIZON_END : HORIZON_PLAY;
  const sloppy = name === 'end';
  let lastSeen = null;
  let seenCount = 0;
  /** The obstacle the hurried player is currently ignoring outright. */
  let skipped = null;
  function pilot(state) {
    const move = autopilot(state, horizon, sloppy);
    if (!sloppy) return move;
    // Every third distinct obstacle, the hurried player just does not react
    // to it at all — no jump, no duck — until it has passed.
    let nearest = null;
    let nearestTime = Infinity;
    for (const ob of state.obstacles) {
      if (!ob.active) continue;
      const t = timeToReach(state, ob);
      if (t < nearestTime) {
        nearestTime = t;
        nearest = ob;
      }
    }
    if (skipped !== null && (!skipped.active || skipped.x + skipped.width < state.player.x)) skipped = null;
    if (skipped !== null) return { jump: false, duck: false };
    if (nearest !== null && nearest !== lastSeen) {
      lastSeen = nearest;
      seenCount += 1;
      if (seenCount % 3 === 0) {
        skipped = nearest;
        return { jump: false, duck: false };
      }
    }
    return move;
  }
  for (let index = 0; index < limit / STEP; index += 1) {
    if (world.step(STEP, pilot(world.state), false) & EVENT_OVER) break;
    if (world.state.escaped) break;
  }
  const over = world.state.lives === 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
