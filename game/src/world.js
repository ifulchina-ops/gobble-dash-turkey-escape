// Gobble Dash — the world: the turkey, the farmer, the obstacles and the
// pickups, stepped in fixed 1/60 s slices. The world knows nothing about
// the screen or the keyboard; it takes a jump/duck input each step and
// reports what happened as event bits the game loop turns into sound,
// announcements and screen changes.

import {
  ESCAPE_DISTANCE,
  FARMER,
  FAST_FALL,
  GRAVITY,
  GROUND_Y,
  JUMP_SPEED,
  LIVES,
  OBSTACLES,
  PICKUPS,
  PLAYER,
  SCORE,
  SCROLL,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_OVER = 4;
export const EVENT_ESCAPED = 8;

export const KIND_FENCE = 'fence';
export const KIND_HAY = 'hay';
export const KIND_OVEN = 'oven';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_KNIFE = 'knife';
export const KIND_CORN = 'corn';
export const KIND_PIE = 'pie';
export const KIND_FEATHER = 'feather';

/** How far ahead of the turkey new things appear (px past the right edge). */
const SPAWN_AHEAD = 1040;
/** Gap between spawns, in metres run: an obstacle every couple of seconds,
    never so close that the turkey is still landing from the last jump
    when the next one arrives (airtime is ~0.91 s). */
const GAP_MIN = 26;
const GAP_MAX = 44;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const world = {
    state: null,
    reset() {
      this.state = {
        time: 0,
        distance: 0,
        score: 0,
        /** Bonus points from pickups (corn +10, pie +25, feather +50). */
        bonus: 0,
        lives: LIVES,
        speed: SCROLL.base,
        farmerGap: FARMER.startGap,
        player: {
          x: PLAYER.x,
          y: GROUND_Y - PLAYER.height,
          width: PLAYER.width,
          height: PLAYER.height,
          vy: 0,
          onGround: true,
          ducking: false,
          invuln: 0,
          runPhase: 0,
        },
        obstacles: [],
        pickups: [],
        leaves: [],
        nextSpawnAt: 25,
        /** Last obstacle spawned, so a knife never follows one too closely:
            the turkey cannot duck a knife while it is jumping a fence. */
        lastObstacleAt: -100,
        lastObstacleKind: null,
        over: false,
        escaped: false,
        /** Last event text, for the HUD toast ("+25 PIE!"). */
        toast: '',
        toastTime: 0,
      };
      for (let i = 0; i < 26; i += 1) this.state.leaves.push(this.makeLeaf(true));
    },

    makeLeaf(anywhere) {
      return {
        x: anywhere ? random.next() * 960 : 960 + random.next() * 120,
        y: random.next() * 300 + 20,
        size: 5 + random.next() * 7,
        vy: 22 + random.next() * 26,
        sway: random.next() * Math.PI * 2,
        color: random.pick(['#d97b2b', '#c94f2e', '#e8a33d', '#a8542a']),
      };
    },

    speedFor(distance) {
      return Math.min(SCROLL.max, SCROLL.base + (distance / 100) * SCROLL.per100m);
    },

    spawnObstacle(distance) {
      const roll = random.next();
      let kind = KIND_FENCE;
      if (distance < 60) kind = random.chance(0.6) ? KIND_FENCE : KIND_HAY;
      else if (roll < 0.26) kind = KIND_FENCE;
      else if (roll < 0.5) kind = KIND_HAY;
      else if (roll < 0.66) kind = KIND_OVEN;
      else if (roll < 0.84) kind = KIND_PUMPKIN;
      else kind = KIND_KNIFE;
      // A knife right behind another obstacle is unfair: the turkey is
      // still in the air from the jump when the knife arrives, and it can
      // neither duck (it is airborne) nor jump again. Re-roll to a jumper.
      if (kind === KIND_KNIFE && distance - this.state.lastObstacleAt < 45) {
        kind = random.pick([KIND_FENCE, KIND_HAY, KIND_PUMPKIN]);
      }
      this.state.lastObstacleAt = distance;
      this.state.lastObstacleKind = kind;
      const spec = OBSTACLES[kind];
      const y = kind === KIND_KNIFE ? GROUND_Y - OBSTACLES.knife.flyHeight : GROUND_Y - spec.height;
      this.state.obstacles.push({
        kind,
        x: SPAWN_AHEAD,
        y,
        width: spec.width,
        height: spec.height,
        active: true,
        spin: 0,
      });
      // A pickup sometimes rides just past an obstacle, as the reward for clearing it.
      if (random.chance(0.55)) {
        const pk = random.chance(0.75) ? KIND_CORN : KIND_PIE;
        const ps = PICKUPS[pk];
        this.state.pickups.push({
          kind: pk,
          x: SPAWN_AHEAD + 120 + random.next() * 80,
          y: GROUND_Y - ps.hover - ps.height,
          width: ps.width,
          height: ps.height,
          active: true,
          bob: random.next() * Math.PI * 2,
        });
      }
      if (random.chance(0.12)) {
        const ps = PICKUPS.feather;
        this.state.pickups.push({
          kind: KIND_FEATHER,
          x: SPAWN_AHEAD + 260,
          y: GROUND_Y - ps.hover - ps.height,
          width: ps.width,
          height: ps.height,
          active: true,
          bob: 0,
        });
      }
    },

    playerBox() {
      const p = this.state.player;
      const height = p.ducking ? 38 : PLAYER.height;
      return { x: p.x + 6, y: p.y + (PLAYER.height - height), width: p.width - 12, height };
    },

    step(dt, input, attract) {
      const s = this.state;
      if (s.over || s.escaped) return EVENT_NONE;
      let events = EVENT_NONE;
      s.time += dt;

      // Leaves drift across the field whatever the game is doing.
      for (const leaf of s.leaves) {
        leaf.x -= (s.speed * 0.25 + 12) * dt;
        leaf.y += leaf.vy * dt;
        leaf.sway += dt * 2;
        if (leaf.x < -20 || leaf.y > 540) Object.assign(leaf, this.makeLeaf(false));
      }

      const p = s.player;
      if (p.invuln > 0) p.invuln -= dt;
      if (s.toastTime > 0) s.toastTime -= dt;

      // Jump: only from the ground, and a held Down key in the air drops fast.
      if (input.jump && p.onGround && !p.ducking) {
        p.vy = -JUMP_SPEED;
        p.onGround = false;
      }
      if (input.duck && !p.onGround) p.vy += FAST_FALL * dt;
      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y >= GROUND_Y - PLAYER.height) {
        p.y = GROUND_Y - PLAYER.height;
        p.vy = 0;
        p.onGround = true;
      } else {
        p.onGround = false;
      }
      p.ducking = Boolean(input.duck && p.onGround);
      p.runPhase += dt * (p.onGround ? s.speed / 34 : 0);

      if (!attract) {
        s.distance += (s.speed * dt) / 22;
        s.score = Math.floor(s.distance * SCORE.perMetre) + s.bonus;
        s.speed = this.speedFor(s.distance);
        // The farmer gains a little ground back when the turkey runs clean.
        s.farmerGap = Math.min(FARMER.startGap, s.farmerGap + FARMER.recoverPerSec * dt);
        if (s.distance >= ESCAPE_DISTANCE) {
          s.escaped = true;
          return EVENT_ESCAPED;
        }
        if (s.distance >= s.nextSpawnAt) {
          this.spawnObstacle(s.distance);
          s.nextSpawnAt = s.distance + GAP_MIN + random.next() * (GAP_MAX - GAP_MIN);
        }
      }

      const box = this.playerBox();
      for (const ob of s.obstacles) {
        if (!ob.active) continue;
        ob.x -= (s.speed + (ob.kind === KIND_KNIFE ? OBSTACLES.knife.flySpeed : 0)) * dt;
        if (ob.kind === KIND_PUMPKIN) ob.spin += dt * 9;
        if (ob.x + ob.width < -40) {
          ob.active = false;
          continue;
        }
        // Knives fly at head height: only a ducking turkey slips under one.
        const hitBox = ob.kind === KIND_KNIFE
          ? { x: ob.x, y: ob.y, width: ob.width, height: ob.height }
          : { x: ob.x + 6, y: ob.y + 6, width: ob.width - 12, height: ob.height - 6 };
        if (p.invuln <= 0 && overlaps(box, hitBox)) {
          ob.active = false;
          s.lives -= 1;
          s.farmerGap = Math.max(FARMER.minGap, s.farmerGap - FARMER.hitCloses);
          p.invuln = 1.4;
          s.toast = s.lives > 0 ? 'OUCH! The farmer gains on you!' : '';
          s.toastTime = 1.4;
          events |= EVENT_HIT;
          if (s.lives <= 0 || s.farmerGap <= FARMER.minGap) {
            s.over = true;
            return events | EVENT_OVER;
          }
        }
      }
      for (const pk of s.pickups) {
        if (!pk.active) continue;
        pk.x -= s.speed * dt;
        pk.bob += dt * 3;
        if (pk.x + pk.width < -40) {
          pk.active = false;
          continue;
        }
        if (overlaps(box, { x: pk.x - 6, y: pk.y - 6, width: pk.width + 12, height: pk.height + 12 })) {
          pk.active = false;
          s.bonus = (s.bonus || 0) + PICKUPS[pk.kind].value;
          s.score = Math.floor(s.distance * SCORE.perMetre) + s.bonus;
          s.toast = `+${PICKUPS[pk.kind].value} ${pk.kind.toUpperCase()}!`;
          s.toastTime = 1.1;
          events |= EVENT_PICKUP;
        }
      }
      s.obstacles = s.obstacles.filter((o) => o.active);
      s.pickups = s.pickups.filter((o) => o.active);
      return events;
    },
  };

  // The world starts fresh and ready; the game loop calls reset() again on restart.
  world.reset();
  return world;
}
