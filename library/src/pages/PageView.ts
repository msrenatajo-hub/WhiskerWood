import type { Page } from "@/types";
import type { Codex } from "@/data/Codex";
import { getCategory, shelfForCategory } from "@/data/registry";
import { el } from "@/utils/dom";
import { canonBadge } from "@/components/CanonBadge";
import { renderContent } from "@/components/Content";

/** Format an ISO date as a short human date. */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** A relationship / backlink row that navigates on click. */
function relRow(page: Page, kind: string | undefined, onOpen: (id: string) => void): HTMLElement {
  const cat = getCategory(page.category);
  return el("div", { class: "rel", onclick: () => onOpen(page.id) }, [
    el("span", {}, cat.icon),
    el("div", {}, [
      kind ? el("div", { class: "rel__kind" }, kind) : null,
      el("div", { class: "rel__title" }, page.title),
    ]),
  ]);
}

/**
 * Builds the full `.page` article for a Codex entry: a main column (header +
 * long-form content) and an aside rail (relationships, backlinks, tags, and
 * metadata). Per-category variations can branch here later.
 */
export function renderPage(page: Page, codex: Codex, onOpen: (id: string) => void): HTMLElement {
  const cat = getCategory(page.category);
  const shelf = shelfForCategory(page.category);
  const labelFor = (id: string): string | undefined => codex.get(id)?.title;

  // Drop a leading "# Title" — the title is shown in the header already.
  const body = renderContent(page.content.replace(/^\s*#\s+.*\n?/, ""), labelFor);

  const header = el("header", { class: "page__header" }, [
    el("div", { class: "page__eyebrow" }, `${cat.icon} ${cat.label}${shelf ? " · " + shelf.title : ""}`),
    el("h1", { class: "page__title" }, page.title),
    page.summary ? el("p", { class: "page__summary" }, page.summary) : null,
    el("div", { class: "page__badges" }, [canonBadge(page.status)]),
  ]);

  const relations = codex.relationsOf(page.id);
  const backlinks = codex.backlinks(page.id).filter((b) => !relations.some((r) => r.page.id === b.id));

  const aside = el("aside", { class: "page__aside" }, [
    relations.length
      ? el("div", { class: "aside-block" }, [
          el("h4", {}, "Connections"),
          ...relations.map((r) => relRow(r.page, r.kind, onOpen)),
        ])
      : null,
    backlinks.length
      ? el("div", { class: "aside-block" }, [
          el("h4", {}, "Referenced by"),
          ...backlinks.map((b) => relRow(b, undefined, onOpen)),
        ])
      : null,
    page.tags.length
      ? el("div", { class: "aside-block" }, [
          el("h4", {}, "Tags"),
          el("div", { class: "tags" }, page.tags.map((t) => el("span", { class: "tag" }, t))),
        ])
      : null,
    el("div", { class: "aside-block" }, [
      el("h4", {}, "Details"),
      el("div", { class: "meta-list" }, [
        metaRow("Version", `v${page.version}`),
        metaRow("Author", page.author),
        metaRow("Modified", fmtDate(page.modified)),
        page.timeline ? metaRow("Era", `${page.timeline.era} · yr ${page.timeline.year}`) : null,
        page.coordinates ? metaRow("Location", `${page.coordinates.x}, ${page.coordinates.z ?? page.coordinates.y}`) : null,
      ]),
    ]),
    page.notes
      ? el("div", { class: "aside-block" }, [el("h4", {}, "Keeper's note"), el("p", { class: "card__summary" }, page.notes)])
      : null,
  ]);

  return el("div", { class: "page scroll" }, [el("div", { class: "page__main" }, [header, body]), aside]);
}

function metaRow(k: string, v: string): HTMLElement {
  return el("div", {}, [el("span", {}, k), el("b", {}, v)]);
}
