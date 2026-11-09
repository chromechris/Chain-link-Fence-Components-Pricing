#!/usr/bin/env node
// ============================================================
// Chain-link Fence Components Pricing — feed updater
//
//   node update-feed.js research [--region "..."] [--dry-run] [--push] [--allow-big-moves]
//   node update-feed.js quote <supplier.csv> [--as-of YYYY-MM-DD] [--region "..."] [--dry-run] [--push]
//   node update-feed.js set key=value [key=value ...] [--push]
//   node update-feed.js sync                (rebuild feed.csv + README table from feed.json)
//   node update-feed.js publish             (git commit + push whatever is changed)
//
// research  → Claude (web search) prices every key in keys.json for the region, cites
//             each source, and writes feed.json / feed.csv / SOURCES.md.
// quote     → reads a supplier quote / price-list CSV, maps rows to feed keys with
//             quote-map.json, and writes the feed. Most accurate for bidding.
// Nothing is committed unless --push is given (or you run `publish`).
// ============================================================
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const FEED = path.join(ROOT, "feed.json");
const CSV = path.join(ROOT, "feed.csv");
const KEYS = path.join(ROOT, "keys.json");
const QMAP = path.join(ROOT, "quote-map.json");
const SOURCES = path.join(ROOT, "SOURCES.md");
const README = path.join(ROOT, "README.md");
const SECTIONS = ["settings", "fabricRoll", "fabricMods", "pipeFt", "wire", "fit", "gate", "concrete"];
const META_KEYS = ["asOf", "region", "source", "note"];

// ---------- helpers ----------
const today = () => new Date().toISOString().slice(0, 10);
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeText = (p, s) => fs.writeFileSync(p, s.replace(/\r\n/g, "\n"), "utf8");
const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, p, v) => { const ks = p.split("."), last = ks.pop(); let t = o; ks.forEach((k) => { if (!t[k] || typeof t[k] !== "object") t[k] = {}; t = t[k]; }); t[last] = v; };
const flatten = (feed) => { // dotted price keys in section order, skipping metadata
  const out = [];
  SECTIONS.forEach((s) => { (function walk(o, pre) { Object.keys(o || {}).forEach((k) => { if (k === "note") return; const v = o[k], p = pre + "." + k; if (v && typeof v === "object") walk(v, p); else out.push([p, v]); }); })(feed[s], s); });
  return out;
};
const fmtNum = (n) => (Math.abs(n) >= 100 ? +n.toFixed(2) : +n.toFixed(4));
function parseArgs(argv) {
  const a = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith("--")) { const k = t.slice(2); const nxt = argv[i + 1]; if (nxt != null && !nxt.startsWith("--") && ["region", "as-of", "model", "max-searches"].includes(k)) { a.flags[k] = nxt; i++; } else a.flags[k] = true; }
    else a._.push(t);
  }
  return a;
}
function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}
const csvq = (s) => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
const money = (s) => { if (typeof s === "number") return s; const m = String(s || "").replace(/[$,\s]/g, "").match(/-?\d*\.?\d+/); return m ? parseFloat(m[0]) : NaN; };

