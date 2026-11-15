import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

// Read the whole POST body into a Buffer.
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

// Small dev-server add-ons so our editors can save things into the project.
export default defineConfig({
  // 🌸 the Idea Book saves into catalog.html — don't reload the page when it does
  server: { watch: { ignored: ["**/catalog.html"] } },
  plugins: [
    {
      name: "whiskerwood-save",
      // 🌸 when the Idea Book saves itself, don't reload the page out from under you
      handleHotUpdate({ file }) {
        if (file.endsWith("/catalog.html")) return [];
      },
      configureServer(server) {
        // The crafting cell editor saves here.
        server.middlewares.use("/api/save-cells", async (req, res, next) => {
          if (req.method !== "POST") return next();
          const body = (await readBody(req)).toString();
          try {
            JSON.parse(body);
            fs.writeFileSync(path.resolve("public/craft-cells.json"), body);
            res.statusCode = 200;
            res.end('{"ok":true}');
          } catch {
            res.statusCode = 400;
            res.end('{"ok":false}');
          }
        });

        // 🌸 The Enchanted Idea Book (catalog.html) saves its pages here: the
        // book's insides go back into the file, between its BOOK markers.
        server.middlewares.use("/api/save-catalog", async (req, res, next) => {
          if (req.method !== "POST") return next();
          try {
            const { book, base } = JSON.parse((await readBody(req)).toString());
            const file = path.resolve("catalog.html");
            const html = fs.readFileSync(file, "utf8");
            const a = html.indexOf("<!--BOOK-START-->");
            const b = html.indexOf("<!--BOOK-END-->");
            if (typeof book !== "string" || a < 0 || b < a) throw new Error("no book");
            // (an old tab must never save over a newer book — it reloads first)
            const now = html.slice(a + "<!--BOOK-START-->".length, b);
            const stamp = (t) => { let h = 0; for (const c of t.replace(/\s+/g, "")) h = (h * 31 + c.codePointAt(0)) | 0; return String(h); };
            if (base && stamp(now) !== base) {
              res.statusCode = 409;
              res.end('{"ok":false,"stale":true}');
              return;
            }
            fs.writeFileSync(file, html.slice(0, a + "<!--BOOK-START-->".length) + "\n" + book.trim() + "\n" + html.slice(b));
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, stamp: stamp("\n" + book.trim() + "\n") }));
          } catch {
            res.statusCode = 400;
            res.end('{"ok":false}');
          }
        });

        // The world editor saves the outdoor layout here.
        server.middlewares.use("/api/save-world", async (req, res, next) => {
          if (req.method !== "POST") return next();
          const body = (await readBody(req)).toString();
          try {
            JSON.parse(body);
            fs.writeFileSync(path.resolve("public/world-layout.json"), body);
            res.statusCode = 200;
            res.end('{"ok":true}');
          } catch {
            res.statusCode = 400;
            res.end('{"ok":false}');
          }
        });

        // 🤝 The Claude bridge: the world editor posts whatever you have
        // selected or pinned, so Claude can see what you're pointing at and
        // act on it (editor-state.json in the project root, git-ignored).
        server.middlewares.use("/api/editor-state", async (req, res, next) => {
          if (req.method !== "POST") return next();
          const body = (await readBody(req)).toString();
          try {
            JSON.parse(body);
            fs.writeFileSync(path.resolve("editor-state.json"), body);
            res.statusCode = 200;
            res.end('{"ok":true}');
          } catch {
            res.statusCode = 400;
            res.end('{"ok":false}');
          }
        });

        // The world editor uploads .glb models here -> public/models/<name>.
        server.middlewares.use("/api/upload-model", async (req, res, next) => {
          if (req.method !== "POST") return next();
          const url = new URL(req.url, "http://x");
          let name = url.searchParams.get("name") || "model.glb";
          name = name.replace(/[^A-Za-z0-9._-]/g, "_"); // keep it safe
          const dir = path.resolve("public/models");
          fs.mkdirSync(dir, { recursive: true });
          const body = await readBody(req);
          fs.writeFileSync(path.join(dir, name), body);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, url: "/models/" + name }));
        });
      },
    },
  ],
});
