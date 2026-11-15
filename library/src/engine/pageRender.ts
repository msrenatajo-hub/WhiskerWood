/**
 * Renders book content onto parchment page canvases. Blocks (title, headings,
 * paragraphs, list items…) flow across as many pages as needed — "as much as
 * fits on a page" — and the Book3D shows two pages per spread.
 */

export type BlockType = "title" | "h2" | "h3" | "p" | "li" | "quote" | "small" | "break";
export interface Block {
  type: BlockType;
  text: string;
  /** The Codex page this block belongs to (so a shelf volume knows which
   *  entry the reader is looking at — powers "Edit this book"). */
  pageId?: string;
}

const W = 1024;
const H = 1408;
const MX = 116; // side margins
const MT = 132; // top margin
const MB = 128; // bottom margin

interface Style {
  font: string;
  lh: number; // line height in px
  color: string;
  gap: number; // extra space before the block
  center?: boolean;
  bullet?: boolean;
}

const SERIF = "Georgia, 'Times New Roman', serif";
const STYLES: Record<Exclude<BlockType, "break">, Style> = {
  title: { font: `bold 76px ${SERIF}`, lh: 88, color: "#33261a", gap: 26, center: true },
  h2: { font: `bold 52px ${SERIF}`, lh: 66, color: "#4a3520", gap: 38 },
  h3: { font: `bold 44px ${SERIF}`, lh: 58, color: "#553d28", gap: 30 },
  p: { font: `38px ${SERIF}`, lh: 54, color: "#3a2c1e", gap: 18 },
  li: { font: `38px ${SERIF}`, lh: 52, color: "#3a2c1e", gap: 6, bullet: true },
  quote: { font: `italic 40px ${SERIF}`, lh: 56, color: "#6d5a45", gap: 20, center: true },
  small: { font: `30px ${SERIF}`, lh: 42, color: "#8a7357", gap: 14, center: true },
};

interface Line {
  text: string;
  style: Style;
  gap: number; // applied before this line
  /** Per-word red flags — words wrapped in ~~…~~ are "to be removed". */
  redFlags?: boolean[];
  /** Per-word glow flags — words that matched the reader's search. */
  glowFlags?: boolean[];
}

/** Lowercase a word and shed punctuation, for search-glow matching. */
function bareWord(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "");
}

/**
 * Split a block's text into words, tracking the ~~red marker~~ state
 * character by character — so `~~like this~~.` or `(~~this~~)` behaves,
 * with punctuation touching the markers, mid-word marks, all of it.
 */
function redTokens(text: string): { word: string; red: boolean }[] {
  const out: { word: string; red: boolean }[] = [];
  let red = false;
  let word = "";
  let wordRed = false;
  const push = (): void => {
    if (word) out.push({ word, red: wordRed });
    word = "";
    wordRed = false;
  };
  for (let i = 0; i < text.length; i++) {
    if (text.startsWith("~~", i)) {
      red = !red;
      i++; // skip the second ~
      continue;
    }
    if (/\s/.test(text[i])) {
      push();
      continue;
    }
    word += text[i];
    if (red) wordRed = true; // a word touching a mark counts as marked
  }
  push();
  return out;
}

/** Word-wrap one block into lines that fit the page column. */
function wrap(ctx: CanvasRenderingContext2D, block: Block, glow?: Set<string>): Line[] {
  const style = STYLES[block.type as Exclude<BlockType, "break">];
  ctx.font = style.font;
  const maxW = W - MX * 2 - (style.bullet ? 44 : 0);
  const tokens = redTokens(block.text);
  const lines: Line[] = [];
  let line = "";
  let flags: boolean[] = [];
  let glows: boolean[] = [];
  const push = (): void => {
    lines.push({
      text: line,
      style,
      gap: lines.length === 0 ? style.gap : 0,
      redFlags: flags.some(Boolean) ? flags : undefined,
      glowFlags: glows.some(Boolean) ? glows : undefined,
    });
  };
  const glowing = (w: string): boolean => {
    if (!glow || glow.size === 0) return false;
    const bare = bareWord(w);
    if (glow.has(bare)) return true;
    for (const g of glow) if (bare.length > 3 && bare.includes(g)) return true;
    return false;
  };
  for (const { word, red } of tokens) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      push();
      line = word;
      flags = [red];
      glows = [glowing(word)];
    } else {
      line = test;
      flags.push(red);
      glows.push(glowing(word));
    }
  }
  if (line) push();
  return lines;
}

/** Draw a line word-by-word: red for ~~marked~~ words, gold for search hits. */
function fillMarkedLine(ctx: CanvasRenderingContext2D, line: Line, baseline: number): void {
  const words = line.text.split(" ");
  const reds = line.redFlags ?? [];
  const glows = line.glowFlags ?? [];
  const lh = line.style.lh;
  let x = line.style.center
    ? (W - ctx.measureText(line.text).width) / 2
    : MX + (line.style.bullet ? 44 : 0);
  ctx.textAlign = "left";
  for (let i = 0; i < words.length; i++) {
    const chunk = words[i] + (i < words.length - 1 ? " " : "");
    const cw = ctx.measureText(chunk).width;
    if (reds[i]) {
      // the Keeper's red highlighter: "this is to be REMOVED"
      ctx.fillStyle = "rgba(228, 62, 45, 0.30)";
      ctx.fillRect(x - 3, baseline - lh * 0.62, cw + 6, lh * 0.86);
      ctx.fillStyle = "#8a1f16";
    } else if (glows[i]) {
      // ✨ a word the reader searched for — lit like lantern-light
      ctx.save();
      ctx.shadowColor = "rgba(255, 190, 40, 0.95)";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "rgba(255, 204, 74, 0.55)";
      ctx.fillRect(x - 4, baseline - lh * 0.64, cw + 8, lh * 0.9);
      ctx.fillRect(x - 4, baseline - lh * 0.64, cw + 8, lh * 0.9);
      ctx.restore();
      ctx.fillStyle = "#6b4a00";
    } else {
      ctx.fillStyle = line.style.color;
    }
    ctx.fillText(words[i], x, baseline);
    x += cw;
  }
}

