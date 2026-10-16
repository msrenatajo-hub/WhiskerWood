import { el, escapeHtml } from "@/utils/dom";

/**
 * A tiny markdown dialect renderer, enough for Codex pages: headings, lists,
 * tables, blockquotes, bold/italic/code, external `[text](url)` links, and
 * internal `[[page-id]]` / `[[page-id|label]]` links (rendered as anchors with
 * `data-page`, which the page viewer wires up for navigation).
 */

/** Resolve a page id to a display label (its title) for `[[bare]]` links. */
export type LabelResolver = (id: string) => string | undefined;

function inline(raw: string, labelFor: LabelResolver): string {
  let s = escapeHtml(raw);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // internal links: [[id]] or [[id|label]]
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, id: string, label?: string) => {
    const trimmed = id.trim();
    const text = label != null ? label : escapeHtml(labelFor(trimmed) ?? trimmed);
    return `<a class="ilink" data-page="${trimmed}">${text}</a>`;
  });
  // external links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/** Render a content string into a `.page__body` element. */
export function renderContent(md: string, labelFor: LabelResolver): HTMLElement {
  const root = el("div", { class: "page__body" });
  const lines = md.replace(/\r/g, "").split("\n");
  let i = 0;
  let para: string[] = [];

  const flush = (): void => {
    if (para.length) {
      root.append(el("p", { html: inline(para.join(" "), labelFor) }));
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

    // GFM-ish pipe table: header row, separator, then body rows.
    const isRow = /^\s*\|.*\|\s*$/.test(line);
    const sepNext = i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-");
    if (isRow && sepNext) {
      flush();
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const table = el("table", {}, [
        el("thead", {}, el("tr", {}, header.map((h) => el("th", { html: inline(h, labelFor) })))),
        el(
          "tbody",
          {},
          rows.map((r) => el("tr", {}, r.map((c) => el("td", { html: inline(c, labelFor) }))))
        ),
      ]);
      root.append(table);
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const tag = heading[1].length >= 3 ? "h3" : "h2";
      root.append(el(tag, { html: inline(heading[2], labelFor) }));
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flush();
      root.append(el("blockquote", { html: inline(line.replace(/^>\s?/, ""), labelFor) }));
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      root.append(el("ul", {}, items.map((it) => el("li", { html: inline(it, labelFor) }))));
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      root.append(el("ol", {}, items.map((it) => el("li", { html: inline(it, labelFor) }))));
      continue;
    }

    para.push(line);
    i++;
  }
  flush();
  return root;
}
