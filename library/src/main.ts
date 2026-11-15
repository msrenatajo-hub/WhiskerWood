import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/overlays.css";
import { App } from "@/ui/App";

/** Boot the Grand Library, narrating the loading veil as we go. */
const canvas = document.getElementById("scene") as HTMLCanvasElement;
const veil = document.getElementById("veil") as HTMLElement;
const bar = document.getElementById("veil-bar") as HTMLElement;
const msg = document.getElementById("veil-msg") as HTMLElement;

const step = (pct: number, text: string): void => {
  bar.style.width = pct + "%";
  msg.textContent = text;
};

async function boot(): Promise<void> {
  step(15, "carving the shelves…");
  const app = new App(canvas);
  step(55, "lighting the lanterns…");
  await app.start();
  step(100, "welcome, Keeper");
  setTimeout(() => veil.classList.add("is-hidden"), 500);
}

void boot();
