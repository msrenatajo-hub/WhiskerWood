# WhiskerWood

A browser game: a low-poly mouse adventure / life simulator built with **three.js + Vite**, plain
JavaScript (ES modules), no framework. You play **Thistle Mosswhisker**, a young mouse who becomes
the Moonkeeper and restores the Great Canopy Alliance across the cities of the Great Forest. The
game designer is Renata ("Renata Rudy :)" in the credits); design ideas live in the pink **Idea
Book** (`catalog.html`).

Canon to keep straight: Sprig (your apprentice) is a boy — he/him. Pip (the baby storm dragon) is
she. The Frozen Crown belongs to the Snow **King**.

## Running

```bash
npm install
npm run dev      # http://localhost:5173  (needs Node 18+; with nvm: `nvm use 24`)
npm run build    # production build into dist/ — use it as a quick syntax/import check
```

`library/` is a **separate** app (the Grand Library design bible, TypeScript, port 5174) with its
own `package.json` — see `library/README.md`. It is not part of the game build.

## Layout

```
index.html            the game page (HUD markup, key list)
catalog.html          🌸 the Idea Book — every idea, numbered story chapters; saves itself via the dev server
world-editor.html     the forest layout editor  → saves public/world-layout.json
editor.html           designer editor;  public/cell-editor.html = crafting-cell editor
vite.config.js        dev-server save endpoints for the editors + Idea Book
public/               models (.glb/.gltf), item pictures (public/items = Fluent emoji PNGs), audio, world layout
scripts/              one-off data migrations
src/                  the game (≈100 modules, below)
```

### src/ — the big pieces

| File | What it is |
|---|---|
| `main.js` | Entry point and core loop: renderer, scene, player movement/physics, camera, worlds (den, outside, cities, homes, tunnels), weather, HUD, save/load, and the `ctx` objects handed to every other module. Exposes `window.__ww` dev hooks. |
| `boot.js` | Runs first; handles `?newgame=1` save wipes. |
| `retro.js` | The "N64 look": flat 2-band toon shading, fog multiplier, resolution steps (V key). `?hd=1` = old PBR look. |
| `outside.js` | The Great Forest: terrain/height, water, grass, trees, the den, landmarks, model loading, `buildThistle()` (the mouse model). |
| `cities.js`, `roothaven.js`, `tunnels.js` | The Great Cities, Roothaven (underground), the Moonkeeper tunnels. |
| `cityLife.js` | Everything that makes cities alive: shops/stalls (`openCard`/`closeCard` UI in `#shop`), clothes/wardrobe, houses for sale, walk-in shop rooms (`shopHouse`), keepsakes (`registerKeepsake`), city save state (`cityState`, `saveCity`, key `ww.citylife.v1`). |
| `homes.js` | Interiors: your houses and every walk-in shop/café room (`registerRoom`). |
| `questZones.js` | **Every zone** (self-contained mini-world reached via `goCity(id)`): `ZONE_INFO`, `buildZone(id)` dispatch, and one `buildX()` per zone with its own `height()`, colliders, platforms, `waterAt`. Zone constants (e.g. `JUNGLE`, `FROZENSEA`) are exported for the phase that uses them. |
| `story.js` | The story driver: Phase 1 itself, the quest panel, and the wiring that inits/updates/routes E-presses to every `phaseN.js`. |
| `phase2.js` … `phase39.js` | One story chapter each (see below). |
| `cutscene.js` | In-engine movies (`playCutscene([...shots])`, `fadeThrough`). Lines with text wait for Space/E. |
| `quests.js`, `restock.js`, `economy.js` | Side quests (Q log), endless shop restock, price growth with story progress. |
| `more.js`, `more2.js`, `more3.js`, `extras.js` | Grab-bags of world systems: music/flute (U) + songs, village, legends, dog sledding, dragon flight (1 menu, `DRAGON_DESTS`), dragon races, seasons, festivals… |
| `secrets.js`, `secretPlaces.js` | 46+ secrets (hold F to look closely, flute tunes, night visits) and the secret-room zones. |
| `signatures.js`, `dunerun.js` | One "signature" mini-adventure per finished world (⭐ in the dragon menu); the Dune Run 2D sandboarding game. |
| `animals.js`, `mountModels.js`, `pets.js` | Wild animals, rideable mounts, pets/companions. |
| `items.js`, `conjure.js`, `powers.js`, `itemArt.js`, `livingArt.js` | Items that *do* things, bottled magic, item powers, item pictures, living wall paintings. |
| `paradise.js`, `rink.js`, `skating.js`, `balloons.js`, `cooking.js`, `trophies.js`, `travel.js` | Individual places/activities. |
| `signs.js` | **The** in-world sign maker (`signPost`, `signBoard`, `signTexture`) — crisp, unlit, readable from both sides. Use it for every sign. |
| `mouseSteer.js` | Mouse-only steering for every dragon ride (pointer lock + pitch). |
| `minimap.js`, `help.js`, `tutorial.js`, `ambient.js`, `tracks.js`, `buildings.js`, `wisp.js`, `food.js`, `ingredients.js`, `recipes.js`, `friends.js` | Map (M), Help Book (Z), tutorial cards, ambient sound, pawprints, small buildings, shadow-wisps, food, recipe data, townsfolk + letters. |
| `editor.js`, `world-editor.js` | The in-game designer editor and the world layout editor. |

