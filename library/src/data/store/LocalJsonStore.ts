import type { Page } from "@/types";
import type { DataStore } from "./DataStore";

/**
 * Browser-local store: keeps pages in memory for fast reads and mirrors them to
 * localStorage as a single JSON blob. Also offers JSON import/export so the
 * whole Codex is portable (and a backend can later ingest the same shape).
 */
export class LocalJsonStore implements DataStore {
  private pages = new Map<string, Page>();
  private loaded = false;

  constructor(private readonly key = "everbough.codex.v1") {}

  private hydrate(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Page[];
      for (const p of parsed) this.pages.set(p.id, p);
    } catch (err) {
      console.warn("Codex: could not read saved data, starting fresh.", err);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify([...this.pages.values()]));
    } catch (err) {
      console.warn("Codex: could not persist data.", err);
    }
  }

  async all(): Promise<Page[]> {
    this.hydrate();
    return [...this.pages.values()];
  }

  async get(id: string): Promise<Page | undefined> {
    this.hydrate();
    return this.pages.get(id);
  }

  async save(page: Page): Promise<void> {
    this.hydrate();
    this.pages.set(page.id, page);
    this.persist();
  }

  async remove(id: string): Promise<void> {
    this.hydrate();
    this.pages.delete(id);
    this.persist();
  }

  async bulkLoad(pages: Page[]): Promise<void> {
    this.pages = new Map(pages.map((p) => [p.id, p]));
    this.loaded = true;
    this.persist();
  }

  async clear(): Promise<void> {
    this.pages.clear();
    this.persist();
  }

  /** Serialize the whole Codex to a JSON string (for download/backup). */
  exportJson(): string {
    this.hydrate();
    return JSON.stringify([...this.pages.values()], null, 2);
  }

  /** Load a JSON string produced by {@link exportJson}. */
  async importJson(json: string): Promise<void> {
    const pages = JSON.parse(json) as Page[];
    await this.bulkLoad(pages);
  }
}
