# Port Solace

[![make.fun gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun)
[![rank](https://make.fun/badge/gta6-01/tachyon0215/muse-port-solace/rank.svg)](https://make.fun)
[![reward](https://make.fun/badge/gta6-01/tachyon0215/muse-port-solace/reward.svg)](https://make.fun)

Port Solace is an original top-down 2D open-world crime game built for the [make.fun](https://make.fun) competition [gta6-01 "Make GTA 6"](https://make.fun).

Explore the harbour city of Port Solace on foot and by car as courier Rin Vale: take delivery and checkpoint missions, earn cash, avoid (or attract) the Harbor Patrol, and watch your wanted stars rise.

## Play

Serve the `game/` folder with any static HTTP server, or run:

```
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. No build step, no network requests — all files are static under `game/`.

## Controls

- WASD / Arrow keys: move / drive
- E: enter / exit a car
- Shift: sprint on foot
- Enter: confirm / start
- P / Esc: pause

## Features

- City grid with roads, sidewalks, crosswalks and 50 named buildings
- Traffic AI cars and pedestrians
- Wanted-star system with Harbor Patrol police cars that chase and ram
- Health, money, speed readout and a minimap HUD
- Two repeatable mission types: Package Run deliveries and the Harbor Loop checkpoint race
- localStorage save (money, jobs done, best earnings)

All city, character, vehicle and story names are original. No assets or names from any commercial game are used.

## License

MIT — see LICENSE.
