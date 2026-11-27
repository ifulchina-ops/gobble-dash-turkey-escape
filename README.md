# gobble-dash-turkey-escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/ifulchina-ops/gobble-dash-turkey-escape/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/ifulchina-ops/gobble-dash-turkey-escape/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Gobble Dash — the great turkey escape. The farmer is coming, the oven is hot, and Thanksgiving is tomorrow: run, jump the fences, duck the carving knives, grab corn and pie, and escape the farm at 1000 metres.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network, just static files under `game/`.

## How to play

- **SPACE / ↑ / click / tap** — jump (jump the fences, hay bales, ovens and pumpkins)
- **↓ / S** — duck (slip under the farmer's thrown carving knives)
- **P** — pause, **M** — mute
- Collect **corn (+10)**, **pumpkin pie (+25)** and rare **golden feathers (+50)**.
- Three hits and the farmer catches you — or he closes the gap himself. Reach **1000 m** and the turkey is free.

## Screenshots

`screenshots/` holds real renders of the game running in a desktop browser: the title screen, a run in play, and the caught end screen — staged with `?shot=start|play|end&seed=1`, which plays the real rules forward with an autopilot.

## The entry program

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=j62x7qjj&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
