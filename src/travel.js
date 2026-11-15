// ------------------------------------------------------------
//  🗺️  TRAVEL THE OLD ROADS — the Moonkeepers' roads join the cities.
//  A storybook card listing every place you've unlocked; pick one and
//  you travel there (a short fade). Opened at waystones, the Explorers'
//  Guild map in Everbough, and the relit Moonkeeper stations.
// ------------------------------------------------------------
const style = document.createElement("style");
style.textContent = `
  #travel { position: fixed; inset: 0; z-index: 55; display: none; align-items: center;
    justify-content: center; background: rgba(8, 6, 14, 0.55); }
  #travel.open { display: flex; }
  #travel .card { width: min(460px, 90vw); padding: 20px 22px 14px; border-radius: 16px;
    background: #f1e4c4; color: #3a2614; font: 16px/1.4 Georgia, serif;
    box-shadow: 0 14px 50px rgba(0,0,0,.6), inset 0 0 40px rgba(120,80,30,.22); }
  #travel h3 { margin: 0 0 4px; text-align: center; font-size: 22px; color: #5a3a12; }
  #travel .sub { text-align: center; font-size: 13px; color: #8a6a44; margin-bottom: 12px; }
  #travel button.dest { display: flex; width: 100%; align-items: center; gap: 12px; margin: 6px 0;
    padding: 10px 12px; border: 1px solid rgba(90,58,18,.25); border-radius: 10px;
    background: rgba(255,255,255,.45); color: #3a2614; font: inherit; cursor: pointer; text-align: left; }
  #travel button.dest:hover { background: rgba(255,211,106,.45); }
  #travel button.dest .ic { font-size: 26px; }
  #travel button.dest small { display: block; color: #8a6a44; font-size: 12px; }
  #travel button.dest.here { opacity: .5; cursor: default; }
  #travel .close { margin-top: 10px; text-align: center; font: 12px system-ui; color: #8a6a44; }
`;
document.head.appendChild(style);
const root = document.createElement("div");
root.id = "travel";
document.body.appendChild(root);

let open = false;
export const travelOpen = () => open;
export function closeTravel() {
  open = false;
  root.classList.remove("open");
}
/**
 * dests: [{ id, icon, name, sub, here }], onPick(id)
 */
export function openTravel(dests, onPick) {
  open = true;
  root.innerHTML = `<div class="card"><h3>🛤️ The Moonkeepers' Roads</h3>
    <div class="sub">Where shall we go?</div>
    ${dests.map((d) => `<button class="dest ${d.here ? "here" : ""}" data-id="${d.id}"><span class="ic">${d.icon}</span><span>${d.name}<small>${d.here ? "(you are here)" : d.sub}</small></span></button>`).join("")}
    <div class="close">Esc — stay here</div></div>`;
  root.querySelectorAll("button.dest").forEach((b) => {
    b.onclick = () => {
      const d = dests.find((x) => x.id === b.dataset.id);
      if (!d || d.here) return;
      closeTravel();
      onPick(d.id);
    };
  });
  root.classList.add("open");
}
window.addEventListener(
  "keydown",
  (e) => {
    if (!open) return;
    if (e.code === "Escape") closeTravel();
    e.stopImmediatePropagation(); // (nothing else while choosing)
  },
  true
);
