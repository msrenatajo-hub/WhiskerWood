// ------------------------------------------------------------
//  💾 BOOT — runs before every other module.
//  ?newgame=1 wipes the save HERE, before any module has read its copy
//  (otherwise cities/pets/etc. would just write their old data back).
// ------------------------------------------------------------
if (new URLSearchParams(location.search).has("newgame")) {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("ww.")) localStorage.removeItem(k);
  } catch {}
}
