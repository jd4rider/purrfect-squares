# Deployment

## Web (GitHub Pages)

`.github/workflows/pages.yml` runs on every push to `main`:

1. `npm ci --include=optional`
2. `npm test` — rules, solver, generator, determinism, history
3. `npm run build`
4. copies the build into `dist/play/`
5. publishes `dist/` with `actions/deploy-pages`

Pages is configured with `build_type=workflow`, so this workflow is the only
publisher. No second host is configured for this game.

Verify:

```bash
curl -sI https://jd4rider.github.io/purrfect-squares/play/ | head -3
curl -s -o /dev/null -w '%{http_code}\n' https://jd4rider.github.io/purrfect-squares/play/
```

## No custom domain on the game repo

This repo deliberately has no `public/CNAME`. A Pages project site has one
canonical hostname; adding `purrfectsquares.littlejoyarcade.site` there would
301 the `github.io` build the catalogue links, and the arcade's embedded player
would go blank. The catalogue uses the `github.io` URL as `playUrl` and the
subdomain only as an optional `preferredPlayUrl` probe until the whole arcade
moves to custom hostnames (see `littlejoyarcade/DNS_CONFIGURATION.md`).

## Local checks

```bash
npm test
npm run build
python3 -m http.server 4173 --directory dist
node scripts/smoke.mjs http://localhost:4173/
```

`scripts/smoke.mjs` drives the built game in headless Chrome: boots the menu,
starts Journey, drags the known solution rectangles for level 1, then asserts
that the save records the board and unlocks level 2.

## Rollback

Re-run an earlier successful Pages workflow or revert the commit on `main`.
Rolling back code never touches DNS.
