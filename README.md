# VALORANT WIKI

A fast, mobile-first VALORANT database by **SRIHARI**. Live at **https://cyberromeo.github.io/valwiki/**

Plain HTML, CSS and JavaScript, no build step. All game data comes live from the community [Valorant API](https://valorant-api.com), so it updates itself every patch.

## What's inside
- **Agents**: role filters and search, a full page per agent (`#agent/jett`) with portrait, lore, role and ability tabs (C / Q / E / X), plus previous/next navigation
- **Arsenal**: every weapon grouped by class with cost and fire rate, and a page per gun (`#weapon/vandal`) with handling stats, a damage-by-range table and **every skin**, filterable by edition, each with its variants and in-game preview video
- **Maps**: competitive pool and modes, and a page per map (`#map/ascent`) with its coordinates, the minimap with **every callout plotted on it**, and region highlighting
- **Collection**: player cards, gun buddies, sprays (animated ones play), titles (tap to copy), currency, a seasons timeline with the live act, and ranks from Iron to Radiant
- **Global search** (`/` or `Ctrl/⌘ K`) across agents, abilities, weapons, 1,400+ skins, maps, cards, buddies, sprays and titles
- **Shoot the Blind**: Reyna's pixel aim trainer, rebuilt with 30-second rounds, a saved best score, streaks, hit markers and touch support
- Phone-first layout with a bottom tab bar, lazy-loaded images, deep links, keyboard support and reduced-motion support

## Files
- `index.html`: the app shell
- `styles.css`: the design system (dark tactical UI, Valorant red `#ff4655`, teal `#3df5c8`)
- `app.js`: data, routing and every page
- `game.js`: the aim trainer

The previous design is kept on the `pre-redesign-backup` branch.

---
Not affiliated with Riot Games. VALORANT and all related assets are trademarks of Riot Games, Inc.
