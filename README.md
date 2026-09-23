# Tap List India

A craft beer guide for India, built for the phone in your hand at the bar. Find the best beer near you this week, this month, this year or across five years, see what to eat with it, get directions, and keep a list of what you've tried.

Live at **https://ankurnapa.github.io/india-craft-beer/**

## What's in it

It works like a food delivery app, for beer:

- **Home:** pick your city (or tap *Use my current location*), choose a mood from the style circles, filter with chips, browse collections like *Wheat and wit* or *Dark and roasty*, and scroll brewery cards.
- **Beers:** every beer as a tile, with a **Tried +** button. Sort by top rated this week, month, year or five years, nearest, or A to Z.
- **Venue pages** read like a restaurant menu: the tap list grouped by style, each beer with what to eat with it.
- **Tried:** the mug in the header is your list, with suggestions for what to try next. Saved on your phone only.
- **Map** and **History**, the story of Indian brewing from 1830 to today with every milestone sourced.

There are no photos. Each beer is drawn as a glass in its style's real colour, from its typical SRM through the standard SRM-to-RGB table.

It is a static site with no build step, hosted free on GitHub Pages. Code is split by job: `ctx.js` (data and state), `ui.js` (DOM builders), `views.js` (Home, Beers, History), `sheets.js` (venue and beer pages, city, sort, tried), `map.js`, `app.js` (shell).

## Where the data comes from

**Venues and beers** come from a research sweep done in September 2026, region by region, with every venue checked against a current source (the brewery's own site, Zomato, Untappd, Tripadvisor, news) and every beer named by a source. Closed venues are left out. Map pins come from OpenStreetMap or from geocoding the address; a venue with no reliable pin is listed but not mapped.

To refresh it, run a new sweep into `data/raw/region-*.json` using the brief in `data/raw/RESEARCH_BRIEF.md`, then:

```sh
python3 scripts/merge_research.py   # merges region-*, then verify-* (overrides), then gaps-* (adds)
python3 scripts/test_merge.py
```

The merge only lets through open venues with a source, beers with a known style, and pins inside India.

**Ratings** come from drinkers. Every beer has a **Rate it** link that opens a prefilled GitHub issue; a maintainer adds approved ratings to `data/ratings.json`. The site launched with no ratings, so the rankings start with the first real ones.

Zomato, Swiggy, Untappd and RateBeer are not scraped. None of them has an open API, and scraping breaks their terms. The site links out to them instead.

## Spotted a mistake?

Every venue has a **Report closed or wrong** link. Open an issue, or send a pull request against `data/venues.json` or `data/beers.json`.

## How the ranking works

`rank.js` takes a Bayesian average: every beer starts with five imaginary ratings of 3.5, so one lucky 5 cannot beat a beer that has scored 4.5 twenty times. Tune `PRIOR_MEAN` and `PRIOR_WEIGHT`.

## Run it locally

```sh
python3 -m http.server 8000      # then open http://localhost:8000
node rank.test.mjs && node geo.test.mjs
```

Map data © OpenStreetMap contributors. Drink responsibly.
