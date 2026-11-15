// One-time world migration to canon v2:
//  - the map grows 4x (landmarks spread out Breath-of-the-Wild style)
//  - forests STAY dense: scenery keeps its offset from its nearest landmark
//  - the Human House is removed (humans now live only at the world's edges)
// Run: node scripts/migrate-world-v2.mjs
import { readFileSync, writeFileSync } from "node:fs";

const SCALE = 4;
const layout = JSON.parse(readFileSync("public/world-layout.json", "utf8"));

// Guard: refuse to run twice (positions would explode).
if (layout.some((e) => Math.abs(e.x) > 1000 || Math.abs(e.z) > 1000)) {
  console.error("Layout already migrated — aborting.");
  process.exit(1);
}

// Cluster anchors: the labeled landmarks plus HOME at the origin.
const anchors = layout.filter((e) => e.kind).map((e) => ({ x: e.x, z: e.z }));
anchors.push({ x: 0, z: 0 });

const out = [];
let removed = 0;
for (const e of layout) {
  if (e.kind === "house") {
    removed++;
    continue; // canon v2: no Human House
  }
  if (e.kind) {
    out.push({ ...e, x: +(e.x * SCALE).toFixed(2), z: +(e.z * SCALE).toFixed(2) });
    continue;
  }
  // Scenery rides along with its nearest anchor, keeping local offsets so a
  // forest stays a forest instead of thinning into scattered trees.
  let best = anchors[0];
  let bd = Infinity;
  for (const a of anchors) {
    const d = (e.x - a.x) ** 2 + (e.z - a.z) ** 2;
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  out.push({
    ...e,
    x: +(best.x * SCALE + (e.x - best.x)).toFixed(2),
    z: +(best.z * SCALE + (e.z - best.z)).toFixed(2),
  });
}

writeFileSync("public/world-layout.json", JSON.stringify(out));
console.log(`migrated ${out.length} entries, removed ${removed} (Human House)`);
