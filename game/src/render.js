// Gobble Dash — the renderer: every pixel of the game is drawn here with
// canvas shapes, no images and no network. The turkey, the farmer, the
// barn, the oven's fire and the autumn leaves are all code, so the game
// plays identically offline and the screenshots are renders of this file.

import { ESCAPE_DISTANCE, GROUND_Y, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.scale(dpr, dpr);

  function sky(time) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    g.addColorStop(0, '#f7b733');
    g.addColorStop(0.45, '#f9d976');
    g.addColorStop(0.75, '#f6c453');
    g.addColorStop(1, '#e8893a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Low autumn sun.
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, 830, 86, 46, 46);
    ctx.fillStyle = '#ffe98a';
    ellipse(ctx, 830, 86, 34, 34);
    // Slow clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 3; i += 1) {
      const cx = ((i * 340 + time * 12) % 1100) - 80;
      const cy = 56 + i * 38;
      ellipse(ctx, cx, cy, 52, 18);
      ellipse(ctx, cx + 34, cy + 6, 40, 15);
      ellipse(ctx, cx - 36, cy + 7, 36, 13);
    }
  }

  function hills(distance) {
    // Two parallax hill bands + a red barn that drifts past.
    ctx.fillStyle = '#c98a3d';
    ctx.beginPath();
    ctx.moveTo(0, 400);
    for (let x = 0; x <= VIEW.width; x += 40) {
      ctx.lineTo(x, 396 - Math.sin((x + distance * 0.35) / 160) * 14);
    }
    ctx.lineTo(VIEW.width, VIEW.height);
    ctx.lineTo(0, VIEW.height);
    ctx.closePath();
    ctx.fill();
    const barnX = 760 - ((distance * 22) % 1400);
    ctx.fillStyle = '#a33327';
    ctx.fillRect(barnX, 330, 120, 92);
    ctx.fillStyle = '#7e241b';
    ctx.beginPath();
    ctx.moveTo(barnX - 8, 332);
    ctx.lineTo(barnX + 60, 292);
    ctx.lineTo(barnX + 128, 332);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6e3c5';
    ctx.fillRect(barnX + 46, 372, 28, 50);
    ctx.strokeStyle = '#7e241b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(barnX + 46, 372);
    ctx.lineTo(barnX + 74, 422);
    ctx.moveTo(barnX + 74, 372);
    ctx.lineTo(barnX + 46, 422);
    ctx.stroke();
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(barnX + 18, 344, 20, 20);
    ctx.fillRect(barnX + 82, 344, 20, 20);
  }

  function ground(distance) {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    ctx.fillStyle = '#a06a35';
    ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
    // Fence posts scrolling past, and tufts of grass.
    ctx.fillStyle = '#6d4420';
    const off = (distance * 22) % 96;
    for (let x = -off; x < VIEW.width; x += 96) {
      ctx.fillRect(x, GROUND_Y + 18, 8, 34);
      ctx.fillRect(x + 8, GROUND_Y + 30, 88, 6);
    }
    ctx.strokeStyle = '#7c9a4d';
    ctx.lineWidth = 2;
    for (let x = 30 - ((distance * 22) % 70); x < VIEW.width; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 8);
      ctx.lineTo(x - 4, GROUND_Y - 4);
      ctx.moveTo(x + 6, GROUND_Y + 8);
      ctx.lineTo(x + 10, GROUND_Y - 5);
      ctx.stroke();
    }
  }

  function drawTurkey(p, time) {
    const blink = Math.floor(p.invuln * 8) % 2 === 0;
    if (p.invuln > 0 && blink) ctx.globalAlpha = 0.45;
    const x = p.x;
    const y = p.y;
    const legSwing = p.onGround ? Math.sin(p.runPhase * 2.4) * 10 : 6;
    // Tail fan.
    ctx.fillStyle = '#7a4a21';
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(x + 8, y + 30);
      ctx.rotate(i * 0.42 - 0.5);
      ctx.beginPath();
      ctx.ellipse(-16, 0, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#c98a3d';
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(x + 8, y + 30);
      ctx.rotate(i * 0.42 - 0.5);
      ctx.beginPath();
      ctx.ellipse(-13, 0, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 52);
    ctx.lineTo(x + 28 + legSwing, y + 62);
    ctx.moveTo(x + 40, y + 52);
    ctx.lineTo(x + 40 - legSwing, y + 62);
    ctx.stroke();
    // Body.
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, x + 32, y + 34, 30, 24);
    ctx.fillStyle = '#a06a35';
    ellipse(ctx, x + 32, y + 38, 22, 17);
    // Wing.
    ctx.fillStyle = '#6d4420';
    ctx.save();
    ctx.translate(x + 30, y + 32);
    ctx.rotate(p.onGround ? Math.sin(p.runPhase * 2.4) * 0.35 : -0.9);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Neck + head.
    ctx.fillStyle = '#a06a35';
    ctx.fillRect(x + 52, y - 2, 10, 26);
    ctx.fillStyle = '#c98a3d';
    ellipse(ctx, x + 58, y - 2, 13, 12);
    // Beak + wattle + eye.
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.moveTo(x + 68, y - 4);
    ctx.lineTo(x + 80, y + 1);
    ctx.lineTo(x + 68, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ellipse(ctx, x + 62, y + 8, 4, 7);
    ctx.fillStyle = '#1c1c1c';
    ellipse(ctx, x + 61, y - 5, 2.6, 2.6);
    ctx.fillStyle = '#fff';
    ellipse(ctx, x + 62, y - 6, 0.9, 0.9);
    ctx.globalAlpha = 1;
    void time;
  }

  function drawFarmer(state) {
    const gap = state.farmerGap;
    const x = state.player.x - gap - 46;
    if (x < -70) return;
    const y = GROUND_Y - 86;
    const bob = Math.sin(state.time * 11) * 3;
    // Legs mid-chase.
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 58);
    ctx.lineTo(x + 18 + Math.sin(state.time * 11) * 12, y + 84);
    ctx.moveTo(x + 32, y + 58);
    ctx.lineTo(x + 32 - Math.sin(state.time * 11) * 12, y + 84);
    ctx.stroke();
    // Overalls + shirt.
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x + 10, y + 26 + bob, 30, 34);
    ctx.fillStyle = '#2c4a6b';
    ctx.fillRect(x + 12, y + 44 + bob, 26, 18);
    // Arm + pitchfork reaching forward.
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + 38, y + 32 + bob);
    ctx.lineTo(x + 56, y + 18 + bob);
    ctx.stroke();
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 52, y + 52 + bob);
    ctx.lineTo(x + 66, y + 6 + bob);
    ctx.stroke();
    ctx.strokeStyle = '#d5d5d5';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 66 + i * 5, y + 6 + bob);
      ctx.lineTo(x + 70 + i * 6, y - 8 + bob);
      ctx.stroke();
    }
    // Head + straw hat + angry moustache.
    ctx.fillStyle = '#f0c08a';
    ellipse(ctx, x + 25, y + 14 + bob, 13, 13);
    ctx.fillStyle = '#e8c33d';
    ellipse(ctx, x + 25, y + 6 + bob, 20, 6);
    ctx.fillRect(x + 14, y - 6 + bob, 22, 10);
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(x + 19, y + 16 + bob, 12, 3);
  }

  function drawObstacle(ob, time) {
    const x = ob.x;
    const y = ob.y;
    if (ob.kind === 'fence') {
      ctx.fillStyle = '#7a4a21';
      ctx.fillRect(x, y, 8, ob.height);
      ctx.fillRect(x + ob.width - 8, y, 8, ob.height);
      ctx.fillRect(x, y + 8, ob.width, 10);
      ctx.fillRect(x, y + 30, ob.width, 10);
      ctx.fillStyle = '#5d3a1a';
      ctx.fillRect(x, y, ob.width, 6);
    } else if (ob.kind === 'hay') {
      ctx.fillStyle = '#d9a441';
      ellipse(ctx, x + ob.width / 2, y + ob.height / 2 + 6, ob.width / 2, ob.height / 2 - 2);
      ctx.strokeStyle = '#a67c2e';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(x + ob.width / 2, y + ob.height / 2 + 6, 12 + i * 7, 0.3, Math.PI - 0.3);
        ctx.stroke();
      }
    } else if (ob.kind === 'oven') {
      ctx.fillStyle = '#3d3d3d';
      rr(ctx, x, y, ob.width, ob.height, 8);
      ctx.fill();
      ctx.fillStyle = '#1c1c1c';
      rr(ctx, x + 12, y + 14, ob.width - 24, 34, 6);
      ctx.fill();
      // Fire licking out of the oven door.
      const flick = Math.sin(time * 14 + x) * 4;
      ctx.fillStyle = '#e67e22';
      ctx.beginPath();
      ctx.moveTo(x + 22, y + 46);
      ctx.quadraticCurveTo(x + 30 + flick, y + 18, x + 40, y + 46);
      ctx.quadraticCurveTo(x + 52 - flick, y + 24, x + 62, y + 46);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(x + 30, y + 46);
      ctx.quadraticCurveTo(x + 38 + flick, y + 30, x + 46, y + 46);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', x + ob.width / 2, y + 70);
    } else if (ob.kind === 'pumpkin') {
      ctx.save();
      ctx.translate(x + ob.width / 2, y + ob.height / 2);
      ctx.rotate(ob.spin || 0);
      ctx.fillStyle = '#d97b2b';
      ellipse(ctx, 0, 0, 26, 24);
      ctx.strokeStyle = '#a8542a';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.ellipse(i * 9, 0, 5, 22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#5d8a3d';
      ctx.fillRect(-3, -30, 6, 10);
      ctx.restore();
    } else if (ob.kind === 'knife') {
      ctx.save();
      ctx.translate(x + ob.width / 2, y + ob.height / 2);
      ctx.fillStyle = '#d5d5d5';
      ctx.beginPath();
      ctx.moveTo(-28, -4);
      ctx.lineTo(14, -7);
      ctx.lineTo(28, 0);
      ctx.lineTo(14, 7);
      ctx.lineTo(-28, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5d3a1a';
      rr(ctx, -28, -5, 14, 10, 3);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x - 10, y + ob.height / 2 - 1, ob.width + 20, 2);
    }
  }

  function drawPickup(pk, time) {
    const bobY = Math.sin(pk.bob + time * 2) * 3;
    const x = pk.x;
    const y = pk.y + bobY;
    if (pk.kind === 'corn') {
      ctx.fillStyle = '#f1c40f';
      ellipse(ctx, x + 15, y + 18, 10, 16);
      ctx.fillStyle = '#e67e22';
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 2; c += 1) ellipse(ctx, x + 10 + c * 10, y + 8 + r * 10, 2.4, 2.4);
      }
      ctx.fillStyle = '#5d8a3d';
      ctx.beginPath();
      ctx.moveTo(x + 15, y + 34);
      ctx.lineTo(x + 6, y + 44);
      ctx.lineTo(x + 24, y + 44);
      ctx.closePath();
      ctx.fill();
    } else if (pk.kind === 'pie') {
      ctx.fillStyle = '#e8a33d';
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 20);
      ctx.lineTo(x + 32, y + 20);
      ctx.lineTo(x + 17, y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ellipse(ctx, x + 17, y + 15, 6, 4);
      ctx.fillStyle = '#f6e3c5';
      ctx.fillRect(x + 2, y + 20, 30, 5);
    } else {
      // Golden feather: a shimmering prize.
      ctx.save();
      ctx.translate(x + 15, y + 17);
      ctx.rotate(Math.sin(time * 3) * 0.3);
      ctx.fillStyle = '#f7dc6f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b7950b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
    }
  }

  function hud(state, best) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(20,12,4,0.55)';
    rr(ctx, 14, 12, 330, 64, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`SCORE ${state.score}`, 26, 38);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#ffe98a';
    ctx.fillText(`${Math.floor(state.distance)} m  ·  BEST ${Math.max(best, state.score)}`, 26, 62);
    // Lives as hearts.
    for (let i = 0; i < 3; i += 1) {
      const hx = 372 + i * 30;
      const hy = 34;
      ctx.fillStyle = i < state.lives ? '#e74c3c' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 10, hy - 4, hx - 4, hy - 12, hx, hy - 5);
      ctx.bezierCurveTo(hx + 4, hy - 12, hx + 10, hy - 4, hx, hy + 8);
      ctx.fill();
    }
    // Escape progress: farm on the left, freedom on the right.
    const barX = 560;
    const barW = 380;
    ctx.fillStyle = 'rgba(20,12,4,0.55)';
    rr(ctx, barX - 8, 16, barW + 16, 44, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    rr(ctx, barX, 30, barW, 14, 7);
    ctx.fill();
    const pct = Math.min(1, state.distance / ESCAPE_DISTANCE);
    ctx.fillStyle = '#27ae60';
    if (pct > 0) {
      rr(ctx, barX, 30, Math.max(14, barW * pct), 14, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPE', barX + barW / 2, 26);
    // The turkey's position on the escape bar: a little brown dot with a beak.
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, barX + barW * pct, 58, 7, 6);
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.moveTo(barX + barW * pct + 6, 56);
    ctx.lineTo(barX + barW * pct + 12, 58);
    ctx.lineTo(barX + barW * pct + 6, 60);
    ctx.closePath();
    ctx.fill();
    ctx.textAlign = 'left';
    // Toast (pickup / hit callouts).
    if (state.toastTime > 0 && state.toast) {
      ctx.fillStyle = 'rgba(20,12,4,0.6)';
      const tw = ctx.measureText(state.toast).width + 28;
      rr(ctx, (VIEW.width - tw) / 2, 84, tw, 34, 9);
      ctx.fill();
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.toast, VIEW.width / 2, 107);
      ctx.textAlign = 'left';
    }
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(20,10,2,0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff8e7';
    rr(ctx, 210, 92, 540, 356, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    rr(ctx, 210, 92, 540, 356, 18);
    ctx.stroke();
    ctx.fillStyle = '#7a3b12';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW.width / 2, 158);
    ctx.fillStyle = '#3d2b1a';
    ctx.font = '20px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 208 + i * 34));
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    sky(state.time);
    hills(state.distance);
    ground(state.distance);
    for (const leaf of state.leaves) {
      ctx.save();
      ctx.translate(leaf.x + Math.sin(leaf.sway) * 8, leaf.y);
      ctx.rotate(leaf.sway * 0.4);
      ctx.fillStyle = leaf.color;
      ctx.fillRect(-leaf.size / 2, -leaf.size / 4, leaf.size, leaf.size / 2);
      ctx.restore();
    }
    for (const pk of state.pickups) if (pk.active) drawPickup(pk, state.time);
    for (const ob of state.obstacles) if (ob.active) drawObstacle(ob, state.time);
    drawFarmer(state);
    drawTurkey(state.player, state.time);

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) hud(state, best);
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(20,10,2,0.45)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      ctx.fillStyle = '#fff8e7';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOBBLE DASH', VIEW.width / 2, 150);
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('The Great Turkey Escape', VIEW.width / 2, 192);
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText('The farmer is coming. The oven is hot. RUN!', VIEW.width / 2, 232);
      ctx.fillText('SPACE / CLICK — jump      ↓ — duck under knives', VIEW.width / 2, 268);
      ctx.fillText('Grab corn, pie and golden feathers. Escape at 1000 m!', VIEW.width / 2, 300);
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Press SPACE or CLICK to start', VIEW.width / 2, 352);
      if (best > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '18px sans-serif';
        ctx.fillText(`Best score: ${best}`, VIEW.width / 2, 388);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '15px sans-serif';
      ctx.fillText('M — mute   ·   P — pause', VIEW.width / 2, 420);
      ctx.textAlign = 'left';
    } else if (screen === SCREEN_PAUSED) {
      panel('PAUSED', ['Take a breath, turkey.', 'Press P or SPACE to keep running.'], '#f1c40f');
    } else if (screen === SCREEN_OVER) {
      panel('CAUGHT!', [
        `The farmer got you at ${Math.floor(state.distance)} m.`,
        `Score ${state.score}  ·  Best ${Math.max(best, state.score)}`,
        'Thanksgiving dinner it is… unless you try again.',
        'Press SPACE or CLICK to run again.',
      ], '#c0392b');
    } else if (screen === SCREEN_ESCAPED) {
      panel('ESCAPED!', [
        'You outran the farmer, the oven and every knife —',
        '1000 m to freedom, and Thanksgiving is saved!',
        `Score ${state.score}  ·  Best ${Math.max(best, state.score)}`,
        'Press SPACE or CLICK to run again.',
      ], '#27ae60');
    }
  }

  return { draw };
}
