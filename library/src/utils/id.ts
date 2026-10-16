/** ID + slug helpers. Slugs double as human-readable page ids for `[[links]]`. */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let counter = 0;
/** A short unique id, e.g. for attachments. Not cryptographically random. */
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
