import type { CategoryId, CanonStatus } from "./page";

/** Presentation metadata for a page category (color, icon, label). */
export interface CategoryDef {
  id: CategoryId;
  /** Plain English label, e.g. "Region". */
  label: string;
  /** Accent color (hex int) used for spines and badges. */
  color: number;
  /** Emoji/icon for 2D UI. */
  icon: string;
}

/**
 * A shelf is a piece of library furniture and a navigation grouping. It carries
 * the *in-world* name ("The Atlas of the Great Forest") and gathers one or more
 * page categories.
 */
export interface ShelfDef {
  id: string;
  /** In-world book/section name shown on the carved plaque. */
  title: string;
  /** Plain descriptor for search/tooltips, e.g. "Regions & the World". */
  plain: string;
  /** Flavor text shown on the section header. */
  blurb: string;
  /** Accent color (hex int). */
  color: number;
  /** Emoji/icon for 2D UI. */
  icon: string;
  /** Page categories that live on this shelf. */
  categories: CategoryId[];
}

/** Human-readable labels + colors for canon status badges. */
export interface CanonStatusDef {
  id: CanonStatus;
  label: string;
}
