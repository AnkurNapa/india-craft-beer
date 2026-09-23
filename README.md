# Tap List India

A craft beer guide for India, built for the phone in your hand at the bar. Find the best beer near you this week, this month, this year or across five years, see what to eat with it, get directions, and keep a list of what you've tried.

Live at **https://ankurnapa.github.io/india-craft-beer/**

## What's in it

- **Top beers:** ranked by city and time window, with an Indian food pairing for every style.
- **Breweries:** every brewpub, microbrewery and taproom we could verify, plus bottled and canned brands. Tap **Near me** to sort by distance; your location never leaves your phone.
- **Map:** every pinned venue, grouped into clusters until you zoom in.
- **Tried:** tick off beers as you drink them and get suggestions for what to try next. Saved on your phone only.
- **History:** Indian beer from the Kasauli brewery of 1830 to today, every milestone linked to its source.

It is a static site with no build step, hosted free on GitHub Pages.

## Where the data comes from

**Venues and beers** come from a research sweep done in September 2026, region by region, with every venue checked against a current source (the brewery's own site, Zomato, Untappd, Tripadvisor, news) and every beer named by a source. Closed venues are left out. Map pins come from OpenStreetMap or from geocoding the address; a venue with no reliable pin is listed but not mapped.

To refresh it, run a new sweep into `data/raw/region-*.json` using the brief in `data/raw/RESEARCH_BRIEF.md`, then:

```sh
python3 scripts/merge_research.py
```

The merge only lets through open venues with a source, beers with a known style, and pins inside India.

**Ratings** come from drinkers. Every beer has a **Rate it** link that opens a prefilled GitHub issue; a maintainer adds approved ratings to `data/ratings.json`. The file currently holds **sample ratings** from `scripts/sample_ratings.py`, flagged on the page, until enough real ones arrive.

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
