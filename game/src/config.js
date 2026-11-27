// Gobble Dash — Turkey Escape: tuning constants for the whole game.
// One place holds every number the world, renderer and screenshot pilot share,
// so a balance tweak never has to chase three files at once.

export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 460;
export const STEP = 1 / 60;

/** How far the turkey must run to escape the farm for good. */
export const ESCAPE_DISTANCE = 1000;
/** Lives: three hits and the farmer catches the turkey. */
export const LIVES = 3;

/** Vertical physics: snappy jump, quick fall, forgiving landing. */
export const GRAVITY = 2300;
export const JUMP_SPEED = 1050;
export const FAST_FALL = 1500;

/** The turkey's size on screen (width x height while running). */
export const PLAYER = {
  x: 170,
  width: 64,
  height: 62,
  duckHeight: 38,
  runSpeed: 0, // the turkey holds its ground; the world scrolls past it
};

/** Base scroll speed (px/s) and how much faster it gets per 100 m run. */
export const SCROLL = { base: 300, per100m: 26, max: 620 };
/** Points: each metre run is worth 1, pickups add their bonus on top. */
export const SCORE = { perMetre: 1, corn: 10, pie: 25, feather: 50 };

/** How far behind the turkey the farmer starts (px); a hit closes the gap. */
export const FARMER = { startGap: 110, hitCloses: 52, recoverPerSec: 7, minGap: 26 };

/** Obstacle shapes: width, height above ground, and the speed bonus some carry. */
export const OBSTACLES = {
  fence: { width: 44, height: 62, lift: 0 },
  hay: { width: 72, height: 54, lift: 0 },
  oven: { width: 92, height: 80, lift: 0 },
  pumpkin: { width: 52, height: 52, lift: 0 },
  knife: { width: 56, height: 16, lift: 0, flySpeed: 190, flyHeight: 58 },
};

/** Pickups: height they hover at and their score value. */
export const PICKUPS = {
  corn: { width: 30, height: 36, value: 10, hover: 30 },
  pie: { width: 34, height: 26, value: 25, hover: 96 },
  feather: { width: 30, height: 34, value: 50, hover: 150 },
};

/** Best-score key in localStorage. */
export const BEST_KEY = 'gobble-dash-best';
