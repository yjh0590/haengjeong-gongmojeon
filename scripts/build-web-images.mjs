// Builds lighter display copies of the street photos for phones: public/street/**/<name>.web.webp
// (longest side 1600px, WebP quality 0.82). Originals stay untouched; src/data/webImages.json lists
// which originals have a copy, and src/data/webImage.ts swaps them in at display time.
// Needs Google Chrome (headless) for the WebP encoder. Run: npm run images:web
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, extname } from "node:path";

const root = new URL("../public/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const MAX_SIDE = 1600, QUALITY = 0.82, MIN_BYTES = 150 * 1024;
const chromePath = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find(existsSync);
if (!chromePath) throw new Error("Chrome not found. Set CHROME_PATH.");

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
const originals = walk(join(root, "street")).filter(f => /\.(jpe?g|png)$/i.test(f) && statSync(f).size >= MIN_BYTES)
  .map(f => "/" + relative(root, f).replaceAll("\\", "/"));

const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]);
  if (path === "/") { res.end("<!doctype html><title>encode</title>"); return; }
  let body;
  try { body = readFileSync(join(root, path)); } catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[extname(path).toLowerCase()] || "application/octet-stream" }); res.end(body);
}).listen(0, "127.0.0.1");
await new Promise(r => server.once("listening", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "webimg-"))}`, `${origin}/`], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch { /* starting */ } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r));
let id = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const evaluate = expression => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } })); });
await sleep(500);

const done = [];
try {
  for (const src of originals) {
    const result = await evaluate(`(async () => {
      const bitmap = await createImageBitmap(await (await fetch(${JSON.stringify(src)})).blob());
      const scale = Math.min(1, ${MAX_SIDE} / Math.max(bitmap.width, bitmap.height));
      const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: "image/webp", quality: ${QUALITY} })).arrayBuffer());
      let text = ""; for (let i = 0; i < bytes.length; i += 32768) text += String.fromCharCode(...bytes.subarray(i, i + 32768));
      return { data: btoa(text), width: canvas.width, height: canvas.height, from: [bitmap.width, bitmap.height] };
    })()`);
    const value = result.result?.result?.value;
    if (!value) throw new Error(`${src}: ${JSON.stringify(result.result?.exceptionDetails?.exception?.description || result)}`);
    const out = src.replace(/\.(jpe?g|png)$/i, ".web.webp");
    const bytes = Buffer.from(value.data, "base64");
    const before = statSync(join(root, src)).size;
    // Keep the original when re-encoding would not make it meaningfully smaller.
    if (bytes.length > before * 0.8) { console.log(`skip ${src} (${Math.round(before / 1024)}KB -> ${Math.round(bytes.length / 1024)}KB)`); continue; }
    writeFileSync(join(root, out), bytes);
    done.push(src);
    console.log(`${src} ${value.from.join("x")} ${Math.round(before / 1024)}KB -> ${value.width}x${value.height} ${Math.round(bytes.length / 1024)}KB`);
  }
} finally { ws.close(); chrome.kill(); server.close(); }
writeFileSync(new URL("../src/data/webImages.json", import.meta.url), JSON.stringify(done.sort(), null, 1) + "\n");
console.log(`${done.length} display copies; list written to src/data/webImages.json`);
