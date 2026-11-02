# Little Joy Arcade integration

## Account and cloud saves

`public/arcade-client.js` is the shared drop-in client from
`littlejoyarcade/packages/sdk/desktop/arcade-client.js`. `index.html` loads it
with the game id:

```html
<script src="./arcade-client.js" data-game-id="purrfect-squares"></script>
```

It adds the Little Joy sign-in button, mirrors this game's Web Storage keys into
the player's `game_progress` row and restores them on a new device. The save key
is `purrfect-squares-save-v1` — plain JSON, versioned, sanitised on load, so a
cloud restore cannot inject a corrupt board.

If the client is unavailable or the player is a guest, everything still works:
the game reads and writes the same key locally. Nothing in the puzzle path awaits
the network.

## Catalogue entry

`arcade-manifest.json` is the publishing source of truth for the portal:

```bash
cd ../littlejoyarcade
SUPABASE_DB_PASSWORD=... node scripts/publish-game.mjs ../purrfect-squares/arcade-manifest.json
```

It uses the same fields the portal already understands (`playUrl`,
`preferredPlayUrl`, `cover`, `highlights`, `howToPlay`, `levels`, `saveKey`).

## URLs

- Canonical (what the catalogue links):
  `https://jd4rider.github.io/purrfect-squares/play/`
- Friendly host, probed by the portal when it exists:
  `https://purrfectsquares.littlejoyarcade.site/play/`

Per `littlejoyarcade/DNS_CONFIGURATION.md`, a Pages site has exactly one
canonical hostname. Setting a Pages custom domain on this repo would 301 the
`github.io` path, which is exactly the black-iframe failure the arcade hit
before. The repo therefore ships no `public/CNAME`; the subdomain becomes live
only as part of the planned all-games cutover.

## Entitlements (prepared, not active)

Reserved ids for later store work: `arcade.ad_free`,
`purrfect-squares.ad_free`, `purrfect-squares.premium_themes`. No purchase flow
or ad call is implemented, and no game content is gated behind one.

## Badges

Badges are computed inside the game from the save (`src/progress.js`) so they
keep working offline. They are not yet mirrored into the arcade-wide
`player_achievements` table; that needs a server-side mapping so a forged client
event cannot grant premium value.
