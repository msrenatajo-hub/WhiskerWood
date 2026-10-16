import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage } from "node:http";

/** Read the whole POST body into a Buffer. */
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

// The Grand Library is its own self-contained app inside the WhiskerWood repo.
// The Codex's durable home is data/codex.json (git-tracked): the dev server
// serves it at /codex.json and the "Save to file" button writes it back via
// /api/save-codex. The browser's localStorage is just the working copy.
export default defineConfig({
  root: ".",
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  server: {
    port: 5174, // the game runs on 5173; keep the library separate
    open: false,
  },
  plugins: [
    {
      name: "everbough-codex-file",
      configureServer(server) {
        const file = path.resolve("data/codex.json");

        // Serve the saved Codex (404s harmlessly if it doesn't exist yet).
        server.middlewares.use("/codex.json", (req, res, next) => {
          if (req.method !== "GET") return next();
          try {
            const data = fs.readFileSync(file);
            res.setHeader("Content-Type", "application/json");
            res.end(data);
          } catch {
            res.statusCode = 404;
            res.end("[]");
          }
        });

        // Write the whole Codex back to disk (the 💾 Save button posts here).
        server.middlewares.use("/api/save-codex", (req, res, next) => {
          if (req.method !== "POST") return next();
          void readBody(req).then((buf) => {
            const body = buf.toString();
            try {
              JSON.parse(body); // never write something unparseable
              fs.mkdirSync(path.dirname(file), { recursive: true });
              fs.writeFileSync(file, body);
              res.setHeader("Content-Type", "application/json");
              res.end('{"ok":true}');
            } catch {
              res.statusCode = 400;
              res.end('{"ok":false}');
            }
          });
        });
      },
    },
  ],
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
});
