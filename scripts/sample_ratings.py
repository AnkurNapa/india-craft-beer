"""Generate clearly labelled SAMPLE ratings so the rankings have something to show.

Real ratings replace this file as the community adds them via GitHub issues.
Run: python3 scripts/sample_ratings.py
"""
import json
import random
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIVE_YEARS = 1826

rng = random.Random(91)
today = date.today()
beers = json.loads((ROOT / "data/beers.json").read_text())

ratings = []
for beer in beers:
    base = rng.uniform(3.1, 4.4)
    for _ in range(rng.randint(12, 60)):
        # Skew towards recent dates so the week and month windows are populated.
        days_ago = int(FIVE_YEARS * rng.random() ** 2.5)
        score = min(5, max(1, round((base + rng.gauss(0, 0.5)) * 4) / 4))
        ratings.append({"beer": beer["id"], "score": score, "date": str(today - timedelta(days=days_ago))})

ratings.sort(key=lambda r: r["date"], reverse=True)
out = {"sample": True, "ratings": ratings}
(ROOT / "data/ratings.json").write_text(json.dumps(out, indent=1) + "\n")
print(f"{len(ratings)} sample ratings written")
