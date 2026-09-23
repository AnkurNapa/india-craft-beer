"""Checks the verification override in merge_research.merge. Run: python3 scripts/test_merge.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from merge_research import merge

SRC = ["https://example.com"]
region = {"venues": [
    {"id": "blr-d6", "name": "District 6", "kind": "brewpub", "city": "Bengaluru", "area": "Yeshwanthpur", "lat": 13.01, "lng": 77.55, "sources": SRC},
    {"id": "mum-deer", "name": "The Barking Deer", "kind": "brewpub", "city": "Mumbai", "area": "Lower Parel", "lat": 19.0, "lng": 72.8, "sources": SRC},
    {"id": "goa-x", "name": "Goa Place", "kind": "brewpub", "city": "Calangute", "lat": 15.5, "lng": 73.76, "sources": SRC},
    {"id": "blr-wm", "name": "Windmills", "kind": "brewpub", "city": "Bengaluru", "area": "Whitefield", "lat": 12.98, "lng": 77.72, "sources": SRC},
], "beers": [
    {"id": "d6-old", "name": "Old Lager", "style": "Lager", "venues": ["blr-d6"], "source": SRC[0]},
    {"id": "deer-wit", "name": "Deer Wit", "style": "Belgian Wit", "venues": ["mum-deer"], "source": SRC[0]},
]}
verify = {"venues": [
    {"id": "blr-d6", "name": "District 6", "kind": "brewpub", "city": "Bengaluru", "area": "Malleshwaram", "address": "26/1 Dr Rajkumar Road", "lat": 13.0, "lng": 77.555, "status": "open", "sources": SRC},
    {"id": "blr-wm", "name": "Windmills", "kind": "brewpub", "city": "Bengaluru", "area": "Whitefield", "geo": "missing", "status": "open", "sources": SRC},
], "beers": [
    {"id": "d6-wheat", "name": "Wheat Beer", "style": "Hefeweizen", "venues": ["blr-d6"], "source": SRC[0]},
    {"id": "d6-radler", "name": "Radler", "style": "Lager", "venues": ["blr-d6"], "source": SRC[0]},
], "closed": [{"id": "mum-deer", "name": "The Barking Deer"}]}
gaps = {"venues": [
    {"id": "blr-dup", "name": "District 6", "kind": "brewpub", "city": "Bangalore", "area": "Malleshwaram", "sources": ["https://other.example"]},
    {"id": "blr-new", "name": "New Brewpub", "kind": "brewpub", "city": "Bengaluru", "area": "HSR", "lat": 12.9, "lng": 77.6, "sources": SRC},
], "beers": [
    {"id": "new-ipa", "name": "New IPA", "style": "IPA", "venues": ["blr-new"], "source": SRC[0]},
    {"id": "bad", "name": "Cider", "style": "Cider", "venues": ["blr-new"], "source": SRC[0]},
    {"id": "cider", "name": "Apple Cider", "style": "Sour", "venues": ["blr-new"], "source": SRC[0]},
]}

venues, beers, dropped = merge([(region, False), (verify, True), (gaps, False)])
by_id = {v["id"]: v for v in venues}
beer_ids = {b["id"] for b in beers}

assert by_id["blr-d6"]["area"] == "Malleshwaram"                   # verified record replaced the old one
assert "d6-old" not in beer_ids and {"d6-wheat", "d6-radler"} <= beer_ids  # and its tap list
assert "mum-deer" not in by_id and "deer-wit" not in beer_ids     # closed venue and its beers are gone
assert "blr-dup" not in by_id                                      # alias Bangalore to Bengaluru, same place: no duplicate
assert "https://other.example" in by_id["blr-d6"]["sources"]      # but its source is pooled
assert by_id["goa-x"]["city"] == "Goa" and by_id["goa-x"]["area"] == "Calangute"
assert "new-ipa" in beer_ids and "bad" not in beer_ids and "cider" not in beer_ids             # gaps add; unknown styles are refused
assert dropped["closed on verification"] == 1
assert (by_id["blr-wm"]["lat"], by_id["blr-wm"]["lng"]) == (12.98, 77.72)  # re-check lost the pin: old one kept
print("merge ok")
