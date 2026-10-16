import type { CategoryDef, ShelfDef, CanonStatusDef } from "@/types/category";
import type { CategoryId, CanonStatus } from "@/types/page";

/**
 * The registry: the fixed vocabulary of the Library. Categories describe what a
 * page *is*; shelves are the furniture + navigation groupings, each with its
 * in-world name ("The Atlas of the Great Forest", not "Geography").
 */

export const CATEGORIES: readonly CategoryDef[] = [
  { id: "world", label: "World", color: 0x6a9bd8, icon: "🌍" },
  { id: "region", label: "Region", color: 0x5aa172, icon: "🗺️" },
  { id: "building", label: "Building", color: 0xb08050, icon: "🏛️" },
  { id: "city", label: "City", color: 0xc08a4a, icon: "🏰" },
  { id: "village", label: "Village", color: 0xcfa15e, icon: "🏘️" },
  { id: "character", label: "Character", color: 0xd98a5a, icon: "🐭" },
  { id: "animal", label: "Animal", color: 0x8a9a54, icon: "🦉" },
  { id: "plant", label: "Plant", color: 0x6fa050, icon: "🌿" },
  { id: "item", label: "Item", color: 0xb0894a, icon: "🎒" },
  { id: "resource", label: "Resource", color: 0x9a7a3a, icon: "🪵" },
  { id: "recipe", label: "Recipe", color: 0xc76f4a, icon: "🔨" },
  { id: "quest", label: "Quest", color: 0x9b6bd6, icon: "📜" },
  { id: "story", label: "Story", color: 0x8a5bd0, icon: "📖" },
  { id: "lore", label: "Lore", color: 0x7d6bd6, icon: "🌙" },
  { id: "mechanic", label: "Mechanic", color: 0x4aa0a8, icon: "⚙️" },
  { id: "timeline", label: "Timeline Event", color: 0xc0913a, icon: "⏳" },
  { id: "music", label: "Music", color: 0xcf6f9b, icon: "🎵" },
  { id: "concept-art", label: "Concept Art", color: 0xd06f6f, icon: "🎨" },
  { id: "dev-note", label: "Developer Note", color: 0x8b93a3, icon: "🗒️" },
];

export const SHELVES: readonly ShelfDef[] = [
  {
    id: "atlas",
    title: "The Atlas of the Great Forest",
    plain: "World & Regions",
    blurb: "Maps, biomes, and the lay of the land from root to canopy.",
    color: 0x5aa172,
    icon: "🗺️",
    categories: ["world", "region"],
  },
  {
    id: "builders",
    title: "The Builder's Compendium",
    plain: "Buildings, Cities & Villages",
    blurb: "Every burrow, hollow, hall, and settlement the mice have raised.",
    color: 0xb08050,
    icon: "🏛️",
    categories: ["building", "city", "village"],
  },
  {
    id: "folk",
    title: "Who's Who of the Hollow",
    plain: "Characters",
    blurb: "The mice, their families, guilds, and quarrels.",
    color: 0xd98a5a,
    icon: "🐭",
    categories: ["character"],
  },
  {
    id: "naturalist",
    title: "The Naturalist's Journal",
    plain: "Wildlife",
    blurb: "Beasts great and small — friends, foes, and the merely curious.",
    color: 0x8a9a54,
    icon: "🦉",
    categories: ["animal"],
  },
  {
    id: "herbarium",
    title: "The Everbough Herbarium",
    plain: "Plants & Flora",
    blurb: "Pressed leaves, blossoms, and the secrets of the green world.",
    color: 0x6fa050,
    icon: "🌿",
    categories: ["plant"],
  },
  {
    id: "forager",
    title: "The Forager's Index",
    plain: "Items & Resources",
    blurb: "What can be gathered, carried, and hoarded.",
    color: 0x9a7a3a,
    icon: "🎒",
    categories: ["item", "resource"],
  },
  {
    id: "guild",
    title: "The Guildmaster's Ledger",
    plain: "Crafting & Recipes",
    blurb: "Patterns and formulae, guarded by the crafting guild.",
    color: 0xc76f4a,
    icon: "🔨",
    categories: ["recipe"],
  },
  {
    id: "saga",
    title: "The Grand Saga",
    plain: "Story & Quests",
    blurb: "The unfolding tale and the errands that carry it forward.",
    color: 0x8a5bd0,
    icon: "📖",
    categories: ["story", "quest"],
  },
  {
    id: "moonkeepers",
    title: "The Chronicles of the Moonkeepers",
    plain: "Lore",
    blurb: "Myth, prophecy, and the old knowledge kept beneath the moon.",
    color: 0x7d6bd6,
    icon: "🌙",
    categories: ["lore"],
  },
  {
    id: "rules",
    title: "The Rules of the Realm",
    plain: "Gameplay & Mechanics",
    blurb: "How the world works, for those who shape it.",
    color: 0x4aa0a8,
    icon: "⚙️",
    categories: ["mechanic"],
  },
  {
    id: "scroll",
    title: "The Endless Scroll",
    plain: "Timeline",
    blurb: "Ages and events, from the First Sprout to the present day.",
    color: 0xc0913a,
    icon: "⏳",
    categories: ["timeline"],
  },
  {
    id: "portfolio",
    title: "The Illuminated Portfolio",
    plain: "Art Bible & Music",
    blurb: "Concept art, colour, and the sounds of the forest.",
    color: 0xd06f6f,
    icon: "🎨",
    categories: ["concept-art", "music"],
  },
  {
    id: "keeper",
    title: "The Keeper's Ledger of Truth",
    plain: "Canon Log & Dev Notes",
    blurb: "What is settled, what is questioned, and what was set aside.",
    color: 0x8b93a3,
    icon: "🗒️",
    categories: ["dev-note"],
  },
];

export const CANON_STATUSES: readonly CanonStatusDef[] = [
  { id: "canon", label: "Canon" },
  { id: "review", label: "Needs Review" },
  { id: "removed", label: "Removed" },
  { id: "draft", label: "Draft" },
];

// ---- Lookups ----
const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));
const shelfById = new Map(SHELVES.map((s) => [s.id, s]));
const shelfByCategory = new Map<CategoryId, ShelfDef>();
for (const shelf of SHELVES) {
  for (const cat of shelf.categories) {
    if (!shelfByCategory.has(cat)) shelfByCategory.set(cat, shelf);
  }
}

export function getCategory(id: CategoryId): CategoryDef {
  return categoryById.get(id) ?? CATEGORIES[CATEGORIES.length - 1];
}
export function getShelf(id: string): ShelfDef | undefined {
  return shelfById.get(id);
}
/** Which shelf a page of this category lives on. */
export function shelfForCategory(id: CategoryId): ShelfDef | undefined {
  return shelfByCategory.get(id);
}
export function canonLabel(status: CanonStatus): string {
  return CANON_STATUSES.find((s) => s.id === status)?.label ?? status;
}
