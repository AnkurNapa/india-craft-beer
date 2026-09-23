"""Merge the regional research files in data/raw/region-*.json into data/venues.json and data/beers.json.

Only what passes the gate goes live: an open venue with at least one source, known style,
coordinates inside India (otherwise the pin is dropped, the venue stays listed).
Run: python3 scripts/merge_research.py [region ...]   (no args = every region file)
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KINDS = {"brewpub", "microbrewery", "taproom", "packaged"}
STYLES = {"Belgian Wit", "Hefeweizen", "Blonde Ale", "Lager", "Strong Lager", "Kölsch", "Pale Ale",
          "IPA", "Saison", "Porter", "Stout", "Sour", "Belgian Ale"}
INDIA_BOX = (6.0, 37.5, 68.0, 97.5)  # lat min, lat max, lng min, lng max
# Towns people search under a bigger name: the town becomes the area.
CITY_ALIAS = {"bangalore": "Bengaluru", "gurgaon": "Gurugram", "thane": "Mumbai", "navimumbai": "Mumbai",
              "calangute": "Goa", "candolim": "Goa", "mopa": "Goa", "panaji": "Goa", "panjim": "Goa",
              "anjuna": "Goa", "vagator": "Goa", "margao": "Goa", "baga": "Goa", "newdelhi": "Delhi",
              "secunderabad": "Hyderabad", "mohali": "Chandigarh", "panchkula": "Chandigarh"}
VENUE_KEYS = ["id", "name", "kind", "city", "area", "address", "lat", "lng", "cities", "sources", "note"]


def norm(text):
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def is_url(s):
    return isinstance(s, str) and s.startswith(("http://", "https://"))


def in_india(v):
    lat, lng = v.get("lat"), v.get("lng")
    return isinstance(lat, (int, float)) and isinstance(lng, (int, float)) \
        and INDIA_BOX[0] <= lat <= INDIA_BOX[1] and INDIA_BOX[2] <= lng <= INDIA_BOX[3]


def merge(only=()):
    venues, beers, id_map, by_key = {}, {}, {}, {}
    dropped = Counter()

    for path in sorted((ROOT / "data/raw").glob("region-*.json")):
        if only and path.stem.removeprefix("region-") not in only:
            continue
        data = json.loads(path.read_text())
        for v in data.get("venues", []):
            sources = [s for s in v.get("sources", []) if is_url(s)]
            if v.get("status", "open") != "open" or v.get("kind") not in KINDS or not sources or not v.get("name"):
                dropped["venue failed gate"] += 1
                continue
            alias = CITY_ALIAS.get(norm(v.get("city")))
            if alias and alias != v["city"]:
                v = {**v, "city": alias, "area": v.get("area") or v["city"]}
            if v["kind"] != "packaged" and not v.get("city"):
                dropped["venue without city"] += 1
                continue
            key = (norm(v["name"]), norm(v.get("city")), norm(v.get("area")))
            if key in by_key:  # same place from two regions: keep the first, pool the sources
                id_map[v["id"]] = by_key[key]
                venues[by_key[key]]["sources"] = list(dict.fromkeys(venues[by_key[key]]["sources"] + sources))
                continue
            clean = {k: v[k] for k in VENUE_KEYS if v.get(k) not in (None, "", [])}
            clean["sources"] = sources
            if clean["kind"] != "packaged" and not in_india(clean):
                clean.pop("lat", None)
                clean.pop("lng", None)
                dropped["pin outside India or missing"] += 1
            venues[v["id"]] = clean
            by_key[key] = id_map[v["id"]] = v["id"]

        for b in data.get("beers", []):
            ids = [id_map[i] for i in b.get("venues", []) if i in id_map]
            if b.get("style") not in STYLES or not ids or not is_url(b.get("source")) or not b.get("name"):
                dropped["beer failed gate"] += 1
                continue
            if b["id"] in beers:
                beers[b["id"]]["venues"] = list(dict.fromkeys(beers[b["id"]]["venues"] + ids))
                continue
            beers[b["id"]] = {"id": b["id"], "name": b["name"], "style": b["style"], "venues": ids, "source": b["source"]}

    # The gate's own invariants: every beer points at a live venue, ids are unique.
    assert all(i in venues for b in beers.values() for i in b["venues"])
    assert len({v["id"] for v in venues.values()}) == len(venues)
    return list(venues.values()), list(beers.values()), dropped


def dump(path, rows):
    path.write_text("[\n" + ",\n".join("  " + json.dumps(r, ensure_ascii=False) for r in rows) + "\n]\n")


if __name__ == "__main__":
    venues, beers, dropped = merge(sys.argv[1:])
    venues.sort(key=lambda v: (v["kind"] == "packaged", v.get("city", ""), v["name"]))
    dump(ROOT / "data/venues.json", venues)
    dump(ROOT / "data/beers.json", beers)
    cities = Counter(v["city"] for v in venues if v["kind"] != "packaged")
    print(f"{len(venues)} venues, {len(beers)} beers, {sum(1 for v in venues if 'lat' in v)} pinned")
    print("by city:", ", ".join(f"{c} {n}" for c, n in cities.most_common()))
    print("dropped:", dict(dropped) or "nothing")