// ---------- feed I/O ----------
function loadFeed() { const f = readJSON(FEED); SECTIONS.forEach((s) => { if (!f[s] || typeof f[s] !== "object") throw new Error("feed.json is missing section " + s); }); return f; }
function validate(feed, keys) {
  const flat = flatten(feed), have = new Set(flat.map(([k]) => k)), errs = [];
  Object.keys(keys).forEach((k) => { if (!have.has(k)) errs.push("missing key " + k); });
  flat.forEach(([k, v]) => { if (!(k in keys)) errs.push("unknown key " + k + " (not in keys.json — the app would ignore it)"); if (typeof v !== "number" || !isFinite(v) || v < 0) errs.push("bad value for " + k + ": " + JSON.stringify(v)); });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(feed.asOf || "")) errs.push("asOf must be YYYY-MM-DD");
  if (!feed.region) errs.push("region is empty");
  if (errs.length) throw new Error("feed validation failed:\n  " + errs.join("\n  "));
}
function writeFeed(feed, keys) {
  validate(feed, keys);
  const ordered = { asOf: feed.asOf, region: feed.region, source: feed.source };
  SECTIONS.forEach((s) => (ordered[s] = feed[s]));
  writeText(FEED, JSON.stringify(ordered, null, 2) + "\n");
  const rows = ["key,value,note", `asOf,${feed.asOf},Feed as-of date (YYYY-MM-DD)`, `region,${csvq(feed.region)},Pricing region`];
  flatten(feed).forEach(([k, v]) => rows.push(`${k},${v},${csvq(keys[k].description + " (" + keys[k].unit + ")")}`));
  writeText(CSV, rows.join("\n") + "\n");
  syncReadmeTable(feed, keys);
}
function syncReadmeTable(feed, keys) { // refresh the "Seed value" column in README key tables
  if (!fs.existsSync(README)) return;
  let md = fs.readFileSync(README, "utf8");
  flatten(feed).forEach(([k, v]) => { md = md.replace(new RegExp("(\\| `" + k.replace(/[.$]/g, "\\$&") + "` \\|[^\\n]*\\| )[^|\\n]*(\\|)"), "$1" + v + " $2"); });
  md = md.replace(/\| Seed value \|/g, "| Current value |");
  writeText(README, md);
}
function applyChanges(feed, keys, changes, label) { // changes: {key:{value,source?,note?}}
  const applied = [], skipped = [];
  Object.keys(changes).forEach((k) => {
    const c = changes[k], v = typeof c === "object" ? c.value : c;
    if (!(k in keys)) { skipped.push([k, "not a feed key"]); return; }
    if (typeof v !== "number" || !isFinite(v) || v < 0) { skipped.push([k, "not a number"]); return; }
    const old = getPath(feed, k);
    setPath(feed, k, fmtNum(v));
    applied.push({ key: k, old, value: fmtNum(v), source: (c && c.source) || label, title: c && c.title, note: c && c.note });
  });
  return { applied, skipped };
}
function report(applied, skipped) {
  if (!applied.length) console.log("No price changes.");
  applied.forEach((a) => console.log(`  ${a.key.padEnd(22)} ${String(a.old).padStart(9)} -> ${String(a.value).padStart(9)}${a.old ? "  (" + (((a.value - a.old) / a.old) * 100).toFixed(1) + "%)" : ""}`));
  skipped.forEach(([k, why]) => console.log(`  skipped ${k}: ${why}`));
}
function writeSources(feed, applied, unresolved, mode) {
  const lines = [`# Sources — feed as of ${feed.asOf} (${feed.region})`, "", `Generated by \`update-feed.js ${mode}\` on ${today()}. Every line below backs one value in feed.json; re-run the updater to refresh.`, "", "| Key | Value | Source | Note |", "|---|---|---|---|"];
  applied.forEach((a) => lines.push(`| \`${a.key}\` | ${a.value} | ${a.source && /^https?:/.test(a.source) ? `[${a.title || a.source.replace(/^https?:\/\//, "").slice(0, 60)}](${a.source})` : a.source || ""} | ${(a.note || "").replace(/\|/g, "/")} |`));
  if (unresolved && unresolved.length) { lines.push("", "## Not updated (kept previous value)", ""); unresolved.forEach((u) => lines.push(`- \`${u.key}\` — ${u.why}`)); }
  writeText(SOURCES, lines.join("\n") + "\n");
}
function publish(msg) {
  const st = execSync("git status --porcelain", { cwd: ROOT }).toString().trim();
  if (!st) { console.log("Nothing to commit."); return; }
  execSync("git add feed.json feed.csv SOURCES.md README.md", { cwd: ROOT, stdio: "inherit" });
  execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: ROOT, stdio: "inherit" });
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  console.log("Pushed. The app picks it up on the next 'Update prices from feed' click (raw GitHub cache ≈ 5 min).");
}

// ---------- mode: sync ----------
function cmdSync(a) { const keys = readJSON(KEYS); const feed = loadFeed(); if (a && a.flags["dry-run"]) { validate(feed, keys); console.log("feed.json is valid (" + flatten(feed).length + " keys); --dry-run, nothing written."); return; } writeFeed(feed, keys); console.log("feed.csv and README regenerated from feed.json (" + flatten(feed).length + " keys)."); }

// ---------- mode: set ----------
function cmdSet(a) {
  const keys = readJSON(KEYS), feed = loadFeed(), changes = {};
  a._.slice(1).forEach((kv) => { const m = kv.match(/^([\w.]+)=(.+)$/); if (!m) throw new Error("expected key=value, got " + kv); changes[m[1]] = { value: money(m[2]), source: "manual" }; });
  const { applied, skipped } = applyChanges(feed, keys, changes, "manual");
  if (applied.length) { feed.asOf = a.flags["as-of"] || today(); if (a.flags.region) feed.region = a.flags.region; }
  report(applied, skipped);
  if (a.flags["dry-run"]) return;
  writeFeed(feed, keys);
  if (a.flags.push) publish(`Manual price update (${applied.length} keys) as of ${feed.asOf}`);
}

// ---------- mode: quote (supplier CSV) ----------
// Converts one quote line's price to the feed unit. rule.per:
//   "each"   (default) per piece: UOM C = per 100, M = per 1000, and "BAG OF 100" / "1000/BX" in the text divide by the pack.
//   "ft"     per lineal foot: UOM FT/LF (or "per ft" in the text) is used as is; otherwise the price is per stick / bar / coil
//            and is divided by the length in the text (the first length given: 21', 1320 ft, 5'-10"), else by rule.divideBy.
//   "roll50" per 50' fabric roll: a 100' roll is halved; a per-foot price is multiplied by 50.
// rule.multiplyBy still applies last.
const PACK_RE = /(?:bag|bg|box|bx|pk|pack|carton|ctn|case|pail)\s*(?:of\s*)?(\d[\d,]*)|(\d[\d,]*)\s*(?:\/|per\s+)\s*(?:bag|bg|box|bx|pk|pack|carton|ctn|case|pail)\b|(\d[\d,]*)\s*(?:pcs|pc|ct|count)\b/i;
const LEN_RE = /(\d+(?:\.\d+)?)\s*(?:'|ft\b|feet\b|lf\b)(?:\s*-?\s*(\d+(?:\.\d+)?)\s*(?:"|in\b))?/gi;
function quoteUnitPrice(it, rule) {
  const per = rule.per || "each", u = it.uom.toLowerCase().replace(/[^a-z]/g, ""), steps = [];
  let v = it.price;
  const perFoot = ["ft", "lf", "lft", "feet", "foot"].includes(u) || /\b(per|\/)\s*(ft|lf|foot)\b/i.test(it.desc);
  const num = (s) => parseFloat(String(s).replace(/,/g, ""));
  if (u === "c") { v /= 100; steps.push("UOM C ÷ 100"); }
  else if (u === "m") { v /= 1000; steps.push("UOM M ÷ 1000"); }
  if (per === "ft") {
    if (!perFoot) {
      const lens = [...it.desc.matchAll(LEN_RE)].map((m) => num(m[1]) + (m[2] ? num(m[2]) / 12 : 0)).filter((x) => x > 0);
      const len = lens.length ? lens[0] : rule.divideBy;
      if (!len) return { error: "price is not per foot and the line gives no length" };
      v /= len; steps.push(`÷ ${+len.toFixed(3)} ft${lens.length ? "" : " (assumed)"}`);
    }
  } else if (per === "roll50") {
    if (perFoot) { v *= 50; steps.push("per ft × 50"); }
    else { const m = it.desc.match(/[x×]\s*(\d+)\s*(?:'|ft\b|feet\b)/i), len = m ? num(m[1]) : 50; if (len !== 50) { v = (v / len) * 50; steps.push(`${len}' roll → 50'`); } }
  } else {
    const m = u === "c" || u === "m" ? null : it.desc.match(PACK_RE), pack = m ? num(m[1] || m[2] || m[3]) : 0;
    if (pack > 1) { v /= pack; steps.push(`pack of ${pack}`); }
    else if (rule.divideBy) { v /= rule.divideBy; steps.push(`÷ ${rule.divideBy}`); }
  }
  if (rule.multiplyBy) { v *= rule.multiplyBy; steps.push(`× ${rule.multiplyBy}`); }
  return { value: v, steps };
}

function cmdQuote(a) {
  const file = a._[1]; if (!file) throw new Error("usage: update-feed.js quote <supplier.csv>");
  const keys = readJSON(KEYS), feed = loadFeed(), qmap = readJSON(QMAP);
  const rows = parseCSV(fs.readFileSync(file, "utf8"));
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (names, skip) => { for (const n of names) { const i = head.findIndex((h) => (h === n || h.includes(n)) && !(skip && skip.test(h))); if (i >= 0) return i; } return -1; };
  const iDesc = col(["description", "desc", "item", "product", "name"]), iSku = col(["sku", "part", "item #", "item no", "code"]);
  // Prefer the contractor's net price; never an extended / total column; list price only as a last resort.
  const iPrice = [col(["net price", "your price", "sell price", "net", "unit price", "each", "price", "cost", "rate"], /ext|total|amount|list/), col(["list price", "price"], /ext|total|amount/)].find((i) => i >= 0) ?? -1;
  const iUom = head.findIndex((h) => ["uom", "u/m", "um", "unit", "units", "unit of measure", "per"].includes(h));
  if (iDesc < 0 && iSku < 0) throw new Error("quote CSV needs a description/item or sku/part column; found: " + head.join(", "));
  if (iPrice < 0) throw new Error("quote CSV needs a price column; found: " + head.join(", "));
  console.log(`Columns: description="${head[iDesc] ?? "-"}", sku="${head[iSku] ?? "-"}", price="${head[iPrice]}", uom="${head[iUom] ?? "-"}"`);
  const items = rows.slice(1).map((r) => ({ desc: iDesc >= 0 ? r[iDesc] || "" : "", sku: iSku >= 0 ? r[iSku] || "" : "", uom: iUom >= 0 ? (r[iUom] || "").trim() : "", price: money(r[iPrice]) })).filter((x) => isFinite(x.price));
  const changes = {}, unresolved = [], manual = [];
  Object.keys(keys).forEach((k) => {
    const rule = qmap[k]; if (!rule) { unresolved.push({ key: k, why: "no rule in quote-map.json" }); return; }
    if (rule.manual) { manual.push(k); return; }
    const pats = (rule.patterns || []).map((p) => new RegExp(p, "i")), skus = (rule.skus || []).map((s) => s.toLowerCase()), excl = (rule.exclude || []).map((p) => new RegExp(p, "i"));
    const hit = items.find((it) => skus.includes(it.sku.toLowerCase()) || (pats.some((re) => re.test(it.desc)) && !excl.some((re) => re.test(it.desc))));
    if (!hit) { unresolved.push({ key: k, why: "no matching line in " + path.basename(file) }); return; }
    const n = quoteUnitPrice(hit, rule);
    if (n.error) { unresolved.push({ key: k, why: `${n.error} — matched "${hit.desc}"` }); return; }
    const v = n.value, old = getPath(feed, k);
    if (!a.flags["allow-big-moves"] && old > 0 && (v > old * 3 || v < old / 3)) { unresolved.push({ key: k, why: `held: ${old} -> ${fmtNum(v)} moves more than 3x — matched "${hit.desc}" (${n.steps.join(", ") || "no conversion"}); check the rule in quote-map.json or re-run with --allow-big-moves` }); return; }
    changes[k] = { value: v, source: path.basename(file), note: `${hit.sku ? hit.sku + " " : ""}${hit.desc}`.trim() + ` @ ${hit.price}${hit.uom ? "/" + hit.uom : ""}` + (n.steps.length ? ` (${n.steps.join(", ")})` : "") };
  });
  if (manual.length) console.log(`  not priced from quotes (set by hand): ${manual.join(", ")}`);
  const { applied, skipped } = applyChanges(feed, keys, changes, path.basename(file));
  feed.asOf = a.flags["as-of"] || today(); if (a.flags.region) feed.region = a.flags.region;
  feed.source = `Supplier quote ${path.basename(file)} (${applied.length} keys); unmatched keys keep their previous value.`;
  console.log(`Quote ${path.basename(file)}: ${items.length} priced lines, ${applied.length} keys matched, ${unresolved.length} unresolved.`);
  report(applied, skipped); unresolved.forEach((u) => console.log(`  unresolved ${u.key}: ${u.why}`));
  if (a.flags["dry-run"]) return;
  writeFeed(feed, keys); writeSources(feed, applied, unresolved, "quote");
  if (a.flags.push) publish(`Price update from supplier quote ${path.basename(file)} (${applied.length} keys) as of ${feed.asOf}`);
}

// ---------- mode: research (Claude + web search) ----------
async function cmdResearch(a) {
  const fixture = process.env.UPDATE_FEED_FIXTURE;   // test hook: a saved model reply instead of a live API call
  let Anthropic = null;
  if (!fixture) {
    try { const m = require("@anthropic-ai/sdk"); Anthropic = typeof m === "function" ? m : (m.default || m.Anthropic); } catch (e) { throw new Error("run `npm install` in this folder first (installs @anthropic-ai/sdk)"); }
    if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN && !fs.existsSync(path.join(require("os").homedir(), ".config", "anthropic")))
      throw new Error("No Anthropic credentials. Set ANTHROPIC_API_KEY (console.anthropic.com → API keys) or run `ant auth login`.");
  }
  const keys = readJSON(KEYS), feed = loadFeed();
  const region = a.flags.region || feed.region;
  const model = a.flags.model || "claude-opus-5";
  const maxSearches = +a.flags["max-searches"] || 40;
  const lookups = Object.keys(keys).filter((k) => keys[k].lookup);
  const derived = Object.keys(keys).filter((k) => !keys[k].lookup && !k.startsWith("settings."));
  const table = lookups.map((k) => `${k} | ${keys[k].unit} | current ${getPath(feed, k)} | ${keys[k].lookup}`).join("\n");
  const derivedTxt = derived.map((k) => `${k} | current ${getPath(feed, k)} | ${keys[k].description} — ${keys[k].reason}`).join("\n");
  const system = `You are a fence-material estimator's pricing researcher. You price chain-link fence components for a contractor in ${region}. Prefer fence-supply / wholesale distributor list prices (e.g. Merchants Metals, Master Halco, Stephens Pipe & Steel dealers, local fence supply houses) over big-box retail; use big-box (Home Depot, Lowe's) only when nothing else is published, and say so. Convert everything to the unit stated for the key (per 50' roll, per lineal foot, each, per bag). Never invent a number: if you cannot find a current price for a key, leave it out. Work efficiently — one search can cover several keys.`;
  const user = `Today is ${today()}. Research current prices for these keys. Output units and the item description to price are given per key.\n\nKEY | UNIT | CURRENT | WHAT TO PRICE\n${table}\n\nDerived multipliers (compute only if you priced the inputs; otherwise leave out):\n${derivedTxt}\n\nWhen finished, end your reply with exactly one fenced \`\`\`json block of the form:\n{"asOf":"YYYY-MM-DD","region":"${region}","prices":{"<key>":{"value":<number>,"source":"<url>","title":"<short source name>","note":"<what was priced, retail vs supply, any unit conversion>"}},"unverified":["<keys you could not price>"]}\nOnly include keys you actually found a price for. Values are plain numbers in US dollars (multipliers dimensionless).`;
  const client = fixture ? null : new Anthropic({ maxRetries: 3, timeout: 20 * 60 * 1000 });
  let messages = [{ role: "user", content: user }];
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: maxSearches, user_location: { type: "approximate", city: region.split(",")[0].trim(), region: "Arizona", country: "US", timezone: "America/Phoenix" } }];
  let final = null, searches = 0;
  if (fixture) final = { content: [{ type: "text", text: fs.readFileSync(fixture, "utf8") }], stop_reason: "end_turn", usage: { input_tokens: 0, output_tokens: 0 } };
  for (let turn = 0; !final && turn < 12; turn++) {
    process.stdout.write(turn ? `\n[resuming paused turn ${turn}]\n` : `Researching ${lookups.length} keys for ${region} with ${model} (up to ${maxSearches} web searches)…\n`);
    const stream = client.messages.stream({ model, max_tokens: 64000, system, messages, tools, thinking: { type: "adaptive" }, output_config: { effort: "high" } });
    stream.on("text", (t) => process.stdout.write(t));
    const msg = await stream.finalMessage();
    msg.content.forEach((b) => { if (b.type === "server_tool_use") searches++; });
    if (msg.stop_reason === "pause_turn") { messages = [{ role: "user", content: user }, { role: "assistant", content: msg.content }]; continue; }
    if (msg.stop_reason === "refusal") throw new Error("Model declined the request" + (msg.stop_details && msg.stop_details.explanation ? ": " + msg.stop_details.explanation : "") + ". Nothing changed.");
    if (msg.stop_reason === "max_tokens") throw new Error("Response was cut off at max_tokens; nothing changed. Re-run.");
    final = msg; break;
  }
  if (!final) throw new Error("Research did not finish after 12 turns; nothing changed.");
  const text = final.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (!blocks.length) throw new Error("No ```json block in the response; nothing changed. Full text is above.");
  let res; try { res = JSON.parse(blocks[blocks.length - 1][1]); } catch (e) { throw new Error("Could not parse the JSON block: " + e.message + "; nothing changed."); }
  if (!res || typeof res.prices !== "object") throw new Error("JSON block has no prices object; nothing changed.");
  console.log(`\n\n${searches} web searches · ${final.usage.input_tokens} in / ${final.usage.output_tokens} out tokens`);
  // guardrail: a value that moves more than 3x either way is probably a unit mistake — hold it unless --allow-big-moves
  const changes = {}, unresolved = (res.unverified || []).map((k) => ({ key: k, why: "no current price found" }));
  Object.keys(res.prices).forEach((k) => {
    const c = res.prices[k], v = money(c && c.value), old = getPath(feed, k);
    if (!(k in keys)) { unresolved.push({ key: k, why: "returned key is not a feed key" }); return; }
    if (!isFinite(v) || v < 0) { unresolved.push({ key: k, why: "returned value is not a number" }); return; }
    if (!a.flags["allow-big-moves"] && old > 0 && (v > old * 3 || v < old / 3)) { unresolved.push({ key: k, why: `held: ${old} -> ${v} moves more than 3x (probable unit error; re-run with --allow-big-moves to accept). Source: ${c.source || "?"}` }); return; }
    changes[k] = { value: v, source: c.source, title: c.title, note: c.note };
  });
  Object.keys(keys).forEach((k) => { if (!(k in changes) && !unresolved.find((u) => u.key === k) && !k.startsWith("settings.")) unresolved.push({ key: k, why: "not returned by research" }); });
  const { applied, skipped } = applyChanges(feed, keys, changes, "research");
  feed.asOf = /^\d{4}-\d{2}-\d{2}$/.test(res.asOf || "") ? res.asOf : today(); feed.region = region;
  feed.source = `Claude web research (${model}) on ${today()} — ${applied.length} keys priced with cited sources in SOURCES.md; unpriced keys keep their previous value. Verify with your supplier before bidding.`;
  report(applied, skipped); unresolved.forEach((u) => console.log(`  not updated ${u.key}: ${u.why}`));
  if (a.flags["dry-run"]) { console.log("(dry run — nothing written)"); return; }
  writeFeed(feed, keys); writeSources(feed, applied, unresolved, "research");
  console.log(`Wrote feed.json, feed.csv, SOURCES.md (asOf ${feed.asOf}).`);
  if (a.flags.push) publish(`Price research update (${applied.length} keys) as of ${feed.asOf}`);
  else console.log("Review the diff, then `node update-feed.js publish` (or re-run with --push).");
}

// ---------- main ----------
(async () => {
  const a = parseArgs(process.argv.slice(2)), cmd = a._[0];
  try {
    if (cmd === "research") await cmdResearch(a);
    else if (cmd === "quote") cmdQuote(a);
    else if (cmd === "set") cmdSet(a);
    else if (cmd === "sync") cmdSync(a);
    else if (cmd === "publish") publish(`Price feed update as of ${loadFeed().asOf}`);
    else { console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(1, 17).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); process.exit(cmd ? 1 : 0); }
  } catch (e) { console.error("\nERROR: " + (e && e.message ? e.message : e)); process.exit(1); }
})();
