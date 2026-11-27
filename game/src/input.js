// Gobble Dash — input: keyboard, mouse and touch, all feeding the same
// three facts the loop needs: is jump pressed this frame, is duck held,
// and which menu action (confirm / pause / mute) just fired.

export const ACTION_NONE = 0;
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  const keys = new Set();
  let jumpQueued = false;
  let actions = ACTION_NONE;

  function onKeyDown(event) {
    if (JUMP_KEYS.has(event.code)) {
      if (!event.repeat) jumpQueued = true;
      event.preventDefault();
    } else if (DUCK_KEYS.has(event.code)) {
      event.preventDefault();
    } else if (PAUSE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (event.code === 'Enter') {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    }
    keys.add(event.code);
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointerDown(event) {
    event.preventDefault();
    // Lower half of the screen ducks; anywhere else jumps.
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    if (y > 0.72) {
      keys.add('PointerDuck');
    } else {
      jumpQueued = true;
      actions |= ACTION_CONFIRM;
    }
  }

  function onPointerUp() {
    keys.delete('PointerDuck');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    /** Jump held-or-queued this frame (edge-triggered: consumed by takeJump). */
    takeJump() {
      const jump = jumpQueued;
      jumpQueued = false;
      return jump;
    },
    /** Duck held right now (keyboard Down/S or a low touch). */
    ducking() {
      for (const code of DUCK_KEYS) if (keys.has(code)) return true;
      return keys.has('PointerDuck');
    },
    /** Menu actions fired since the last read (confirm / pause / mute). */
    takeActions() {
      const fired = actions;
      actions = ACTION_NONE;
      return fired;
    },
  };
}
