# Portfolio tour recorder

Records a smooth, narrated-ready scrolling tour of the portfolio to a video
file — the visual half of the walkthrough video. Add a voiceover on top in any
editor.

Re-runnable: whenever the site changes, run it again and you get a fresh
recording. No manual scrolling, no screen-recording software, no camera.

> These deps live here rather than in `frontend/` on purpose — Playwright must
> never end up in the Vercel build.

## One-time setup

```bash
cd scripts
npm install
npx playwright install chromium
```

## Recording

Against the live site:

```bash
node record-tour.mjs --url https://your-site.vercel.app
```

Against a local production build (no backend needed — the site falls back to
its defaults if the API is unreachable):

```bash
cd ../frontend && npm run build
cd ../scripts && node serve-dist.mjs 4300 &
node record-tour.mjs --url http://localhost:4300
```

Output lands in `scripts/out/`.

## Flags

| Flag | Default | What it does |
|---|---|---|
| `--url` | `http://localhost:4200` | Site to record |
| `--theme` | site default | `midnight-gold` · `blueprint` · `terminal` · `paper-ledger` |
| `--layout` | site default | `standard` · `dossier` · `atelier-grid` · `zen` · `command` · `canvas` |
| `--hold` | `4500` | Pause at each section, ms |
| `--scroll` | `2500` | Travel time between sections, ms |
| `--out` | `./out` | Output folder |

**Matching a voiceover:** the default settings produce roughly a 60-second
tour. Raise `--hold` to stretch it — `--hold 7000` lands near 90 seconds,
which fits the standard intro script. It doesn't need to be exact; trim in the
editor.

**Recording each theme** for social clips or the appearance showcase:

```bash
for t in midnight-gold blueprint terminal paper-ledger; do
  node record-tour.mjs --url http://localhost:4300 --theme $t
done
```

## Output format

Chromium records `.webm`. If `ffmpeg` is on your PATH, an `.mp4` is written
alongside it — most editors and social platforms prefer mp4. Without ffmpeg
you just get the webm, which most editors still accept.

To install ffmpeg on Windows: `winget install Gyan.FFmpeg`

## Tour stops

Defined in `STOPS` in `record-tour.mjs`. Currently:

`hero → services → skills → projects → story → experience → gigs → contact`

Edit that array to change the route. A stop whose ID isn't on the page is
skipped with a warning rather than failing the run.