## How a story phase works

Story phases follow the **Idea Book's chapter numbers** (`catalog.html` → "Story Chapters"). When a
phase is built, its chip in the book flips from `💭 a dream` to `🌿 built`.

Each `src/phaseN.js` exports `initPhaseN({ ctx, st, save, chime, redraw })` and returns
`{ update(dt, t), interactable(), panelHTML(), done() }`:

- state lives in `st.pN` (story save); `begin()` fires a few seconds after phase N-1 is done
- `interactable()` returns `{ label, act }` for the E prompt
- a phase usually pushes a `DRAGON_DESTS` entry (from `more3.js`) so you can fly there with 1
- its world is a zone in `questZones.js` plus a `CITY_LOOK.<zone>` (sky/fog/light) entry in `main.js`
- `story.js` wires it in: import, `?story=pN` jump, panel, free-roam check, `inCity` E-chain, update,
  and the `?gophase=N` fill. Most phases expose a `window.__wwPN` test hook.

## Conventions / house rules

- Code style: 2-space indent, double quotes, friendly emoji section comments (`// ---- 🌋 …`),
  short `(parenthetical)` comments explaining the *why*. Match the surrounding file.
- New ideas go into the Idea Book first as `💭 a dream`; build them one at a time when asked.
- Anything whose name says it does something must actually do it (`items.js` USES registry).
- No "walk faster" powers. No Esc-skipping cutscenes. Dialogue advances only on Space/E.
- Shops/Paradise are mature and unconventional (no pink, no pet rocks).
- Shop and backpack cards must never jump when you click/buy/sell (`keepScrollOnRedraw`).
- Every in-world sign goes through `signs.js`.
- Dragon riding is steered with the mouse only (`mouseSteer.js`).
- The save must never be lost on refresh: dev params are split into SAVE_SAFE / one-shot lists in `main.js`.

## Dev URL params (handy)

`?newgame=1` · `?story=pN` (jump to phase N fresh) · `?gophase=N` (fill earlier phases, safe on a
real save) · `&p9city=<zone>` (start in a city/zone) · `&csat=N` (start cutscenes at shot N) ·
`?growdragon=1` · `?give=10` / `?designer=1` (cheats) · `?hd=1` · `?res=240`.

## Testing

There is no unit-test suite. Changes are verified by `npm run build` plus headless Chrome driven
over the DevTools protocol (scripts kept outside the repo): load a URL, call the `window.__ww*`
hooks (`__wwTeleport(x, z)`, `__wwPos()`, `__wwFly.go(id)`, `__wwPN.state()`…), press keys, take
screenshots, and fail on console errors. Gotchas:

- Kill a stale headless Chrome between runs or it reuses the old localStorage save.
- Vite reloads the page whenever a `src` file changes — don't edit while a browser test runs.
- Headless runs ~3× slower; cutscenes now wait for Space/E, so tests must press Space through them.
