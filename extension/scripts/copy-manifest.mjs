import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));

// Add the production web app origin (the same VITE_WEB_APP_URL the bundle is
// built with). Wildcard hosts such as https://*.vercel.app/* are never used:
// any page on them could otherwise reach the tab bridge.
const webAppUrl = process.env.VITE_WEB_APP_URL;
if (webAppUrl) {
  const url = new URL(webAppUrl);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("VITE_WEB_APP_URL must be https (or localhost) for the extension build.");
  }
  const pattern = `${url.origin}/*`;
  for (const list of [manifest.host_permissions, manifest.content_scripts[0].matches]) {
    if (!list.includes(pattern)) list.push(pattern);
  }
} else {
  console.warn("VITE_WEB_APP_URL not set: manifest only allows http://localhost:3000.");
}

await mkdir(dist, { recursive: true });
await writeFile(resolve(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
