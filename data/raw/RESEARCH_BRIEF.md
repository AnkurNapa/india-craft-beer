# Brewery research brief (Tap List India)

Goal: a complete, current, sourced list of every craft brewery, brewpub and microbrewery operating in your region of India, with the beers each one currently pours, so beer lovers can decide where to go and what to drink. Today is 2026-09-23.

## Rules

1. **Nothing from memory.** Every venue and every beer needs at least one source URL you actually opened or saw in search results: the brewery's own site or Instagram, Untappd, Zomato, Swiggy Dineout, EazyDiner, magicpin, Tripadvisor, a city craft-beer guide, or a news article. Prefer sources from 2025 or 2026.
2. **Status matters most.** Many Indian brewpubs have closed since 2020. Only list a venue as `open` if a 2025/2026 source shows it trading (recent reviews, current menu, events, bookings). Closed or "closed down" listings go in `closed`. Temporarily closed goes in `closed` with a note.
3. **Only real beer names.** List a beer only when a source names it. Do not invent "House IPA" style placeholders. If you cannot find named beers, list the venue with no beers; that is fine.
4. **Style** must be one of: Belgian Wit, Hefeweizen, Blonde Ale, Lager, Strong Lager, Kölsch, Pale Ale, IPA, Saison, Porter, Stout, Sour, Belgian Ale, Non-alcoholic (any beer under 0.5% ABV, whatever its base style). Pick the closest (a Helles or Pilsner is Lager, an APA is Pale Ale, a NEIPA or DIPA is IPA, a Gose or fruit sour is Sour, a Dubbel or Tripel is Belgian Ale, a Dunkel or Bock is Strong Lager if above 6.5% ABV else Lager).
5. **Coordinates.** First look for the venue in `data/raw/osm_candidates.json` (OpenStreetMap, trustworthy coordinates) and use those. Otherwise geocode the full address with Nominatim: `curl -s -A "TapListIndia/0.1 (github.com/AnkurNapa/india-craft-beer)" "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=<url-encoded address>"`, at most one request per second. If neither works, omit lat/lng and set `"geo": "missing"`. Never guess coordinates.
6. **Chains:** each outlet that brews on site is its own venue (for example Byg Brewski Hennur and Byg Brewski Sarjapur). An outlet that only serves beer brewed elsewhere is still a venue, with `"kind": "taproom"`.
7. Only research your region. Do not edit any file except your own output file.

## Output

Write valid JSON (UTF-8, no comments) to `data/raw/region-<key>.json`:

```json
{
  "region": "karnataka",
  "venues": [
    {
      "id": "bengaluru-toit-indiranagar",
      "name": "Toit",
      "kind": "brewpub",
      "city": "Bengaluru",
      "area": "Indiranagar",
      "address": "298, 100 Feet Rd, Indiranagar, Bengaluru 560038",
      "lat": 12.979, "lng": 77.6408,
      "status": "open",
      "sources": ["https://toit.in/restaurant/toit-bangalore/"]
    }
  ],
  "beers": [
    { "id": "toit-tint-in-wit", "name": "Tint-In-Wit", "style": "Belgian Wit", "venues": ["bengaluru-toit-indiranagar"], "source": "https://toit.in/" }
  ],
  "closed": [
    { "name": "The Barking Deer", "city": "Mumbai", "note": "closed down", "source": "https://..." }
  ]
}
```

- `id`: kebab-case, venue ids start with the city slug.
- `kind`: `brewpub` (brews and serves on site), `microbrewery` (production brewery, may have a tasting room), `taproom` (serves a brand brewed elsewhere) or `packaged` (bottled or canned brand; use `"cities": [...]` where it is sold instead of city, area, lat and lng).
- Validate before finishing: `python3 -c "import json;d=json.load(open('data/raw/region-<key>.json'));print(len(d['venues']),'venues',len(d['beers']),'beers',len(d['closed']),'closed')"`.

## Final reply

Three lines only: counts, which cities you covered, and anything you could not verify.
