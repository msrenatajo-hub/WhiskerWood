// ------------------------------------------------------------
//  🍴 FOOD goes in your BAG — every shop, café, stall, the bonfire and
//  the cauldron put food in your backpack; you eat it when YOU choose
//  (B → click 🍴 eat on it).
// ------------------------------------------------------------
/** pack key → { icon, name, heal, warm } */
export const FOOD = {};
const plain = (n) => {
  let k = n.toLowerCase().trim();
  if (k.endsWith("ies")) k = k.slice(0, -3) + "y";
  else if (k.endsWith("s") && !k.endsWith("ss")) k = k.slice(0, -1);
  return k;
};
let adder = null; // main.js: (name, n) → true if it fit in the pack
export const setFoodAdder = (fn) => (adder = fn);
export function registerFood(it) {
  const k = plain(it.name);
  FOOD[k] = { icon: it.icon, name: it.name, heal: it.heal || 10, warm: !!it.warm };
  return k;
}
/** put something (not just food) in the bag → true if it fit */
export const addToBag = (name, n = 1) => (adder ? adder(name, n) !== false : false);
/** put one food item in the bag → a message for the shop card */
export function bagFood(it) {
  registerFood(it);
  const ok = adder ? adder(it.name, 1) !== false : false;
  return ok ? ` ${it.icon} It's in your bag — eat it whenever you like (B → 🍴 eat).` : " 🎒 Your bag is too full for more of that!";
}
