// ------------------------------------------------------------
//  🎓  TUTORIAL CARDS — a little storybook card that walks you through
//  something new, one step at a time. Each tutorial shows ONCE (it's
//  remembered in this browser).
//
//    showTutorialOnce("book", [{ title, text }, …])
//
//  Next / Enter / Space = next card, Esc = skip the rest.
//  Dev: ?tut=reset forgets which tutorials you've seen.
// ------------------------------------------------------------
const style = document.createElement("style");
style.textContent = `
  #tut { position: fixed; inset: 0; z-index: 60; display: none; align-items: center;
    justify-content: center; background: rgba(10, 6, 2, 0.45); }
  #tut.open { display: flex; }
  #tut .card { width: min(440px, 88vw); padding: 22px 26px 18px; border-radius: 16px;
    background: #f1e4c4; color: #3a2614; box-shadow: 0 14px 50px rgba(0,0,0,.6),
    inset 0 0 40px rgba(120,80,30,.22); font: 17px/1.5 Georgia, serif; text-align: center;
    animation: tutpop .25s ease; }
  @keyframes tutpop { from { transform: scale(.92); opacity: 0; } }
  #tut .card h3 { margin: 0 0 8px; font-size: 22px; color: #5a3a12; }
  #tut .card p { margin: 0 0 16px; }
  #tut .card kbd { display: inline-block; padding: 0 7px; border-radius: 5px;
    background: #3a2614; color: #ffe6a8; font: bold 14px system-ui; }
  #tut .row { display: flex; align-items: center; gap: 10px; }
  #tut .dots { flex: 1; text-align: left; letter-spacing: 3px; color: #b08a5a; font-size: 12px; }
  #tut button { border: 0; border-radius: 10px; padding: 9px 18px; cursor: pointer;
    font: bold 15px system-ui; }
  #tut .next { background: #5a3a12; color: #ffe6a8; }
  #tut .skip { background: transparent; color: #8a6a44; }
`;
document.head.appendChild(style);
const root = document.createElement("div");
root.id = "tut";
root.innerHTML = `<div class="card"><h3></h3><p></p><div class="row"><span class="dots"></span>
  <button class="skip">Skip</button><button class="next">Next</button></div></div>`;
document.body.appendChild(root);
const $ = (s) => root.querySelector(s);

let cards = null;
let at = 0;
let done = null;
function draw() {
  const c = cards[at];
  $("h3").textContent = c.title;
  $("p").innerHTML = c.text;
  $(".dots").textContent = cards.map((_, i) => (i === at ? "●" : "○")).join("");
  $(".next").textContent = at === cards.length - 1 ? (c.button || "Got it!") : "Next";
}
function close() {
  root.classList.remove("open");
  cards = null;
  const d = done;
  done = null;
  if (d) d();
}
function next() {
  if (!cards) return;
  if (cards[at].onLeave) cards[at].onLeave();
  at++;
  if (at >= cards.length) close();
  else draw();
}
$(".next").onclick = next;
$(".skip").onclick = close;
window.addEventListener(
  "keydown",
  (e) => {
    if (!cards) return;
    if (e.code === "Enter" || e.code === "Space") next();
    else if (e.code === "Escape") close();
    else return;
    e.preventDefault();
    e.stopImmediatePropagation(); // the game doesn't see keys while a card is up
  },
  true
);

if (new URLSearchParams(location.search).get("tut") === "reset") {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("ww.tut.")) localStorage.removeItem(k);
  } catch {}
}

/** Show these cards the first time only. Resolves when closed (or at once if already seen). */
export function showTutorialOnce(key, list) {
  let seen = false;
  try {
    seen = localStorage.getItem("ww.tut." + key) === "1";
    localStorage.setItem("ww.tut." + key, "1");
  } catch {}
  if (seen || cards) return Promise.resolve();
  cards = list;
  at = 0;
  draw();
  root.classList.add("open");
  return new Promise((res) => (done = res));
}
