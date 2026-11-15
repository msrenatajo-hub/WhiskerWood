// ------------------------------------------------------------
//  🪙  PRICES THAT GROW WITH YOUR ADVENTURE
//
//  • The further you get in the story, the more things cost: each phase
//    adds about 9% (Phase 10 ≈ 1.8×, Phase 20 ≈ 2.7×, Phase 28 ≈ 3.4×,
//    and it stops at 3.5×). The later phases pay out much more too, so you
//    can still afford things — they just feel precious.
//  • No spamming cheap things: every time you buy the SAME thing on the
//    same day it costs 25% more (up to 3×). Tomorrow it's back to normal.
//  • Selling pays a little more as you go too (half as fast as prices rise).
// ------------------------------------------------------------
let getPhase = () => 1;
let getSave = () => null;
export const setEconomySource = (phaseFn, saveFn) => {
  getPhase = phaseFn;
  getSave = saveFn;
};
/** how much more everything costs now, from how far you've got */
export function priceMult() {
  const p = Math.max(1, getPhase() || 1);
  return Math.min(3.5, 1 + (p - 1) * 0.09);
}
/** what selling things pays extra (half as fast as prices rise) */
export const sellMult = () => 1 + (priceMult() - 1) * 0.5;
function demandToday(key) {
  const S = getSave();
  if (!S || !key) return 0;
  const d = S.demand;
  if (!d || d.day !== (S.days || 0)) return 0;
  return d.n[key] || 0;
}
/** the price of something today (base price · story · how many you've bought today) */
export function cost(base, key) {
  const n = demandToday(key);
  return Math.max(1, Math.round(base * priceMult() * Math.min(3, 1 + 0.25 * n)));
}
/** a fair price (no "you just bought lots" bump) — for selling things back */
export const fairCost = (base) => Math.max(1, Math.round(base * priceMult()));
/** call after a purchase, so buying the same thing again today costs more */
export function bought(key) {
  const S = getSave();
  if (!S || !key) return;
  const day = S.days || 0;
  if (!S.demand || S.demand.day !== day) S.demand = { day, n: {} };
  S.demand.n[key] = (S.demand.n[key] || 0) + 1;
}
/**
 * Make every item in a list priced by the rules above: its `price` becomes
 * live (story + demand), `fairPrice` has no demand bump, `basePrice` is the
 * original. Works on items added to the list later too (call again).
 */
export function inflate(list, keyOf = (it) => it.key || it.name) {
  for (const it of list) {
    if (!it || it.__inflated || typeof it.price !== "number") continue;
    const base = it.price;
    Object.defineProperty(it, "price", { configurable: true, enumerable: true, get: () => cost(base, keyOf(it)), set: () => {} });
    Object.defineProperty(it, "fairPrice", { configurable: true, get: () => fairCost(base) });
    Object.defineProperty(it, "basePrice", { configurable: true, value: base });
    Object.defineProperty(it, "__inflated", { value: true });
  }
  return list;
}
