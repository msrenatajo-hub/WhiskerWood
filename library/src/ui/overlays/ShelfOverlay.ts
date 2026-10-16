import type { Codex } from "@/data/Codex";
import { getShelf } from "@/data/registry";
import { el, clear } from "@/utils/dom";
import { pageCard } from "@/components/Card";

/**
 * The shelf (section) index: a titled header + a grid of book cards for every
 * page that lives on this shelf.
 */
export class ShelfOverlay {
  private root: HTMLElement;

  constructor(mount: HTMLElement, private codex: Codex, private onOpen: (id: string) => void) {
    this.root = el("div", { class: "shelf-overlay" });
    mount.append(this.root);
  }

  open(shelfId: string): void {
    const shelf = getShelf(shelfId);
    clear(this.root);
    if (!shelf) return;

    const pages = this.codex.byShelf(shelfId);
    const head = el("div", { class: "shelf-head" }, [
      el("div", { class: "shelf-head__eyebrow" }, shelf.plain),
      el("h1", { class: "shelf-head__title" }, shelf.title),
      el("p", { class: "shelf-head__blurb" }, shelf.blurb),
    ]);

    const grid = el(
      "div",
      { class: "book-grid scroll" },
      pages.length
        ? pages.map((p) => pageCard(p, this.onOpen))
        : [el("p", { class: "search__empty" }, "This shelf is still waiting to be written.")]
    );

    this.root.append(head, grid);
    requestAnimationFrame(() => this.root.classList.add("is-open"));
  }

  close(): void {
    this.root.classList.remove("is-open");
  }
}
