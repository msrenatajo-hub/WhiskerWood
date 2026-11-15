/**
 * The core data model. Every entry in the Library — a region, a mouse, a
 * recipe, a lore fragment — is a {@link Page}. Everything serializes to JSON.
 */

/** Canon lifecycle of a page, rendered as a colored badge. */
export type CanonStatus = "canon" | "review" | "removed" | "draft";

/** The page taxonomy (what a page *is*). Shelves group these for navigation. */
export type CategoryId =
  | "world"
  | "region"
  | "building"
  | "city"
  | "village"
  | "character"
  | "animal"
  | "plant"
  | "item"
  | "resource"
  | "recipe"
  | "quest"
  | "story"
  | "lore"
  | "mechanic"
  | "timeline"
  | "music"
  | "concept-art"
  | "dev-note";

/** A typed link from one page to another (drives the relationship graph). */
export interface Relationship {
  /** Target page id. */
  to: string;
  /** Semantic label, e.g. "located-in", "crafted-from", "member-of". */
  kind?: string;
}

/** An attached asset (image, map, future model preview, audio, external link). */
export interface Attachment {
  id: string;
  kind: "image" | "map" | "model" | "audio" | "link";
  url: string;
  caption?: string;
}

/** Where a place sits, so an interactive world map can be added later. */
export interface Coordinates {
  x: number;
  y: number;
  z?: number;
  /** Optional map id this coordinate belongs to (overworld, underground, …). */
  map?: string;
}

/** Timeline placement for events, grouped into eras. */
export interface TimelineInfo {
  era: string;
  /** In-world year. */
  year: number;
  /** Tie-break ordering within the same year. */
  order?: number;
}

/**
 * A single Codex page. `content` is a light markdown dialect (see
 * {@link renderContent}) with `[[page-id]]` internal links.
 */
export interface Page {
  id: string;
  title: string;
  category: CategoryId;
  status: CanonStatus;
  summary: string;
  content: string;
  tags: string[];
  related: Relationship[];
  attachments: Attachment[];
  coordinates?: Coordinates;
  timeline?: TimelineInfo;
  /** ISO 8601 timestamps. */
  created: string;
  modified: string;
  version: number;
  author: string;
  notes?: string;
  /** Snapshots of the content taken each time red marks were struck from
   *  the canon — so everything ever struck can be brought back. */
  struckHistory?: { before: string; when: string }[];
}

/** A partial page used when creating a new one; the store fills the rest. */
export type NewPage = Pick<Page, "title" | "category"> & Partial<Page>;
