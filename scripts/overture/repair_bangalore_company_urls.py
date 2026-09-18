"""Repair Bangalore company URLs from the exact fresh Overture source rows."""
from __future__ import annotations

import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

import pyarrow.parquet as pq

DOMAIN_ID = "461e4ee7-7a16-43b3-b342-5a968e44f306"
PARQUET = Path("scripts/overture/bangalore_places_fresh_2026-09-18.parquet")


def load_env() -> tuple[str, str]:
    values: dict[str, str] = {}
    for line in Path(".env").read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            name, value = line.split("=", 1)
            values[name.strip()] = value.strip().strip("'\"")
    url = values.get("NEXT_PUBLIC_SUPABASE_URL") or values.get("SUPABASE_URL")
    key = values.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("Missing Supabase credentials")
    return url.rstrip("/"), key


def text(value: object) -> str:
    return str(value or "").strip()


def source_rows() -> dict[str, list[dict[str, object]]]:
    rows: dict[str, list[dict[str, object]]] = {}
    table = pq.read_table(PARQUET, columns=["names", "websites", "bbox"])
    for row in table.to_pylist():
        name = text((row.get("names") or {}).get("primary"))
        websites = row.get("websites") or []
        bbox = row.get("bbox") or {}
        website = text(websites[0]) if websites else ""
        if not name or not website or not bbox:
            continue
        rows.setdefault(name.casefold(), []).append({
            "website": website,
            "latitude": float(bbox["ymin"]),
            "longitude": float(bbox["xmin"]),
        })
    return rows


def request_json(url: str, key: str, query: str) -> list[dict[str, object]]:
    request = Request(f"{url}/rest/v1/listings?{query}", headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def request_all_listings(url: str, key: str) -> list[dict[str, object]]:
    listings: list[dict[str, object]] = []
    for offset in range(0, 100000, 1000):
        page = request_json(
            url,
            key,
            f"domain_id=eq.{DOMAIN_ID}&company_type=not.is.null&select=id,title,latitude,longitude&limit=1000&offset={offset}",
        )
        listings.extend(page)
        if len(page) < 1000:
            break
    return listings


def patch_url(url: str, key: str, listing_id: str, website: str) -> None:
    request = Request(
        f"{url}/rest/v1/listings?id=eq.{quote(listing_id)}",
        data=json.dumps({"website": website}).encode("utf-8"),
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "return=minimal"},
        method="PATCH",
    )
    with urlopen(request, timeout=60):
        pass


def main() -> None:
    url, key = load_env()
    source = source_rows()
    listings = request_all_listings(url, key)
    repairs: list[tuple[str, str]] = []
    unmatched = 0
    for listing in listings:
        candidates = source.get(text(listing.get("title")).casefold(), [])
        if not candidates:
            unmatched += 1
            continue
        candidate = min(candidates, key=lambda item: abs(float(listing["latitude"]) - float(item["latitude"])) + abs(float(listing["longitude"]) - float(item["longitude"])))
        repairs.append((text(listing["id"]), text(candidate["website"])))

    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = [executor.submit(patch_url, url, key, listing_id, website) for listing_id, website in repairs]
        for completed, future in enumerate(as_completed(futures), start=1):
            future.result()
            if completed % 500 == 0:
                print(f"Repaired {completed:,} / {len(repairs):,} company URLs")

    print(json.dumps({"listings": len(listings), "repaired": len(repairs), "unmatched": unmatched, "source": str(PARQUET)}))


if __name__ == "__main__":
    main()