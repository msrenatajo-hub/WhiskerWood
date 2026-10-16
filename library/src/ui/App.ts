import type { AppEvents } from "@/types";
import { Emitter } from "@/utils/events";
import { el } from "@/utils/dom";
import { LocalJsonStore } from "@/data/store/LocalJsonStore";
import { Codex } from "@/data/Codex";
import { seedPages } from "@/data/sample/seed";
import { getShelf, shelfForCategory } from "@/data/registry";
import { Engine } from "@/engine/Engine";
import { Library } from "@/engine/Library";
import { renderBookPages } from "@/engine/pageRender";
import { pageBlocks, shelfBlocks } from "./bookContent";
import { Router, type Route } from "./Router";
import { SearchOverlay } from "./overlays/SearchOverlay";
import { EditorOverlay } from "./overlays/EditorOverlay";
import { installKeyboard } from "./keyboard";

/**
 * The application root. Routes now drive the *3D reading ritual*: a shelf or
 * page route summons a book (rendered to parchment canvases) from its shelf to
 * the reading desk. The search panel is the one HTML overlay left; clicking a
 * result summons that entry's own book.
 */
export class App {
  private bus = new Emitter<AppEvents>();
  private codex: Codex;
  private engine: Engine;
  private library: Library;
  private router: Router;

  private ui = document.getElementById("ui") as HTMLElement;
  private backdrop: HTMLElement;
  private searchOverlay: SearchOverlay;
  private editor: EditorOverlay;
  private editBtn!: HTMLElement;
  private backBtn!: HTMLElement;
  private walkHint!: HTMLElement;
  private readHint!: HTMLElement;
  private route: Route = { name: "library" };

  // the reading trail: every book you've opened, surviving close/reopen
  // (and even a page reload — it lives in localStorage)
  private trail: Route[] = [];
  private goingBack = false;
  private lastQuery = "";
  private pendingGlow: string[] | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.codex = new Codex(new LocalJsonStore(), this.bus);
    this.engine = new Engine(canvas);
    this.library = new Library(this.engine, this.bus);

    this.backdrop = el("div", {
      class: "backdrop",
      onclick: () => this.bus.emit("overlay:close", undefined),
    });
    this.ui.append(this.backdrop, this.buildHud());

    try {
      this.trail = JSON.parse(localStorage.getItem("gl-reading-trail") ?? "[]") as Route[];
    } catch {
      this.trail = [];
    }