/** Paint the parchment background, aged edges, and page number. */
function paintPage(ctx: CanvasRenderingContext2D, pageNo: number): void {
  ctx.fillStyle = "#f8efd9";
  ctx.fillRect(0, 0, W, H);
  const edgeH = ctx.createLinearGradient(0, 0, W, 0);
  edgeH.addColorStop(0, "rgba(90,61,38,0.10)");
  edgeH.addColorStop(0.06, "rgba(90,61,38,0)");
  edgeH.addColorStop(0.94, "rgba(90,61,38,0)");
  edgeH.addColorStop(1, "rgba(90,61,38,0.10)");
  ctx.fillStyle = edgeH;
  ctx.fillRect(0, 0, W, H);
  const edgeV = ctx.createLinearGradient(0, 0, 0, H);
  edgeV.addColorStop(0, "rgba(90,61,38,0.08)");
  edgeV.addColorStop(0.05, "rgba(90,61,38,0)");
  edgeV.addColorStop(0.95, "rgba(90,61,38,0)");
  edgeV.addColorStop(1, "rgba(90,61,38,0.10)");
  ctx.fillStyle = edgeV;
  ctx.fillRect(0, 0, W, H);
  // a few fibre flecks so the paper doesn't look sterile
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(120,90,60,${0.03 + Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  ctx.font = `28px ${SERIF}`;
  ctx.fillStyle = "#8a7357";
  ctx.textAlign = "center";
  ctx.fillText(String(pageNo), W / 2, H - 56);
  ctx.textAlign = "left";
}

/**
 * Flow blocks into as many page canvases as needed. `break` blocks force a new
 * page (used between chapters in a section book). Always returns an even count
 * so the last spread has a right-hand page.
 */
export function renderBookPages(blocks: Block[], glowWords?: string[]): HTMLCanvasElement[] {
  const measure = document.createElement("canvas").getContext("2d")!;
  const glow = glowWords?.length
    ? new Set(glowWords.map(bareWord).filter((w) => w.length > 1))
    : undefined;
  const pages: Line[][] = [[]];
  const owners: (string | undefined)[] = []; // which Codex page owns each canvas
  let y = MT;

  const newPage = (): void => {
    if (pages[pages.length - 1].length > 0) {
      pages.push([]);
      y = MT;
    }
  };

  for (const block of blocks) {
    if (block.type === "break") {
      newPage();
      continue;
    }
    const lines = wrap(measure, block, glow);
    const isHeading = block.type === "title" || block.type === "h2" || block.type === "h3";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const current = (): Line[] => pages[pages.length - 1];
      let gap = current().length === 0 ? 0 : line.gap;
      let need = gap + line.style.lh;
      // keep a heading attached to at least one line of what follows it
      if (isHeading && i === 0) need += STYLES.p.lh;
      if (y + need > H - MB) {
        newPage();
        gap = 0;
      }
      current().push({ ...line, gap });
      if (block.pageId && owners[pages.length - 1] == null) owners[pages.length - 1] = block.pageId;
      y += gap + line.style.lh;
    }
  }

  // Render every page to a canvas.
  const canvases = pages.map((lines, pi) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    paintPage(ctx, pi + 1);
    let yy = MT;
    for (const line of lines) {
      yy += line.gap;
      ctx.font = line.style.font;
      ctx.fillStyle = line.style.color;
      const baseline = yy + line.style.lh * 0.72;
      if (line.redFlags || line.glowFlags) {
        fillMarkedLine(ctx, line, baseline);
        if (line.style.bullet) {
          ctx.fillStyle = line.style.color;
          ctx.fillText("\u2022", MX + 6, baseline);
        }
      } else if (line.style.center) {
        ctx.textAlign = "center";
        ctx.fillText(line.text, W / 2, baseline, W - MX * 2);
        ctx.textAlign = "left";
      } else if (line.style.bullet) {
        ctx.fillText("•", MX + 6, baseline);
        ctx.fillText(line.text, MX + 44, baseline, W - MX * 2 - 44);
      } else {
        ctx.fillText(line.text, MX, baseline, W - MX * 2);
      }
      yy += line.style.lh;
    }
    if (owners[pi]) canvas.dataset.ownerPageId = owners[pi];
    return canvas;
  });

  // Pad to an even page count with a decorated end page.
  if (canvases.length % 2 === 1) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    paintPage(ctx, canvases.length + 1);
    ctx.font = `64px ${SERIF}`;
    ctx.fillStyle = "#c9b38a";
    ctx.textAlign = "center";
    ctx.fillText("❦", W / 2, H / 2);
    ctx.textAlign = "left";
    canvases.push(canvas);
  }
  return canvases;
}
