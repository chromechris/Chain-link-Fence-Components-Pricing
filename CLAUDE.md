# Chain-link Fence Components Pricing

Public price feed and updater for the Chain-Link Material Takeoff app. The full project handoff (app + this repo, build steps, material rules, status) is in the app repo: `D:\My_Apps\ChainLink_Takeoff\docs\HANDOFF.md`. `README.md` here documents every feed key and all `update-feed.js` modes.

## Working rules

- `feed.json` must mirror the app's `AZ_PRICES` schema exactly: 52 keys, no removals, no renames. `node update-feed.js sync` validates and regenerates `feed.csv` + the README table; it refuses a feed with a missing or unknown key.
- Never commit `.env` or an API key. This repo is public.
- Test the updater offline with `--dry-run` and `UPDATE_FEED_FIXTURE=<saved reply>`; a live `research` run costs API money, so only the user starts one.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
