import type { Page } from "@/types";
import type { Codex } from "@/data/Codex";
import { getCategory } from "@/data/registry";
import { el, clear } from "@/utils/dom";

/**
 * The search crystal's panel. Typing filters every page instantly, grouped by
 * category; the matched shelves are reported via `onQuery` so the 3D scene can
 * make those bookshelves glow. Enter opens the top hit.
 */
export class SearchOverlay {
  private root: HTMLElement;
  private input: HTMLInputElement;
  private resultsEl: HTMLElement;
  private top: string | null = null;

  constructor(
    mount: HTMLElement,
    private codex: Codex,
    private onOpen: (id: string) => void,
    private onQuery: (q: string, shelfIds: string[]) => void
  ) {
    this.input = el("input", {
      type: "text",
      placeholder: "Search the whole library…",
      spellcheck: false,
      oninput: () => this.update(),
      onkeydown: (e) => {
        if ((e as KeyboardEvent).key === "Enter" && this.top) this.onOpen(this.top);
      },
    }) as HTMLInputElement;

    this.resultsEl = el("div", { class: "search__results scroll" });
    this.root = el("div", { class: "search" }, [
      el("div", { class: "search__head" }, [
        el("div", { class: "search__field" }, [el("span", {}, "🔍"), this.input]),
      ]),
      this.resultsEl,
    ]);
    mount.append(this.root);
  }

  open(): void {
    this.root.classList.add("is-open");
    this.update();
    setTimeout(() => this.input.focus(), 60);
  }

  close(): void {
    this.root.classList.remove("is-open");
  }

  private update(): void {
    const q = this.input.value.trim();
    let pages: Page[];
    let shelfIds: string[] = [];
    if (q) {
      const res = this.codex.search(q);
      pages = res.results.map((r) => r.page);
      shelfIds = res.shelfIds;
    } else {
      pages = this.codex.all().sort((a, b) => a.title.localeCompare(b.title));
    }
    this.onQuery(q, shelfIds);
    this.render(pages, q);
  }

  private render(pages: Page[], q: string): void {
    clear(this.resultsEl);
    this.top = pages[0]?.id ?? null;
    if (pages.length === 0) {
      this.resultsEl.append(el("div", { class: "search__empty" }, `Nothing found for “${q}”.`));
      return;
    }
    // group by category, preserving rank order of first appearance
    const groups = new Map<string, Page[]>();
    for (const p of pages) {
      const label = getCategory(p.category).label;
      (groups.get(label) ?? groups.set(label, []).get(label)!).push(p);
    }
    for (const [label, list] of groups) {
      this.resultsEl.append(el("div", { class: "result-group__label" }, label));
      for (const p of list) {
        this.resultsEl.append(
          el("div", { class: "result", onclick: () => this.onOpen(p.id) }, [
            el("div", { class: "result__title" }, p.title),
            el("div", { class: "result__summary" }, p.summary),
          ])
        );
      }
    }
  }
}
