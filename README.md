# Chain-link Fence Components Pricing

Public price feed for the **Chain-Link Material Takeoff** app (Tech Recon LLC). The app's Price Book panel has an **Update prices from feed** button that fetches `feed.json` from this repo, shows a side-by-side diff against the current price book, and applies only the lines you accept.

Feed URL used by the app:

```
https://raw.githubusercontent.com/chromechris/Chain-link-Fence-Components-Pricing/main/feed.json
```

## Files

| File | Purpose |
|---|---|
| `feed.json` | The feed the app fetches. Mirrors the app's `AZ_PRICES` price-book object exactly (same sections and keys), plus `asOf`, `region`, `source` and an optional `note` string inside each section. |
| `feed.csv` | The same prices as a flat `key,value,note` table. The app can also import this file directly (Price Book → Update prices from feed → *local file*). `asOf` and `region` are ordinary rows. |
| `README.md` | This file: every key, its unit, and how to update the feed. |

Both files must carry the same numbers. Edit one, then copy the values to the other (or regenerate the CSV from the JSON, see *Updating the feed*).

## Top-level fields (feed.json)

| Field | Type | Meaning |
|---|---|---|
| `asOf` | string `YYYY-MM-DD` | Date the prices were last verified. Shown in the app's diff header and remembered as "last feed date". |
| `region` | string | Market the prices describe, e.g. `Phoenix, AZ (Maricopa County)`. Shown in the diff header. |
| `source` | string, optional | One line describing where the numbers came from. |
| `<section>.note` | string, optional | Per-section source note. Ignored by the price book (it is not a price). |

Any key that is **not** in the tables below is reported by the app as *ignored* and never added to the price book.

## Keys

All money values are US dollars, plain numbers (no `$`, no thousands separators). Multipliers are dimensionless. Percentages are plain numbers (`8.6` means 8.6 %).

### settings — pricing settings

Markup is a contractor choice (0 = none). Tax is the Phoenix combined TPT rate (state 5.6% + Maricopa 0.7% + Phoenix 2.3%).

| Key | Unit | Description | Current value |
|---|---|---|---|
| `settings.markup` | % | Markup applied to material subtotal | 0 |
| `settings.tax` | % | Sales / transaction-privilege tax rate | 8.6 |

### fabricRoll — chain-link fabric rolls

Galvanized 9 ga, 2" mesh, 50' roll, by fence height. Big-box + fence-supply list prices, June 2026.

| Key | Unit | Description | Current value |
|---|---|---|---|
| `fabricRoll.4` | $ per 50' roll | 4' high galv 9 ga 2" mesh | 130 |
| `fabricRoll.5` | $ per 50' roll | 5' high galv 9 ga 2" mesh | 160 |
| `fabricRoll.6` | $ per 50' roll | 6' high galv 9 ga 2" mesh | 190 |
| `fabricRoll.8` | $ per 50' roll | 8' high galv 9 ga 2" mesh | 280 |
| `fabricRoll.10` | $ per 50' roll | 10' high galv 9 ga 2" mesh | 360 |
| `fabricRoll.12` | $ per 50' roll | 12' high galv 9 ga 2" mesh | 440 |

### fabricMods — fabric multipliers

Dimensionless multipliers applied to the base roll price for gauge, coating and mesh size.

| Key | Unit | Description | Current value |
|---|---|---|---|
| `fabricMods.ga11` | × base roll | 11 ga fabric multiplier | 0.82 |
| `fabricMods.ga115` | × base roll | 11-1/2 ga fabric multiplier | 0.75 |
| `fabricMods.ga6` | × base roll | 6 ga fabric multiplier | 1.45 |
| `fabricMods.gaw2` | × base roll | Galvanized Class 2 (2.0 oz) multiplier | 1.1 |
| `fabricMods.pvc` | × base roll | PVC / polymer-coated multiplier | 1.4 |
| `fabricMods.alum` | × base roll | Aluminized multiplier | 1.15 |
| `fabricMods.mesh175` | × base roll | 1-3/4" mesh multiplier | 1.12 |
| `fabricMods.meshSmall` | × base roll | ≤1-1/4" mesh multiplier | 1.5 |

### pipeFt — pipe and posts

