# The Grand Library of Everbough

The design bible, encyclopedia, worldbuilding tool, and canon database for
**WhiskerWood** — presented as a walkable 3D fantasy mouse library rather than a
folder tree. This is a standalone companion app, **not the game**.

## Run

```bash
cd library
npm install
npm run dev      # http://localhost:5174
```

(The game itself runs from the repo root on :5173; the two are independent apps.)

## Architecture

Plain **TypeScript + Vite + Three.js**, no UI framework. Data lives in the browser
(localStorage) behind a `DataStore` interface so a real backend can drop in later.

```
src/
  engine/     Three.js — the walkable library (scene, props, post-processing, shaders)
  ui/         App controller, hash router, HTML overlays (page viewer, search, shelf)
  components/ Reusable UI atoms (canon badge, card, content renderer)
  pages/      Per-category page-view renderers
  data/       Types-backed data layer: store, Codex service, categories, seed lore
  types/      The canonical data model (Page, Category, Shelf, CanonStatus, …)
  styles/     Design tokens + component/overlay CSS
  utils/      Small helpers (event bus, DOM, ids)
  assets/     Static assets (art, icons)
```

### Data flow

`main.ts` boots a `Codex` (seeding sample lore on first run), an `Engine` (the 3D
scene), a `Library` (props + interaction), and the `App` (overlays + `Router`).
Clicking a bookshelf → a book floats to the reading desk → the HTML page viewer
slides over the scene. Everything is connected through a typed event bus.

### Rendering

The engine renders to an HDR target, then a post pass applies ACES tonemapping,
vignette, and film grain for a warm, handcrafted look. Materials (wood, stone) are
generated procedurally in code — no texture files. Rendering techniques were
informed by the excellent [glacial-valley](https://github.com/deedy/glacial-valley).
