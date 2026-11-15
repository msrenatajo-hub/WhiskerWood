import type { Page, CategoryId, AppEvents } from "@/types";
import type { DataStore } from "./store/DataStore";
import type { Emitter } from "@/utils/events";
import { shelfForCategory, SHELVES } from "./registry";
import { nowIso } from "@/utils/id";

export interface SearchResult {
  page: Page;
  score: number;
}

/**
 * The Codex is the app's data brain. It keeps an in-memory index over a
 * {@link DataStore}, answers queries (by category, by shelf, search, relations),
 * and broadcasts `data:change` so the UI and 3D scene can react. The UI never
 * touches the store directly — it goes through here.
 */
export class Codex {
  private byId = new Map<string, Page>();

  constructor(
    private readonly store: DataStore,
    private readonly bus: Emitter<AppEvents>
  ) {}

  /**
   * Hydrate the Codex. Two sources are merged: the project's saved file
   * (/codex.json, git-tracked) and this browser's localStorage (working copy).
   * Where a page exists in both, the newer `modified` timestamp wins — so
   * shipped lore updates arrive without clobbering fresher in-app edits.
   * Falls back to the built-in sample seed only when both are empty.
   */
  async init(seed: () => Page[]): Promise<void> {
    const stored = await this.store.all();
    let filePages: Page[] = [];
    try {
      const res = await fetch("/codex.json");
      if (res.ok) filePages = (await res.json()) as Page[];
    } catch {
      /* no dev server / no file — localStorage only */
    }

    const merged = new Map<string, Page>();
    for (const p of filePages) merged.set(p.id, p);
    for (const p of stored) {
      const fromFile = merged.get(p.id);
      if (!fromFile || p.modified > fromFile.modified) merged.set(p.id, p);
    }

    let pages = [...merged.values()];
    if (pages.length === 0) pages = seed();
    await this.store.bulkLoad(pages);
    this.index(pages);
  }

  private index(pages: Page[]): void {
    this.byId = new Map(pages.map((p) => [p.id, p]));
    this.bus.emit("data:change", { pages });
  }

  all(): Page[] {
    return [...this.byId.values()];
  }
  get(id: string): Page | undefined {
    return this.byId.get(id);
  }
  byCategory(category: CategoryId): Page[] {
    return this.all().filter((p) => p.category === category);
  }
  /** Pages that belong on a given shelf (its categories), sorted by title. */
  byShelf(shelfId: string): Page[] {
    const shelf = SHELVES.find((s) => s.id === shelfId);
    if (!shelf) return [];
    const cats = new Set(shelf.categories);
    return this.all()
      .filter((p) => cats.has(p.category))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /** Outgoing relationships of a page, resolved to real pages. */
  relationsOf(id: string): { page: Page; kind?: string }[] {
    const page = this.get(id);
    if (!page) return [];
    const out: { page: Page; kind?: string }[] = [];
    for (const r of page.related) {
      const target = this.get(r.to);
      if (target) out.push({ page: target, kind: r.kind });
    }
    return out;
  }

  /** Pages that link *to* this page (incoming links / backlinks). */
  backlinks(id: string): Page[] {
    return this.all().filter((p) => p.related.some((r) => r.to === id));
  }

  /**
   * Substring search across title/summary/tags/content, lightly ranked (title
   * and tag hits weigh more than body hits). Also reports which shelves have a
   * match, so the 3D scene can make those bookshelves glow.
   */
  search(query: string): { results: SearchResult[]; shelfIds: string[] } {
    const q = query.trim().toLowerCase();
    if (!q) return { results: [], shelfIds: [] };
    const terms = q.split(/\s+/);
    const results: SearchResult[] = [];
    const shelfIds = new Set<string>();

    for (const page of this.all()) {
      const title = page.title.toLowerCase();
      const summary = page.summary.toLowerCase();
      const tags = page.tags.join(" ").toLowerCase();
      const body = page.content.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 10;
        if (tags.includes(t)) score += 6;
        if (summary.includes(t)) score += 4;
        if (body.includes(t)) score += 1;
      }
      if (score > 0) {
        results.push({ page, score });
        const shelf = shelfForCategory(page.category);
        if (shelf) shelfIds.add(shelf.id);
      }
    }
    results.sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title));
    return { results, shelfIds: [...shelfIds] };
  }

  /** Timeline pages grouped by era, each era ordered by year. */
  timelineByEra(): { era: string; events: Page[] }[] {
    const events = this.all().filter((p) => p.timeline);
    const byEra = new Map<string, Page[]>();
    for (const e of events) {
      const era = e.timeline!.era;
      (byEra.get(era) ?? byEra.set(era, []).get(era)!).push(e);
    }
    for (const list of byEra.values()) {
      list.sort(
        (a, b) =>
          a.timeline!.year - b.timeline!.year ||
          (a.timeline!.order ?? 0) - (b.timeline!.order ?? 0)
      );
    }
    return [...byEra.entries()].map(([era, ev]) => ({ era, events: ev }));
  }

  // ---- Mutations ----
  async save(page: Page): Promise<void> {
    page.modified = nowIso();
    await this.store.save(page);
    this.index(await this.store.all());
  }
  async remove(id: string): Promise<void> {
    await this.store.remove(id);
    this.index(await this.store.all());
  }
}