Galvanized SS20/SS40 fence pipe, per lineal foot, by outside diameter. Keys drop the decimal point (p2375 = 2.375").

| Key | Unit | Description | Current value |
|---|---|---|---|
| `pipeFt.p166` | $ per lin ft | 1-5/8" (1.660) O.D. pipe | 2.4 |
| `pipeFt.p1875` | $ per lin ft | 1-7/8" O.D. pipe | 3 |
| `pipeFt.p19` | $ per lin ft | 1.900" O.D. pipe | 3 |
| `pipeFt.p2375` | $ per lin ft | 2-3/8" O.D. pipe | 3.7 |
| `pipeFt.p2875` | $ per lin ft | 2-7/8" O.D. pipe | 5.25 |
| `pipeFt.p4` | $ per lin ft | 4" O.D. pipe | 9 |
| `pipeFt.p6625` | $ per lin ft | 6-5/8" O.D. pipe | 19 |
| `pipeFt.p8625` | $ per lin ft | 8-5/8" O.D. pipe | 30 |

### wire — wire

7 ga galvanized tension wire and 12.5 ga 2-pt barbed wire, per lineal foot.

| Key | Unit | Description | Current value |
|---|---|---|---|
| `wire.tension` | $ per lin ft | 7 ga galv tension wire | 0.17 |
| `wire.barb` | $ per lin ft | Barbed wire | 0.13 |

### fit — fittings and hardware

Galvanized fittings and hardware, each; tbarft is tension bar per lineal foot.

| Key | Unit | Description | Current value |
|---|---|---|---|
| `fit.loopcap` | $ each | Loop cap (line post, rail thru) | 2.75 |
| `fit.domecap` | $ each | Dome / post cap | 2.25 |
| `fit.railend` | $ each | Rail end / brace end cup | 1.6 |
| `fit.braceband` | $ each | Brace band | 1.15 |
| `fit.tband` | $ each | Tension band | 0.95 |
| `fit.tbarft` | $ per lin ft | Tension bar | 1.25 |
| `fit.bolt` | $ each | Carriage bolt + nut | 0.3 |
| `fit.truss` | $ each | Truss rod + tightener | 12 |
| `fit.sleeve` | $ each | Top rail sleeve (for cut-at-post rail) | 3.25 |
| `fit.clamp` | $ each | Line rail (boulevard) clamp | 2.5 |
| `fit.tie` | $ each | Tie wire | 0.06 |
| `fit.hog` | $ each | Hog ring | 0.05 |
| `fit.barbarm` | $ each | Barb arm (single 45°) | 4.75 |

### gate — gates

Shop-welded galvanized gate frames (fabric hung on site); walk keyed by height (ft), dbl keyed by opening width (ft).

| Key | Unit | Description | Current value |
|---|---|---|---|
| `gate.walk.4` | $ each | Walk gate frame, 4' high | 150 |
| `gate.walk.5` | $ each | Walk gate frame, 5' high | 175 |
| `gate.walk.6` | $ each | Walk gate frame, 6' high | 210 |
| `gate.walk.7` | $ each | Walk gate frame, 7' high | 265 |
| `gate.dbl.12` | $ each | Double drive gate frames, 12' opening | 560 |
| `gate.dbl.16` | $ each | Double drive gate frames, 16' opening | 700 |
| `gate.dbl.20` | $ each | Double drive gate frames, 20' opening | 860 |
| `gate.dbl.24` | $ each | Double drive gate frames, 24' opening | 1020 |
| `gate.hingepr` | $ per set | Hinge set (pair) per leaf | 18 |
| `gate.latch` | $ each | Fork latch | 14 |
| `gate.droprod` | $ per set | Drop rod set (double gate) | 40 |

### concrete — concrete

Bagged concrete mix, per bag, by bag weight (lb).

| Key | Unit | Description | Current value |
|---|---|---|---|
| `concrete.60` | $ per bag | 60 lb concrete mix | 5.5 |
| `concrete.80` | $ per bag | 80 lb concrete mix | 6.9 |

## How the app uses the feed

1. Price Book → **Update prices from feed**. The feed URL defaults to the raw GitHub URL above; you can change it (remembered on that machine) or pick a local `.json` / `.csv` file instead.
2. The fetch appends a cache-busting query parameter, because `raw.githubusercontent.com` caches for about five minutes.
3. The app shows every key side by side: current price book value vs feed value, with changed lines pre-checked. Accept all, accept only the checked lines, or cancel. Nothing changes until you accept.
4. Accepted prices are saved in the browser / desktop app's local storage together with the feed's `asOf` date and URL, so they survive a reload. **Restore Arizona defaults** in the Price Book throws the saved book away and returns to the built-in values.

## Updating the feed — `update-feed.js`

The numbers in this repo do **not** refresh themselves. `update-feed.js` is the program that produces a new `feed.json` / `feed.csv` (plus `SOURCES.md`, the citation for every changed value) and pushes them. Requirements: [Node.js](https://nodejs.org) 18+, then once in this folder:

```bash
npm install
```

### 1. Claude web research (automatic, cited)

```bash
node update-feed.js research --push
```

Claude searches current fence-supply and retail listings for the region, prices every key it can find, cites each source, and holds anything it could not verify (those keys keep their previous value). Windows: double-click **`Update-Prices.bat`** to do the same thing.

- Needs an Anthropic API key: create one at console.anthropic.com, then either set the Windows environment variable `ANTHROPIC_API_KEY`, or create a file named `.env` in this folder containing `ANTHROPIC_API_KEY=sk-ant-...` (the `.bat` reads it; `.env` is git-ignored). Each run costs on the order of a dollar or two in API usage.
- Options: `--region "Tucson, AZ"`, `--dry-run` (show what would change, write nothing), `--max-searches 60`, `--model claude-sonnet-5` (cheaper), `--allow-big-moves` (accept values that move more than 3x, which are otherwise held as probable unit mistakes).
- Without `--push` the files are written locally; review `git diff` and `SOURCES.md`, then `node update-feed.js publish`.

### 2. Supplier quote CSV (most accurate for bidding)

```bash
node update-feed.js quote my-supplier-quote.csv --push
```

Export or type your supply house's quote as a CSV with a description (or SKU) column and a price column, e.g. `quote-sample.csv` (simple) or `quote-sample-supplyhouse.csv` (typical supply-house export with abbreviations, a UOM column and list/net prices). The run prints which columns it used.

- **Price column:** net / your price / unit price is preferred; extended and total columns are never used; list price only if nothing else exists.
- **Units:** a `UOM` column of `C` (per 100) or `M` (per 1000) is converted to each; `FT`/`LF` is taken as per foot; "BAG OF 100" or "1000/BX" in the description divides by the pack.
- **Lengths:** pipe, tension wire, barbed wire and tension bars are converted to per foot from the length in the description (21' or 24' stick, 1320' roll, 5'-10" bar), falling back to 21' sticks and 6' bars. Fabric is converted to a 50' roll (100' rolls are halved).
- **`quote-map.json`:** per key, `patterns` (regexes on the description; the first matching line wins), `exclude` (rejects look-alikes such as vinyl-coated fabric for the galvanized roll keys, or barb arms for barbed wire), `skus` (exact part numbers), `per` (`each`, `ft` or `roll50`) and `divideBy` / `multiplyBy`. Markup, tax and the fabric multipliers are `manual` and never taken from a quote.

Edit the patterns to match your supplier's wording; keys with no matching line keep their previous value and are listed in `SOURCES.md`. A value more than 3x off the current one is held as a probable unit mistake (`--allow-big-moves` accepts it). `--as-of 2026-09-15` sets the quote date; `--dry-run` previews.

### 3. Manual

```bash
node update-feed.js set pipeFt.p2375=3.95 concrete.80=7.25 --push
```

Or edit `feed.json` by hand, then `node update-feed.js sync` to regenerate `feed.csv` and the README table, and `node update-feed.js publish`.

### 4. On a schedule (optional)

`.github/workflows/update-prices.yml` runs the research mode on GitHub's servers and opens a pull request for you to review and merge. Add the repo secret `ANTHROPIC_API_KEY`, run it from the Actions tab, and uncomment the `schedule` block for a monthly run.

### After any update

Push to `main`, then in the app click Price Book → **Update prices from feed**, review the diff, and accept. The raw GitHub URL can lag by about five minutes.

### Rules

- Never remove or rename a key: the app ignores unknown keys, and a missing key silently keeps the old price. `update-feed.js` refuses to write a feed that fails this check.
- Keep prices in the units listed above (per roll, per lineal foot, each, per bag).
- Contractor / fence-supply pricing is preferred over big-box retail; `SOURCES.md` records which one each value came from.
