// Port Solace — entry point for the gta6-01 submission (Node 22, standard library only).
//
// This file is the packaging step for an original top-down 2D open-world game set in
// Port Solace, a fictional harbour city of docks, avenues and back streets. The player
// explores on foot and by car, takes on delivery and checkpoint missions for cash,
// and deals with a wanted-star system: break the law in view of the patrols and police
// units give chase, ease off and the heat gradually cools down. Health, money, a
// minimap HUD and a localStorage save round out the loop, all rendered with plain
// canvas and vanilla ES modules — no build step and no network calls at runtime.
//
// Packaging itself stays deliberately boring: copy the static game/ folder and the
// screenshots/ folder sitting beside this file into the output directory, then write
// dossier.json there using the vendored make.fun helper so the judges get a summary
// in the format they expect.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Human-readable name for this entry, kept in one place so log output and any
// future packaging tweaks refer to the game by the same title the player sees.
const ENTRY_TITLE = 'Port Solace';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Announce completion once the dossier is on disk — this does not change what
// was written, it just makes a packaging run easy to confirm from its output.
console.log(`${ENTRY_TITLE}: dossier written to ${out}`);
