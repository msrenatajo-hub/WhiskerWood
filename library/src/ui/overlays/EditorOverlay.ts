import type { Page, CategoryId, CanonStatus } from "@/types";
import { CATEGORIES, CANON_STATUSES } from "@/data/registry";
import { el, clear } from "@/utils/dom";
import { slugify, nowIso } from "@/utils/id";

/**
 * The Keeper's writing desk: an in-app form for creating and editing Codex
 * pages. Opens over the reading view so you can see the book you're changing;
 * saving re-renders the book immediately.
 */
export class EditorOverlay {
  private root: HTMLElement;
  private openFlag = false;
  private editing: Page | null = null;

  /** Called with the finished page when the Keeper saves. */
  onSave: (page: Page) => void = () => {};
  /** Called when the Keeper deletes the page being edited. */
  onDelete: (id: string) => void = () => {};
  /** Called whenever the editor closes (so the app can re-enable the scene). */
  onClose: () => void = () => {};

  constructor(mount: HTMLElement) {
    this.root = el("div", { class: "editor" });
    mount.append(this.root);
  }

  get isOpen(): boolean {
    return this.openFlag;
  }

  /** Open for an existing page, or with `null` for a brand-new one. */
  open(page: Page | null): void {
    this.editing = page;
    clear(this.root);

    const field = (label: string, control: HTMLElement): HTMLElement =>
      el("div", { class: "field" }, [el("label", {}, label), control]);

    const title = el("input", { type: "text", value: page?.title ?? "", placeholder: "e.g. Roothaven" }) as HTMLInputElement;
    const category = el(
      "select",
      {},
      CATEGORIES.map((c) =>
        el("option", { value: c.id, selected: page?.category === c.id }, `${c.icon} ${c.label}`)
      )
    ) as HTMLSelectElement;
    const status = el(
      "select",
      {},
      CANON_STATUSES.map((s) =>
        el("option", { value: s.id, selected: (page?.status ?? "draft") === s.id }, s.label)
      )
    ) as HTMLSelectElement;
    const summary = el("input", {
      type: "text",
      value: page?.summary ?? "",
      placeholder: "One line that appears under the title",
    }) as HTMLInputElement;
    const tags = el("input", {
      type: "text",
      value: page?.tags.join(", ") ?? "",
      placeholder: "forest, sacred, night  (comma separated)",
    }) as HTMLInputElement;
    const content = el("textarea", {
      placeholder:
        "Write the page here.\n\n# headings, ## sections, - lists, > quotes all work.\nLink to other pages with [[page-id]] — e.g. [[pine-forest]].\nWrap words in ~~double tildes~~ to mark them RED (to be removed).",
    }) as HTMLTextAreaElement;
    content.value = page?.content ?? "";

    // 🖍 select words in the text, press this, and the book shows them
    // highlighted RED — the Keeper's mark for “this must go.”
    const marker = el(
      "button",
      {
        class: "btn",
        onclick: () => {
          const a = content.selectionStart;
          const b = content.selectionEnd;
          if (a === b) {
            content.focus();
            return;
          }
          // mark each selected LINE separately, so a multi-paragraph
          // selection can't leak red into the text after it
          const marked = content.value
            .slice(a, b)
            .split("\n")
            .map((ln) => (ln.trim() ? "~~" + ln + "~~" : ln))
            .join("\n");
          content.setRangeText(marked, a, b, "select");
          content.focus();
        },
      },
      "🖍 Mark selection for removal (shows RED in the book)"
    );

    // set just before a strike-save, so the snapshot rides along with it
    let strikeSnapshot: string | null = null;

    const save = (): void => {
      const t = title.value.trim();
      if (!t) {
        title.focus();
        return;
      }
      const now = nowIso();
      const history = [...(page?.struckHistory ?? [])];
      if (strikeSnapshot !== null) {
        history.push({ before: strikeSnapshot, when: now });
        strikeSnapshot = null;
      }
      const result: Page = {
        id: page?.id ?? slugify(t),
        title: t,
        category: category.value as CategoryId,
        status: status.value as CanonStatus,
        summary: summary.value.trim(),
        content: content.value,
        tags: tags.value.split(",").map((s) => s.trim()).filter(Boolean),
        related: page?.related ?? [],
        attachments: page?.attachments ?? [],
        coordinates: page?.coordinates,
        timeline: page?.timeline,
        created: page?.created ?? now,
        modified: now,
        version: (page?.version ?? 0) + 1,
        author: page?.author ?? "The Keeper",
        notes: page?.notes,
        struckHistory: history.length ? history : page?.struckHistory,
      };
      this.onSave(result);
    };

    // 🔥 everything marked red is deleted from the page and the book is
    // saved on the spot — struck from the canon, sealed immediately.
    // (A snapshot is archived first, so it can ALWAYS be brought back.)
    const strike = el(
      "button",
      {
        class: "btn btn--danger",
        onclick: () => {
          const before = content.value;
          let v = before.replace(/~~[\s\S]*?~~/g, "");
          v = v
            .split("\n")
            .map((ln) => ln.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trimEnd())
            .filter((ln) => !/^\s*[-*>]\s*$/.test(ln)) // drop emptied bullets/quotes
            .join("\n")
            .replace(/\n{3,}/g, "\n\n");
          if (v === before) {
            content.focus(); // nothing marked yet
            return;
          }
          strikeSnapshot = before;
          content.value = v;
          save();
        },
      },
      "🔥 Strike red marks from the canon"
    );

    const foot: HTMLElement[] = [];
    if (page) {
      foot.push(
        el(
          "button",
          {
            class: "btn btn--danger",
            onclick: () => {
              if (confirm(`Remove “${page.title}” from the library?`)) this.onDelete(page.id);
            },
          },
          "🗑 Delete"
        )
      );
    }
    foot.push(
      el("button", { class: "btn", onclick: () => this.close() }, "Cancel"),
      el("button", { class: "btn btn--primary", onclick: save }, "💾 Save to the library")
    );

    this.root.append(
      el("div", { class: "editor__card scroll" }, [
        el("div", { class: "editor__title" }, page ? `Editing: ${page.title}` : "A new book for the library"),
        field("Title", title),
        el("div", { class: "editor__row" }, [
          field("Category", category),
          field("Canon status", status),
        ]),
        field("Summary", summary),
        field("Tags", tags),
        field("The page itself", content),
        el("div", { class: "field" }, [marker, document.createTextNode(" "), strike]),
        el("div", { class: "editor__foot" }, foot),
      ])
    );

    this.openFlag = true;
    // The root element has lived in the DOM since construction, so adding the
    // class synchronously still animates — and never leaves the panel stuck
    // invisible (rAF can be throttled in background/headless tabs).
    this.root.classList.add("is-open");
    setTimeout(() => (page ? content : title).focus(), 80);
  }

  close(): void {
    if (!this.openFlag) return;
    this.openFlag = false;
    this.editing = null;
    this.root.classList.remove("is-open");
    this.onClose();
  }

  /** The page currently being edited (null when creating). */
  get target(): Page | null {
    return this.editing;
  }
}
