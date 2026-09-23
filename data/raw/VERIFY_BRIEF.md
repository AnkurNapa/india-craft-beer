# Verification sweep brief (Tap List India)

The first research sweep was too shallow. Example: District 6, Bengaluru, was listed at "Vaishnavi Sapphire Centre, Tumkur Rd" with no beers, but its own site (district6.in) gives 26/1 Dr Rajkumar Road, Malleshwaram West, and names six house beers (Wheat Beer, Strong Wheat Beer, Lager, Dark Beer, Radler, Märzen). Your job is to fix that kind of gap for every venue in your batch. Today is 2026-09-23.

Also read `data/raw/RESEARCH_BRIEF.md`: its rules (no memory, sources for everything, style list, coordinates, id format, kinds) all still apply.

## For EVERY venue in your batch, in order

1. **Open the brewery's own website first** with WebFetch (guess the domain from the name or the existing sources; try their menu, beers or "our beers" page). Then its Instagram or Facebook page, then Zomato, Swiggy Dineout, EazyDiner, magicpin or Untappd. Budget roughly 2 to 4 fetches per venue; prefer WebFetch on known URLs over WebSearch, which has a limited budget.
2. **Status:** open, temporarily closed or closed, from 2025 or 2026 evidence.
3. **Exact address** from the official source. If it differs from the current one, re-geocode it (Nominatim, as in the research brief). If the official address and the current pin disagree by more than about 1 km, trust the official address.
4. **Every house beer** the sources name, including seasonals currently listed, each with a style from the allowed list. Map descriptive names sensibly: "Wheat Beer" is Hefeweizen unless described as a wit, "Dark Beer" is Porter or Stout by description (a dark lager is Lager), a Radler is Lager, a Märzen or Oktoberfest is Lager (Strong Lager above 6.5% ABV), a Dunkelweizen is Hefeweizen, a cider or mead is skipped.
5. **Other outlets of the same brand** anywhere in India that are open: add each as its own venue (search once per brand, not per outlet).
6. **Area:** the neighbourhood people actually use (e.g. "Malleshwaram", "Indiranagar"), not a whole corridor.

## Output

Write `data/raw/verify-<batch>.json` (for example `verify-3.json`), same schema as the research brief, containing:

- `venues`: every venue from your batch that is open (keep its existing `id` so it replaces the old record) plus any new outlets you found (new ids), each with `status`, `sources` (at least one, the official one first) and `"checked": "2026-09-23"`.
- `beers`: the complete current beer list for each venue. Reuse an existing beer `id` when it is the same beer; new beers get new ids.
- `closed`: venues from your batch that are closed or temporarily closed, with `id`, `name`, `city`, `note`, `source`.
- `unverifiable`: ids you could not confirm either way, with a one-line reason. Keep these few.

Every venue from your batch must appear in exactly one of `venues`, `closed` or `unverifiable`. Validate:

```
python3 -c "import json;d=json.load(open('data/raw/verify-<batch>.json'));b=json.load(open('data/raw/batches/batch-<batch>.json'));ids={v['id'] for v in d['venues']}|{c['id'] for c in d['closed']}|{u['id'] for u in d.get('unverifiable',[])};print('missing:',[x['id'] for x in b if x['id'] not in ids]);print(len(d['venues']),'venues',len(d['beers']),'beers',len(d['closed']),'closed')"
```

`missing` must be empty. Do not edit any other file.

## Final reply

Three lines: counts (verified, new outlets, closed, unverifiable, beers), the biggest corrections you made (addresses moved, closures), and anything left unchecked.