    const open = (id: string): void => {
      // opened from search → the searched words will GLOW in the book
      this.pendingGlow = this.lastQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1);
      this.router.navigate({ name: "page", pageId: id });
    };
    this.searchOverlay = new SearchOverlay(this.ui, this.codex, open, (q, shelfIds) =>
      this.bus.emit("search:query", { q, matchedShelfIds: shelfIds })
    );

    // The Keeper's editor: save writes to the Codex and re-summons the book so
    // the change is visible on its pages immediately.
    this.editor = new EditorOverlay(this.ui);
    this.editor.onSave = (page) => {
      void this.codex.save(page).then(() => {
        this.editor.close();
        this.router.navigate({ name: "page", pageId: page.id });
      });
    };
    this.editor.onDelete = (pageId) => {
      void this.codex.remove(pageId).then(() => {
        this.editor.close();
        this.router.navigate({ name: "library" });
      });
    };
    // When the editor closes for any reason, hand the scene back per route.
    this.editor.onClose = () => this.library.setPickingEnabled(this.route.name === "library");

    this.router = new Router((r) => this.applyRoute(r));
    this.wireBus();
    installKeyboard(this.bus);

    // Dev-only handle so tooling can reach the scene/data for verification.
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).grandLibrary = this;
    }
  }

  /** Write the entire Codex to the project's data/codex.json (git-tracked). */
  private async saveToFile(btn: HTMLElement): Promise<void> {
    const original = "💾  Save";
    try {
      const res = await fetch("/api/save-codex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.codex.all(), null, 2),
      });
      btn.textContent = res.ok ? "✅  Saved to file" : "❌  Save failed";
    } catch {
      btn.textContent = "❌  Save failed";
    }
    setTimeout(() => (btn.textContent = original), 2200);
  }

  /** Open the Keeper's editor and freeze the 3D scene beneath it. */
  private openEditor(pageId: string | null): void {
    const page = pageId ? this.codex.get(pageId) ?? null : null;
    this.library.setPickingEnabled(false);
    this.editor.open(page);
  }

  /** Boot: hydrate data, start rendering, apply the initial route. */
  async start(): Promise<void> {
    await this.codex.init(seedPages);
    this.engine.start();
    this.router.start();
  }

  private wireBus(): void {
    this.bus.on("shelf:open", ({ shelfId }) => this.router.navigate({ name: "shelf", shelfId }));
    this.bus.on("page:open", ({ pageId }) => this.router.navigate({ name: "page", pageId }));
    this.bus.on("search:open", () => this.router.navigate({ name: "search" }));
    this.bus.on("search:query", ({ q, matchedShelfIds }) => {
      this.lastQuery = q;
      this.library.setSearchGlow(matchedShelfIds);
    });
    this.bus.on("overlay:close", () => {
      // Esc peels one layer at a time: first the editor, then the book/search.
      if (this.editor.isOpen) this.editor.close();
      else this.router.navigate({ name: "library" });
    });
  }

  private applyRoute(route: Route): void {
    this.route = route;
    this.searchOverlay.close();
    this.editor.close();
    const reading = route.name === "page" || route.name === "shelf";
    this.backdrop.classList.toggle("is-open", route.name === "search");
    this.library.setPickingEnabled(route.name === "library");
    this.walkHint.style.display = reading ? "none" : "";
    this.readHint.style.display = reading ? "" : "none";
    // No matter which book is open — an entry's own book OR a whole shelf
    // volume — the button always edits the book you're reading right now.
    this.editBtn.style.display = reading ? "" : "none";
    this.editBtn.textContent = "✏️  Edit this book";

    // The reading trail: remember every book opened (unless we're walking
    // BACK along the trail right now), and show ↩ when there's a "back".
    if (reading && !this.goingBack) {
      const top = this.trail[this.trail.length - 1];
      if (!top || JSON.stringify(top) !== JSON.stringify(route)) {
        this.trail.push(route);
        if (this.trail.length > 60) this.trail.shift();
        localStorage.setItem("gl-reading-trail", JSON.stringify(this.trail));
      }
    }
    this.goingBack = false;
    this.backBtn.style.display = reading && this.trail.length > 1 ? "" : "none";

    switch (route.name) {
      case "library":
        this.library.setSearchGlow([]);
        this.library.closeBook();
        break;
      case "shelf": {
        const shelf = getShelf(route.shelfId);
        if (!shelf) break;
        const pages = renderBookPages(shelfBlocks(shelf, this.codex.byShelf(route.shelfId), this.codex));
        this.library.openBook(pages, route.shelfId, shelf.color);
        break;
      }
      case "page": {
        const page = this.codex.get(route.pageId);
        if (!page) break;
        const shelf = shelfForCategory(page.category);
        const glow = this.pendingGlow;
        this.pendingGlow = null; // glow only on the book opened FROM search
        const canvases = renderBookPages(pageBlocks(page, this.codex), glow ?? undefined);
        this.library.openBook(canvases, shelf?.id, shelf ? shelf.color : 0x7a5230);
        break;
      }
      case "search":
        this.searchOverlay.open();
        break;
    }
  }

  private buildHud(): HTMLElement {
    this.walkHint = el("div", { class: "hud__hint" }, [
      el("b", {}, "Slide the mouse"),
      document.createTextNode(" toward the screen edge to look · "),
      el("b", {}, "WASD"),
      document.createTextNode(" to walk · click a "),
      el("b", {}, "shelf"),
      document.createTextNode(", the "),
      el("b", {}, "map"),
      document.createTextNode(", or a "),
      el("b", {}, "figurine"),
      document.createTextNode(" · "),
      el("b", {}, "/"),
      document.createTextNode(" to search"),
    ]);
    this.readHint = el("div", { class: "hud__hint", style: "display:none" }, [
      el("b", {}, "← →"),
      document.createTextNode(" turn the page · "),
      el("b", {}, "C"),
      document.createTextNode(" to close the book"),
    ]);
    // ✏️ appears while reading an entry's book; saving rewrites its pages.
    this.editBtn = el(
      "button",
      {
        class: "btn edit-fab",
        style: "display:none",
        onclick: () => {
          if (this.route.name === "page") {
            this.openEditor(this.route.pageId);
          } else if (this.route.name === "shelf") {
            // edit whichever entry the open spread is showing (falls back to
            // the shelf's first entry, then to a brand-new book)
            const id =
              this.library.currentPageId() ??
              this.codex.byShelf(this.route.shelfId)[0]?.id ??
              null;
            this.openEditor(id);
          }
        },
      },
      "✏️  Edit this book"
    );
    // ↩ walks back along the reading trail — even across close/reopen,
    // even across a page reload (the trail lives in localStorage).
    this.backBtn = el(
      "button",
      {
        class: "btn back-fab",
        style: "display:none",
        onclick: () => {
          if (this.trail.length < 2) return;
          this.trail.pop(); // leave the book we're on
          localStorage.setItem("gl-reading-trail", JSON.stringify(this.trail));
          this.goingBack = true;
          this.router.navigate(this.trail[this.trail.length - 1]);
        },
      },
      "↩  Back"
    );
    return el("div", { class: "hud" }, [
      el("div", { class: "hud__brand" }, [
        el("b", {}, "The Grand Library"),
        el("span", {}, "of Everbough"),
      ]),
      el("div", { class: "hud__search" }, [
        el(
          "button",
          {
            class: "btn new-fab",
            title: "Write the whole Codex into the project (data/codex.json)",
            onclick: (e) => void this.saveToFile(e.target as HTMLElement),
          },
          "💾  Save"
        ),
        document.createTextNode(" "),
        el(
          "button",
          {
            class: "btn new-fab",
            title: "Return every passage that was ever struck from the canon",
            onclick: (e) => void this.restoreStruck(e.target as HTMLElement),
          },
          "🕊  Bring back the struck"
        ),
        document.createTextNode(" "),
        el("button", { class: "btn new-fab", onclick: () => this.openEditor(null) }, "➕  New book"),
        document.createTextNode(" "),
        el("button", { class: "btn", onclick: () => this.bus.emit("search:open", undefined) }, "🔍  Search  /"),
      ]),
      this.walkHint,
      this.readHint,
      this.editBtn,
      this.backBtn,
    ]);
  }

  /**
   * 🕊 Undo every strike ever made: each page with a struck archive goes back
   * to how it read before its FIRST strike (red marks and all), and the
   * archive is emptied.
   */
  private async restoreStruck(btn: HTMLElement): Promise<void> {
    const original = btn.textContent ?? "";
    const struck = this.codex.all().filter((p) => p.struckHistory && p.struckHistory.length > 0);
    if (!struck.length) {
      btn.textContent = "Nothing was ever struck";
      setTimeout(() => (btn.textContent = original), 2200);
      return;
    }
    for (const p of struck) {
      await this.codex.save({
        ...p,
        content: p.struckHistory![0].before,
        struckHistory: undefined,
        modified: new Date().toISOString(),
        version: p.version + 1,
      });
    }
    btn.textContent = `✅ ${struck.length} book${struck.length > 1 ? "s" : ""} restored`;
    setTimeout(() => (btn.textContent = original), 2200);
    this.applyRoute(this.route); // re-render whatever book is open
  }
}
