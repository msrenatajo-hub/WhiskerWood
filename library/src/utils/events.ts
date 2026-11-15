/**
 * A tiny, fully-typed event bus. Given an event map (see {@link AppEvents}),
 * `on`/`emit` are checked so payloads always match their event name.
 */
export type Handler<T> = (payload: T) => void;

export class Emitter<Events> {
  private handlers = new Map<keyof Events, Set<Handler<unknown>>>();

  /** Subscribe. Returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((h) => (h as Handler<Events[K]>)(payload));
  }
}
