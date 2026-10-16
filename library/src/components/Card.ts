import type { Page } from "@/types";
import { getCategory } from "@/data/registry";
import { el } from "@/utils/dom";
import { canonBadge } from "./CanonBadge";

const hex = (color: number): string => "#" + color.toString(16).padStart(6, "0");

/** A book-card for a page (used in the shelf index and search results). */
export function pageCard(page: Page, onOpen: (id: string) => void): HTMLElement {
  const cat = getCategory(page.category);
  const card = el(
    "button",
    {
      class: "card",
      style: `--accent:${hex(cat.color)}`,
      onclick: () => onOpen(page.id),
    },
    [
      el("div", { class: "card__row" }, [
        el("h3", { class: "card__title" }, page.title),
        canonBadge(page.status),
      ]),
      el("p", { class: "card__summary" }, page.summary),
      el("div", { class: "card__meta" }, `${cat.icon} ${cat.label}`),
    ]
  );
  return card;
}
