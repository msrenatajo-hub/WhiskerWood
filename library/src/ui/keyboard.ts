import type { AppEvents } from "@/types";
import type { Emitter } from "@/utils/events";

/**
 * Global keyboard shortcuts:
 *   /      open search   (⌘/Ctrl-K too)
 *   Esc    close the current overlay
 */
export function installKeyboard(bus: Emitter<AppEvents>): void {
  window.addEventListener("keydown", (e) => {
    const target = e.target as HTMLElement | null;
    const typing =
      !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if (e.key === "Escape") {
      bus.emit("overlay:close", undefined);
      return;
    }
    if (typing) return;
    if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      bus.emit("search:open", undefined);
    }
  });
}
