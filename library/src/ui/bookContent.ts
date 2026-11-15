import type { Page } from "@/types";
import type { ShelfDef } from "@/types/category";
import type { Codex } from "@/data/Codex";
import { getCategory, canonLabel } from "@/data/registry";
import type { Block } from "@/engine/pageRender";

/**
 * Composes Codex pages into book blocks for the 3D book. Markdown is flattened
 * to plain prose (canvas pages can't do inline styling), and `[[links]]` are
 * resolved to page titles.
 */

function stripInline(text: string, codex: Codex): string {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_m, _id, label: string) => label)
    .replace(/\[\[([^\]]+)\]\]/g, (_m, id: string) => codex.get(id.trim())?.title ?? id.trim())
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    // "The [[moonkeepers]]" resolving to "The The Moonkeepers" reads twice
    .replace(/\b(the)\s+The\b/g, "$1");
}

/** Parse a page's markdown-ish content into flat book blocks. */
function contentBlocks(md: string, codex: Codex): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r/g, "").split("\n");
  let i = 0;
  let para: string[] = [];

  const flush = (): void => {
    if (para.length) {
      blocks.push({ type: "p", text: stripInline(para.join(" "), codex) });
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      flush();
      i++;
      continue;
    }
    // pipe table -> bullet lines
    const isRow = /^\s*\|.*\|\s*$/.test(line);
    const sepNext =
      i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-");
    if (isRow && sepNext) {
      flush();
      i += 2; // skip header + separator; the rows carry the information
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => stripInline(c.trim(), codex))
          .filter(Boolean);
        blocks.push({ type: "li", text: cells.join(" — ") });
        i++;
      }
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: heading[1].length >= 3 ? "h3" : "h2", text: stripInline(heading[2], codex) });
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      blocks.push({ type: "quote", text: stripInline(line.replace(/^>\s?/, ""), codex) });
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      flush();
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        blocks.push({
          type: "li",
          text: stripInline(lines[i].replace(/^\s*[-*]\s+/, "").replace(/^\s*\d+\.\s+/, ""), codex),
        });
        i++;
      }
      continue;
    }
    para.push(line);
    i++;
  }
  flush();
  return blocks;
}

/** The blocks for a single entry's book (title page + body + connections). */
export function pageBlocks(page: Page, codex: Codex): Block[] {
  const cat = getCategory(page.category);
  const blocks: Block[] = [
    { type: "title", text: page.title },
    { type: "small", text: `${cat.label} · ${canonLabel(page.status)} · v${page.version} · ${page.author}` },
  ];
  if (page.summary) blocks.push({ type: "quote", text: page.summary });

  const body = page.content.replace(/^\s*#\s+.*\n?/, ""); // title already shown
  blocks.push(...contentBlocks(body, codex));

  const rels = codex.relationsOf(page.id);
  if (rels.length) {
    blocks.push({ type: "h3", text: "Connections" });
    for (const r of rels) blocks.push({ type: "li", text: `${r.page.title}${r.kind ? ` — ${r.kind}` : ""}` });
  }
  const backlinks = codex.backlinks(page.id).filter((b) => !rels.some((r) => r.page.id === b.id));
  if (backlinks.length) {
    blocks.push({ type: "h3", text: "Referenced by" });
    for (const b of backlinks) blocks.push({ type: "li", text: b.title });
  }
  if (page.tags.length) blocks.push({ type: "small", text: "Tags: " + page.tags.join(", ") });
  // every block remembers its entry, so shelf volumes know what's on screen
  return blocks.map((b) => ({ ...b, pageId: page.id }));
}

/** The blocks for a whole section's book: cover page, contents, then chapters. */
export function shelfBlocks(shelf: ShelfDef, pages: Page[], codex: Codex): Block[] {
  const blocks: Block[] = [
    { type: "title", text: shelf.title },
    { type: "small", text: shelf.plain },
    { type: "quote", text: shelf.blurb },
  ];
  if (pages.length === 0) {
    blocks.push({ type: "p", text: "This volume is still waiting to be written." });
    return blocks;
  }
  blocks.push({ type: "h2", text: "Contents" });
  for (const p of pages) blocks.push({ type: "li", text: p.title });
  for (const p of pages) {
    blocks.push({ type: "break", text: "" });
    blocks.push(...pageBlocks(p, codex));
  }
  return blocks;
}
