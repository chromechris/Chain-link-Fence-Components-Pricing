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

| Key | Unit | Description | Seed value |
|---|---|---|---|
| `settings.markup` | % | Markup applied to material subtotal | 0 |
| `settings.tax` | % | Sales / transaction-privilege tax rate | 8.6 |

### fabricRoll — chain-link fabric rolls

Galvanized 9 ga, 2" mesh, 50' roll, by fence height. Big-box + fence-supply list prices, June 2026.

| Key | Unit | Description | Seed value |
|---|---|---|---|
| `fabricRoll.4` | $ per 50' roll | 4' high galv 9 ga 2" mesh | 130 |
| `fabricRoll.5` | $ per 50' roll | 5' high galv 9 ga 2" mesh | 160 |
| `fabricRoll.6` | $ per 50' roll | 6' high galv 9 ga 2" mesh | 190 |
| `fabricRoll.8` | $ per 50' roll | 8' high galv 9 ga 2" mesh | 280 |
| `fabricRoll.10` | $ per 50' roll | 10' high galv 9 ga 2" mesh | 360 |
| `fabricRoll.12` | $ per 50' roll | 12' high galv 9 ga 2" mesh | 440 |

### fabricMods — fabric multipliers

Dimensionless multipliers applied to the base roll price for gauge, coating and mesh size.

| Key | Unit | Description | Seed value |
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

| Key | Unit | Description | Seed value |
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

| Key | Unit | Description | Seed value |
|---|---|---|---|
| `wire.tension` | $ per lin ft | 7 ga galv tension wire | 0.17 |
| `wire.barb` | $ per lin ft | Barbed wire | 0.13 |

### fit — fittings and hardware

Galvanized fittings and hardware, each; tbarft is tension bar per lineal foot.

| Key | Unit | Description | Seed value |
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

| Key | Unit | Description | Seed value |
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

| Key | Unit | Description | Seed value |
|---|---|---|---|
| `concrete.60` | $ per bag | 60 lb concrete mix | 5.5 |
| `concrete.80` | $ per bag | 80 lb concrete mix | 6.9 |

## How the app uses the feed

1. Price Book → **Update prices from feed**. The feed URL defaults to the raw GitHub URL above; you can change it (remembered on that machine) or pick a local `.json` / `.csv` file instead.
2. The fetch appends a cache-busting query parameter, because `raw.githubusercontent.com` caches for about five minutes.
3. The app shows every key side by side: current price book value vs feed value, with changed lines pre-checked. Accept all, accept only the checked lines, or cancel. Nothing changes until you accept.
4. Accepted prices are saved in the browser / desktop app's local storage together with the feed's `asOf` date and URL, so they survive a reload. **Restore Arizona defaults** in the Price Book throws the saved book away and returns to the built-in values.

## Updating the feed

1. Edit `feed.json` (keep the structure; change numbers, `asOf`, `region`, and the `note` strings). Use a date you actually verified prices on.
2. Mirror the change in `feed.csv`, or regenerate the CSV from the JSON with this one-liner (Node.js):

   ```bash
   node -e "const f=require('./feed.json');const rows=['key,value,note','asOf,'+f.asOf+',Feed as-of date (YYYY-MM-DD)','region,\"'+f.region+'\",Pricing region'];const walk=(o,p)=>Object.keys(o).forEach(k=>{if(k==='note')return;const v=o[k],q=p?p+'.'+k:k;v&&typeof v==='object'?walk(v,q):rows.push(q+','+v+',')});['settings','fabricRoll','fabricMods','pipeFt','wire','fit','gate','concrete'].forEach(s=>walk(f[s],s));require('fs').writeFileSync('feed.csv',rows.join('\n')+'\n')"
   ```

   (This drops the per-key notes in the CSV; restore them from git if you want to keep them.)
3. Validate: `node -e "JSON.parse(require('fs').readFileSync('feed.json'))"` must print nothing.
4. Commit and push to `main`. The raw URL serves the new file within about five minutes; the app's cache-buster makes the next fetch pick it up immediately after that.

### Rules

- Never remove a key. The app ignores unknown keys but a missing key simply keeps the current price book value, so removing keys silently freezes prices.
- Never rename a key. Key names are the app's internal price-book paths.
- Keep prices in the units listed above (per roll, per lineal foot, each, per bag).
- Contractor / fence-supply pricing is preferred over big-box retail; note the source in the section `note`.
