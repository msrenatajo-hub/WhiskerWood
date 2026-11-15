import type { Page } from "@/types";

/**
 * Storage abstraction. The app talks only to this interface, never to
 * localStorage directly — so a networked backend (`HttpStore`) can be dropped in
 * later without touching the UI or the Codex service.
 */
export interface DataStore {
  /** Load every page (used to hydrate the in-memory Codex on boot). */
  all(): Promise<Page[]>;
  get(id: string): Promise<Page | undefined>;
  /** Insert or update a page by id. */
  save(page: Page): Promise<void>;
  remove(id: string): Promise<void>;
  /** Replace the entire contents (used for seeding + JSON import). */
  bulkLoad(pages: Page[]): Promise<void>;
  clear(): Promise<void>;
}
