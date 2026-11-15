/**
 * Hash-based routing. Deep-linkable and back-button friendly:
 *   #/                 the library overview
 *   #/shelf/atlas      a shelf (section) index
 *   #/page/pine-forest a single page
 *   #/search           the search panel
 */
export type Route =
  | { name: "library" }
  | { name: "shelf"; shelfId: string }
  | { name: "page"; pageId: string }
  | { name: "search" };

export class Router {
  constructor(private onChange: (route: Route) => void) {
    window.addEventListener("hashchange", () => this.onChange(this.parse()));
  }

  parse(): Route {
    const hash = location.hash.replace(/^#\/?/, "");
    const [seg, arg] = hash.split("/");
    if (seg === "shelf" && arg) return { name: "shelf", shelfId: arg };
    if (seg === "page" && arg) return { name: "page", pageId: decodeURIComponent(arg) };
    if (seg === "search") return { name: "search" };
    return { name: "library" };
  }

  /** Emit the current route (call once on boot). */
  start(): void {
    this.onChange(this.parse());
  }

  private hashFor(route: Route): string {
    switch (route.name) {
      case "shelf":
        return `#/shelf/${route.shelfId}`;
      case "page":
        return `#/page/${encodeURIComponent(route.pageId)}`;
      case "search":
        return "#/search";
      default:
        return "#/";
    }
  }

  navigate(route: Route): void {
    const hash = this.hashFor(route);
    if (location.hash === hash) this.onChange(route); // re-fire (e.g. re-open)
    else location.hash = hash;
  }
}
