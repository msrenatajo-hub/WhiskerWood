// ============================================================
//  WhiskerWood — The Complete Recipe Book (55 recipes) 🐭🌿
//  Each recipe lists the EXACT ingredients and how many you need.
//  Later, clicking a recipe will compare these amounts to what the
//  mouse is carrying and show each one in green (enough) or red (not).
// ============================================================

// Each recipe looks like:
//   { id, name, category, ingredients: [ { qty, item }, ... ] }

export const RECIPES = [
  // ---------------- 🏡 HOME & COMFORT ----------------
  {
    id: 1,
    name: "Moss Bedding",
    category: "Home & Comfort",
    ingredients: [
      { qty: 5, item: "Moss" },
      { qty: 3, item: "Grass Fibers" },
      { qty: 2, item: "Pine Needles" },
    ],
  },
  {
    id: 2,
    name: "Leaf Blanket",
    category: "Home & Comfort",
    ingredients: [
      { qty: 4, item: "Large Leaves" },
      { qty: 2, item: "Grass Fibers" },
      { qty: 1, item: "Cloth Scrap" },
    ],
  },
  {
    id: 3,
    name: "Den Wall Reinforcement",
    category: "Home & Comfort",
    ingredients: [
      { qty: 6, item: "Bark Sheets" },
      { qty: 4, item: "Root Fibers" },
      { qty: 3, item: "Stones" },
    ],
  },
  {
    id: 4,
    name: "Nursery Nest",
    category: "Home & Comfort",
    ingredients: [
      { qty: 5, item: "Moss" },
      { qty: 4, item: "Flower Petals" },
      { qty: 2, item: "Soft Cloth Fibers" },
    ],
  },
  {
    id: 5,
    name: "Lantern Mushroom Lamp",
    category: "Home & Comfort",
    ingredients: [
      { qty: 2, item: "Glowing Mushrooms" },
      { qty: 1, item: "Mushroom Cap" },
      { qty: 2, item: "String" },
    ],
  },
  {
    id: 6,
    name: "Warmth Stones",
    category: "Home & Comfort",
    ingredients: [
      { qty: 5, item: "Smooth Stones" },
      { qty: 2, item: "Moss" },
      { qty: 1, item: "Clay Mud" },
    ],
  },
  {
    id: 7,
    name: "Acorn Bowl",
    category: "Home & Comfort",
    ingredients: [
      { qty: 1, item: "Large Acorn Cap" },
      { qty: 1, item: "Sap Droplet" },
      { qty: 1, item: "Grass Fiber" },
    ],
  },
  {
    id: 8,
    name: "Storage Cache",
    category: "Home & Comfort",
    ingredients: [
      { qty: 4, item: "Bark Sheets" },
      { qty: 5, item: "Stones" },
      { qty: 3, item: "Dry Grass" },
    ],
  },
  {
    id: 9,
    name: "Family Keepsake Shelf",
    category: "Home & Comfort",
    ingredients: [
      { qty: 3, item: "Bark Sheets" },
      { qty: 2, item: "Tiny Trinkets" },
      { qty: 1, item: "Feather" },
    ],
  },
  {
    id: 10,
    name: "Thistle Bed",
    category: "Home & Comfort",
    ingredients: [
      { qty: 5, item: "Thistle Flowers" },
      { qty: 4, item: "Moss" },
      { qty: 2, item: "Pine Needles" },
    ],
  },

  // ---------------- 🎒 EXPLORATION GEAR ----------------
  {
    id: 11,
    name: "Travel Backpack",
    category: "Exploration Gear",
    ingredients: [
      { qty: 3, item: "Cloth Fibers" },
      { qty: 4, item: "String" },
      { qty: 2, item: "Bark Fibers" },
    ],
  },
  {
    id: 12,
    name: "Leaf Rain Cloak",
    category: "Exploration Gear",
    ingredients: [
      { qty: 5, item: "Large Leaves" },
      { qty: 2, item: "Sap Droplets" },
      { qty: 3, item: "String" },
    ],
  },
  {
    id: 13,
    name: "Root Rope",
    category: "Exploration Gear",
    ingredients: [
      { qty: 6, item: "Root Fibers" },
      { qty: 3, item: "Grass Fibers" },
    ],
  },
  {
    id: 14,
    name: "Dew Water Pouch",
    category: "Exploration Gear",
    ingredients: [
      { qty: 2, item: "Soft Cloth Fibers" },
      { qty: 1, item: "Sap Droplet" },
      { qty: 1, item: "String" },
    ],
  },
  {
    id: 15,
    name: "Scent Mask Pouch",
    category: "Exploration Gear",
    ingredients: [
      { qty: 2, item: "Lavender Flowers" },
      { qty: 3, item: "Moss" },
      { qty: 1, item: "Flower Petal" },
    ],
  },
  {
    id: 16,
    name: "Waterproof Leaf Pack",
    category: "Exploration Gear",
    ingredients: [
      { qty: 4, item: "Large Leaves" },
      { qty: 2, item: "Sap Droplets" },
      { qty: 2, item: "String" },
      { qty: 1, item: "Cloth Scrap" },
    ],
  },
  {
    id: 17,
    name: "Climbing Spikes",
    category: "Exploration Gear",
    ingredients: [
      { qty: 2, item: "Sharp Thorns" },
      { qty: 2, item: "Beetle Shells" },
      { qty: 2, item: "Root Fibers" },
    ],
  },
  {
    id: 18,
    name: "Glow Lantern",
    category: "Exploration Gear",
    // (fireflies, not glowing moss: the moss only grows in Moonstone Hollow,
    // and you need THIS lantern to get in there)
    ingredients: [
      { qty: 3, item: "Fireflies" },
      { qty: 1, item: "Mushroom Cap" },
      { qty: 2, item: "String" },
    ],
  },
  {
    id: 19,
    name: "Firefly Lantern",
    category: "Exploration Gear",
    ingredients: [
      { qty: 1, item: "Glass Fragment" },
      { qty: 3, item: "Fireflies" },
      { qty: 2, item: "String" },
      { qty: 1, item: "Moss" },
    ],
  },
  {
    id: 20,
    name: "Moonstone Necklace",
    category: "Exploration Gear",
    ingredients: [
      { qty: 1, item: "Crystal Fragment" },
      { qty: 2, item: "Root Fibers" },
      { qty: 1, item: "Tiny Bead" },
      { qty: 1, item: "Glowing Moss" },
    ],
  },

  // ---------------- 🍇 FOOD & SURVIVAL ----------------
  {
    id: 21,
    name: "Berry Bundle",
    category: "Food & Survival",
    ingredients: [
      { qty: 6, item: "Berries" },
      { qty: 1, item: "Twig" },
    ],
  },
  {
    id: 22,
    name: "Mushroom Stew",
    category: "Food & Survival",
    ingredients: [
      { qty: 3, item: "Mushrooms" },
      { qty: 1, item: "Creek Water" },
      { qty: 2, item: "Herbs" },
    ],
  },
  {
    id: 23,
    name: "Nectar Energy Mix",
    category: "Food & Survival",
    ingredients: [
      { qty: 2, item: "Nectar" },
      { qty: 3, item: "Clover Seeds" },
    ],
  },
  {
    id: 24,
    name: "Roasted Beetle Snack",
    category: "Food & Survival",
    ingredients: [
      { qty: 2, item: "Beetles" },
      { qty: 1, item: "Twig" },
    ],
  },
  {
    id: 25,
    name: "Healing Poultice",
    category: "Food & Survival",
    ingredients: [
      { qty: 2, item: "Medicinal Mushrooms" },
      { qty: 3, item: "Moss" },
      { qty: 1, item: "Bitter Herb" },
    ],
  },
  {
    id: 26,
    name: "Bee Wax Balm",
    category: "Food & Survival",
    ingredients: [
      { qty: 2, item: "Bee Wax" },
      { qty: 1, item: "Flower Petal" },
      { qty: 1, item: "Moss" },
    ],
  },
  {
    id: 27,
    name: "Glow Dust Satchel",
    category: "Food & Survival",
    ingredients: [
      { qty: 2, item: "Glowing Moss" },
      { qty: 1, item: "Mushroom Dust" },
      { qty: 1, item: "Cloth Scrap" },
      { qty: 1, item: "String" },
    ],
  },
  {
    id: 28,
    name: "Cheese Feast",
    category: "Food & Survival",
    ingredients: [
      { qty: 1, item: "Cheese Chunk" },
      { qty: 4, item: "Berries" },
      { qty: 2, item: "Clover Seeds" },
    ],
  },
  {
    id: 29,
    name: "Moon Petal Tea",
    category: "Food & Survival",
    ingredients: [
      { qty: 3, item: "Moon Petals" },
      { qty: 1, item: "Creek Water" },
      { qty: 1, item: "Nectar" },
    ],
  },
  {
    id: 30,
    name: "Snack Pouch",
    category: "Food & Survival",
    ingredients: [
      { qty: 2, item: "Cloth Fibers" },
      { qty: 2, item: "String" },
      { qty: 3, item: "Dry Grass" },
    ],
  },

  // ---------------- 🪶 CHARMS & COSMETICS ----------------
  {
    id: 31,
    name: "Braided Grass Bracelet",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 4, item: "Grass Fibers" },
      { qty: 1, item: "Tiny Bead" },
    ],
  },
  {
    id: 32,
    name: "Feather Charm",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 1, item: "Owl Feather" },
      { qty: 2, item: "String" },
    ],
  },
  {
    id: 33,
    name: "Button Backpack Pin",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 1, item: "Human Button" },
      { qty: 1, item: "String" },
    ],
  },
  {
    id: 34,
    name: "Berry Seed Charm",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 3, item: "Berry Seeds" },
      { qty: 1, item: "String" },
    ],
  },
  {
    id: 35,
    name: "Flower Crown",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 5, item: "Wildflowers" },
      { qty: 2, item: "Grass Fibers" },
    ],
  },
  {
    id: 36,
    name: "Acorn Pendant",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 1, item: "Acorn Cap" },
      { qty: 1, item: "String" },
      { qty: 1, item: "Tiny Pebble" },
    ],
  },
  {
    id: 37,
    name: "Lavender Anklet",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 3, item: "Lavender Flowers" },
      { qty: 2, item: "Grass Fibers" },
    ],
  },
  {
    id: 38,
    name: "Crystal Ear Charm",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 1, item: "Crystal Fragment" },
      { qty: 1, item: "String" },
    ],
  },
  {
    id: 39,
    name: "Firefly Jar Decoration",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 1, item: "Glass Fragment" },
      { qty: 2, item: "Fireflies" },
      { qty: 1, item: "String" },
    ],
  },
  {
    id: 40,
    name: "Moonstone Crown",
    category: "Charms & Cosmetics",
    ingredients: [
      { qty: 3, item: "Crystal Fragments" },
      { qty: 4, item: "Moon Petals" },
      { qty: 2, item: "Root Fibers" },
    ],
  },

  // ---------------- 🪵 BUILDING & STRUCTURES ----------------
  {
    id: 41,
    name: "Grass Hideout",
    category: "Building & Structures",
    ingredients: [
      { qty: 8, item: "Tall Grass" },
      { qty: 3, item: "Moss" },
      { qty: 2, item: "Twigs" },
    ],
  },
  {
    id: 42,
    name: "Twig Bridge",
    category: "Building & Structures",
    ingredients: [
      { qty: 5, item: "Sticks" },
      { qty: 4, item: "Root Fibers" },
    ],
  },
  {
    id: 43,
    name: "Lookout Perch",
    category: "Building & Structures",
    ingredients: [
      { qty: 4, item: "Bark Sheets" },
      { qty: 3, item: "Twigs" },
    ],
  },
  {
    id: 44,
    name: "Escape Tunnel",
    category: "Building & Structures",
    ingredients: [
      { qty: 6, item: "Root Fibers" },
      { qty: 5, item: "Stones" },
      { qty: 4, item: "Packed Dirt" },
    ],
  },
  {
    id: 45,
    name: "Storm Door",
    category: "Building & Structures",
    ingredients: [
      { qty: 4, item: "Bark Sheets" },
      { qty: 2, item: "Sap Droplets" },
      { qty: 3, item: "Stones" },
    ],
  },
  {
    id: 46,
    name: "Herb Drying Rack",
    category: "Building & Structures",
    ingredients: [
      { qty: 4, item: "Twigs" },
      { qty: 2, item: "Root Fibers" },
      { qty: 3, item: "Bark Strips" },
    ],
  },
  {
    id: 47,
    name: "Map Table",
    category: "Building & Structures",
    ingredients: [
      { qty: 5, item: "Bark Sheets" },
      { qty: 3, item: "Twigs" },
      { qty: 2, item: "String" },
      { qty: 1, item: "Feather" },
    ],
  },
  {
    id: 48,
    name: "Scent Trail Marker",
    category: "Building & Structures",
    ingredients: [
      { qty: 2, item: "Lavender Flowers" },
      { qty: 1, item: "Berry Juice" },
      { qty: 1, item: "Moss" },
    ],
  },
  {
    id: 49,
    name: "Baby Toy",
    category: "Building & Structures",
    ingredients: [
      { qty: 1, item: "Cloth Scrap" },
      { qty: 2, item: "Grass Fibers" },
      { qty: 1, item: "Tiny Button" },
    ],
  },
  {
    id: 50,
    name: "Sticky Sap Trap",
    category: "Building & Structures",
    ingredients: [
      { qty: 3, item: "Sap Droplets" },
      { qty: 2, item: "Mushroom Dust" },
      { qty: 1, item: "Beetle Shell" },
      { qty: 1, item: "Berry Juice" },
    ],
  },

  // ---------------- 🌙 SECRET RECIPES ----------------
  {
    id: 51,
    name: "Moonstone Lantern",
    category: "Secret Recipes",
    ingredients: [
      { qty: 2, item: "Crystal Fragments" },
      { qty: 3, item: "Glowing Moss" },
      { qty: 2, item: "String" },
    ],
  },
  {
    id: 52,
    name: "Secret Root Door",
    category: "Secret Recipes",
    ingredients: [
      { qty: 5, item: "Root Fibers" },
      { qty: 2, item: "Bark Sheets" },
      { qty: 3, item: "Moss" },
    ],
  },
  {
    id: 53,
    name: "Ancient Seed Planter",
    category: "Secret Recipes",
    ingredients: [
      { qty: 3, item: "Ancient Seeds" },
      { qty: 2, item: "Acorn Caps" },
      { qty: 1, item: "Moss" },
    ],
  },
  {
    id: 54,
    name: "Family Portrait Wall",
    category: "Secret Recipes",
    ingredients: [
      { qty: 3, item: "Bark Sheets" },
      { qty: 2, item: "Feathers" },
      { qty: 1, item: "Human Paper Scrap" },
    ],
  },
  {
    id: 55,
    name: "Moonstone Hollow Shrine",
    category: "Secret Recipes",
    ingredients: [
      { qty: 5, item: "Crystal Fragments" },
      { qty: 10, item: "Moon Petals" },
      { qty: 5, item: "Glowing Moss" },
    ],
  },

  // ---------------- 🍪 SPECIAL ----------------
  // The Cookie! (not pictured on the crafting table yet — easy to change)
  {
    id: 56,
    name: "Cookie",
    category: "Food & Survival",
    ingredients: [
      { qty: 3, item: "Oat Grains" },
      { qty: 2, item: "Berries" },
      { qty: 1, item: "Honey Drop" },
      { qty: 1, item: "Butter Bit" },
    ],
  },
];
