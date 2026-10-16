import type { Codex } from "@/data/Codex";
import { el, clear } from "@/utils/dom";
import { renderPage } from "@/pages/PageView";

/**
 * The page viewer: a modern article that slides up over the 3D scene. Internal
 * `[[links]]` and relationship rows navigate to other pages via `onOpen`.
 */
export class PageOverlay {
  private root: HTMLElement;

  constructor(
    mount: HTMLElement,
    private codex: Codex,
    private onOpen: (id: string) => void,
    private onClose: () => void
  ) {
    this.root = el("div", { class: "page-overlay" });
    mount.append(this.root);
  }

  open(pageId: string): void {
    const page = this.codex.get(pageId);
    clear(this.root);
    if (!page) {
      this.root.append(el("div", { class: "page" }, `Unknown page: ${pageId}`));
    } else {
      const article = renderPage(page, this.codex, this.onOpen);
      article.append(
        el("button", { class: "btn btn--icon page__close", title: "Close (Esc)", onclick: this.onClose }, "✕")
      );
      // Delegate clicks on internal content links.
      article.addEventListener("click", (e) => {
        const anchor = (e.target as HTMLElement).closest("a.ilink") as HTMLElement | null;
        if (anchor) {
          e.preventDefault();
          const id = anchor.getAttribute("data-page");
          if (id) this.onOpen(id);
        }
      });
      this.root.append(article);
    }
    requestAnimationFrame(() => this.root.classList.add("is-open"));
  }

  close(): void {
    this.root.classList.remove("is-open");
  }
}
