import type { CanonStatus } from "@/types";
import { canonLabel } from "@/data/registry";
import { el } from "@/utils/dom";

/** The colored canon-status pill (Canon / Needs Review / Removed / Draft). */
export function canonBadge(status: CanonStatus): HTMLElement {
  return el("span", { class: `badge badge--${status}` }, canonLabel(status));
}
