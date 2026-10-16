import type { Page } from "./page";

/**
 * The application-wide event contract. The 3D engine, the UI overlays, and the
 * router all communicate through a single typed bus (see utils/events + App),
 * so nothing reaches across modules directly.
 */
export interface AppEvents {
  /** A bookshelf was activated (clicked in 3D or navigated to). */
  "shelf:open": { shelfId: string };
  /** Open a specific page in the viewer. */
  "page:open": { pageId: string };
  /** Request the search panel be shown. */
  "search:open": undefined;
  /** The live search query changed (drives shelf glow in 3D). */
  "search:query": { q: string; matchedShelfIds: string[] };
  /** Close whatever overlay is currently open. */
  "overlay:close": undefined;
  /** The data store changed (page added/edited/removed). */
  "data:change": { pages: Page[] };
}
