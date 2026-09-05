"""Import Overture Maps places into the Locatogo India Atlas."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BBOX = (68.0, 6.5, 97.5, 35.5)
RELEASE = "2026-08-19.0"
TENANT_SLUG = "locatogo-atlas"
DOMAIN_SLUG = "india-atlas"
DEFAULT_BATCH_SIZE = 500

CATEGORY_MAP = {
    "school": "schools-education", "university": "schools-education", "college": "schools-education", "training_center": "schools-education",
    "restaurant": "restaurants-cafes", "cafe": "restaurants-cafes", "bakery": "restaurants-cafes", "fast_food": "restaurants-cafes", "food_court": "restaurants-cafes",
    "hospital": "hospitals-clinics", "clinic": "hospitals-clinics", "doctor": "hospitals-clinics", "dentist": "hospitals-clinics", "pharmacy": "hospitals-clinics",
    "hotel": "hotels-accommodation", "hostel": "hotels-accommodation", "guest_house": "hotels-accommodation", "resort": "hotels-accommodation", "lodge": "hotels-accommodation",
    "shopping_mall": "shopping-malls", "supermarket": "shopping-malls", "department_store": "shopping-malls", "marketplace": "shopping-malls",
    "bank": "banks-finance", "atm": "banks-finance", "money_transfer": "banks-finance", "insurance": "banks-finance",
    "coworking_space": "tech-coworking", "it_company": "tech-coworking", "software_company": "tech-coworking",
    "temple": "temples-religious", "mosque": "temples-religious", "church": "temples-religious", "gurudwara": "temples-religious", "monastery": "temples-religious",
    "government_office": "government-public", "post_office": "government-public", "court": "government-public", "police_station": "government-public", "fire_station": "government-public",
    "fuel_station": "petrol-automotive", "car_repair": "petrol-automotive", "car_wash": "petrol-automotive", "car_dealer": "petrol-automotive",
    "gym": "gyms-sports", "sports_club": "gyms-sports", "swimming_pool": "gyms-sports", "yoga_studio": "gyms-sports", "stadium": "gyms-sports",
    "beauty_salon": "beauty-spa", "spa": "beauty-spa", "barber_shop": "beauty-spa", "massage": "beauty-spa",
    "cinema": "entertainment-nightlife", "theater": "entertainment-nightlife", "nightclub": "entertainment-nightlife", "bar": "entertainment-nightlife", "pub": "entertainment-nightlife", "amusement_park": "entertainment-nightlife",
    "park": "parks-recreation", "garden": "parks-recreation", "playground": "parks-recreation", "nature_reserve": "parks-recreation",
    "bus_station": "transportation", "train_station": "transportation", "metro_station": "transportation", "airport": "transportation", "taxi_stand": "transportation",
    "grocery_store": "groceries-daily-needs", "convenience_store": "groceries-daily-needs", "butcher": "groceries-daily-needs", "vegetable_market": "groceries-daily-needs",
    "lawyer": "professional-services", "accountant": "professional-services", "consultant": "professional-services", "real_estate_agent": "professional-services",
    "clothing_store": "independent-retail", "electronics_store": "independent-retail", "bookstore": "independent-retail", "jewelry_store": "independent-retail",
    "community_center": "community-nonprofit", "ngo": "community-nonprofit", "library": "community-nonprofit", "museum": "community-nonprofit",
}
CATEGORY_NAMES = {
    slug: name for slug, name in [
        ("schools-education", "Schools & Education"), ("restaurants-cafes", "Restaurants & Cafes"),
        ("hospitals-clinics", "Hospitals & Clinics"), ("hotels-accommodation", "Hotels & Accommodation"),
        ("shopping-malls", "Shopping & Malls"), ("banks-finance", "Banks & Finance"),
        ("tech-coworking", "Tech & Coworking"), ("temples-religious", "Temples & Religious"),
        ("government-public", "Government & Public"), ("petrol-automotive", "Petrol & Automotive"),
        ("gyms-sports", "Gyms & Sports"), ("beauty-spa", "Beauty & Spa"),
        ("entertainment-nightlife", "Entertainment & Nightlife"), ("parks-recreation", "Parks & Recreation"),
        ("transportation", "Transportation"), ("groceries-daily-needs", "Groceries & Daily Needs"),
        ("professional-services", "Professional Services"), ("independent-retail", "Independent Retail"),
        ("community-nonprofit", "Community & Non-Profit"), ("other", "Other"),
    ]
}

class PlaceRejected(ValueError):
    pass


def as_text(value: Any) -> str | None:
    if isinstance(value, dict):
        value = value.get("value") or value.get("name") or value.get("url")
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def first_value(value: Any) -> str | None:
    if isinstance(value, list):
        return first_value(value[0]) if value else None
    return as_text(value)


def category_slug(raw: Any) -> str:
    raw = first_value(raw)
    return CATEGORY_MAP.get(raw.strip().lower().replace(" ", "_") if raw else "", "other")


def point_coordinates(geometry: Any) -> tuple[float, float] | None:
    if geometry is None:
        return None
    if hasattr(geometry, "x") and hasattr(geometry, "y"):
        return float(geometry.x), float(geometry.y)
    if isinstance(geometry, dict):
        coordinates = geometry.get("coordinates")
        if isinstance(coordinates, (list, tuple)) and len(coordinates) >= 2:
            return float(coordinates[0]), float(coordinates[1])
    if isinstance(geometry, (bytes, bytearray)):
        try:
            from shapely import wkb
            parsed = wkb.loads(bytes(geometry))
            return float(parsed.x), float(parsed.y)
        except (ImportError, ValueError, TypeError):
            return None
    return None


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "place"


def unique_slug(title: str, raw: dict[str, Any], sequence: int, seen: set[str]) -> str:
    identity = as_text(raw.get("id")) or f"{title}|{raw.get('geometry')}|{sequence}"
    digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:6]
    candidate = f"{slugify(title)}-{digest}"
    if candidate in seen:
        digest = hashlib.sha256(f"{identity}|{sequence}".encode("utf-8")).hexdigest()[:6]
        candidate = f"{slugify(title)}-{digest}"
    seen.add(candidate)
    return candidate


def map_place(raw: dict[str, Any], category_ids: dict[str, str], sequence: int, seen_slugs: set[str], published_at: str) -> dict[str, Any]:
    names = raw.get("names") or {}
    title = as_text(names.get("primary") if isinstance(names, dict) else names)
    if not title:
        raise PlaceRejected("missing primary name")
    coordinates = point_coordinates(raw.get("geometry"))
    if coordinates is None:
        raise PlaceRejected("missing point geometry")
    longitude, latitude = coordinates
    if not (BBOX[0] <= longitude <= BBOX[2] and BBOX[1] <= latitude <= BBOX[3]):
        raise PlaceRejected("coordinates outside India bounding box")

    address = raw.get("addresses") or []
    address = address[0] if isinstance(address, list) and address else address
    address = address if isinstance(address, dict) else {}
    address_line = as_text(address.get("freeform"))
    if not address_line and isinstance(address.get("address_lines"), list):
        address_line = ", ".join(str(line).strip() for line in address["address_lines"] if str(line).strip())
    address_fallback = False
    if not address_line:
        address_line = as_text(address.get("locality")) or as_text(address.get("region")) or "India"
        address_fallback = True

    brand = raw.get("brand") or {}
    brand_name = as_text(brand.get("names", {}).get("primary")) if isinstance(brand, dict) else None
    category_data = raw.get("categories") or {}
    primary = category_data.get("primary") if isinstance(category_data, dict) else category_data
    category = category_slug(primary)
    category_id = category_ids.get(category) or category_ids.get("other")
    if not category_id:
        raise PlaceRejected(f"missing database category: {category}")
    description_parts = [f"Brand: {brand_name}" if brand_name else None]
    if address_fallback:
        description_parts.append("Address details unavailable in source data")
    return {
        "tenant_id": category_ids["__tenant_id"], "domain_id": category_ids["__domain_id"], "category_id": category_id,
        "owner_user_id": category_ids.get("__owner_user_id"),
        "title": title, "slug": unique_slug(title, raw, sequence, seen_slugs),
        "short_description": "; ".join(part for part in description_parts if part) or None,
        "address_line_1": address_line, "locality": as_text(address.get("locality")),
        "city": as_text(address.get("locality")), "administrative_area": as_text(address.get("region")),
        "country_code": "IN", "postal_code": as_text(address.get("postcode")),
        "latitude": latitude, "longitude": longitude, "website": first_value(raw.get("websites")),
        "phone": first_value(raw.get("phones")), "email": first_value(raw.get("emails")),
        "status": "published", "verification_status": "unverified", "published_at": published_at,
    }


class SupabaseRest:
    def __init__(self, url: str, key: str, retries: int = 4) -> None:
        self.url, self.key, self.retries = url.rstrip("/"), key, retries

    def request(self, method: str, table: str, params: dict[str, str] | None = None, payload: Any = None) -> Any:
        query = f"?{urlencode(params)}" if params else ""
        request = Request(f"{self.url}/rest/v1/{table}{query}", method=method, headers={
            "apikey": self.key, "Authorization": f"Bearer {self.key}", "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        })
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        for attempt in range(self.retries):
            try:
                with urlopen(request, body, timeout=60) as response:
                    content = response.read()
                    return json.loads(content) if content else None
            except (HTTPError, URLError) as error:
                if attempt == self.retries - 1:
                    raise RuntimeError(f"Supabase {method} {table} failed: {error}") from error
                time.sleep(2 ** attempt)


def load_context(client: SupabaseRest, tenant_slug: str, domain_slug: str, domain_name: str, create_domain: bool, owner_user_id: str | None) -> dict[str, str]:
    tenant = client.request("GET", "tenants", {"slug": f"eq.{tenant_slug}", "select": "id", "limit": "1"})
    if not tenant:
        raise RuntimeError(f"Tenant not found: {tenant_slug}")
    domain = client.request("GET", "domains", {"slug": f"eq.{domain_slug}", "tenant_id": f"eq.{tenant[0]['id']}", "select": "id,tenant_id", "limit": "1"})
    if not domain:
        if not create_domain:
            raise RuntimeError(f"Domain not found for tenant: {domain_slug}; rerun with --create-domain")
        domain = client.request("POST", "domains", payload={
            "tenant_id": tenant[0]["id"], "name": domain_name, "slug": domain_slug,
            "description": "Places imported from Overture Maps.", "status": "published",
        })
        if not domain:
            raise RuntimeError(f"Could not create domain: {domain_slug}")
        client.request("POST", "directory_settings", payload={
            "domain_id": domain[0]["id"], "default_timezone": "Asia/Kolkata", "default_language": "en",
            "geographic_scope_type": "country", "geographic_scope_json": {"country_code": "IN", "bbox": list(BBOX)},
        })
    categories = client.request("GET", "categories", {"tenant_id": f"eq.{tenant[0]['id']}", "domain_id": f"eq.{domain[0]['id']}", "select": "id,slug", "limit": "100"})
    category_ids = {item["slug"]: item["id"] for item in categories or []}
    missing = [slug for slug in CATEGORY_NAMES if slug not in category_ids]
    if missing:
        created = client.request("POST", "categories", payload=[{
            "tenant_id": tenant[0]["id"], "domain_id": domain[0]["id"], "name": CATEGORY_NAMES[slug],
            "slug": slug, "sort_order": index + 1, "is_active": True,
        } for index, slug in enumerate(missing)])
        if created:
            category_ids.update({item["slug"]: item["id"] for item in created})
    category_ids["__tenant_id"], category_ids["__domain_id"] = tenant[0]["id"], domain[0]["id"]
    if owner_user_id:
        category_ids["__owner_user_id"] = owner_user_id
    if len(category_ids) < 22 or "other" not in category_ids:
        raise RuntimeError("Atlas taxonomy is incomplete; expected 20 categories")
    return category_ids


def read_places(path: Path) -> Iterable[dict[str, Any]]:
    try:
        import pyarrow.parquet as parquet
    except ImportError as error:
        raise RuntimeError("Install scripts/overture/requirements.txt first") from error
    parquet_file = parquet.ParquetFile(path)
    for batch in parquet_file.iter_batches(batch_size=512):
        yield from batch.to_pylist()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--sample", type=int)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--tenant-slug", default=TENANT_SLUG, help="Existing application tenant slug")
    parser.add_argument("--domain-slug", default=DOMAIN_SLUG, help="Existing application domain slug")
    parser.add_argument("--domain-name", default="India Atlas", help="Name used with --create-domain")
    parser.add_argument("--create-domain", action="store_true", help="Create the target domain and categories if missing")
    parser.add_argument("--owner-user-id", help="User UUID stored as owner_user_id on imported listings")
    args = parser.parse_args()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not args.dry_run and (not url or not key):
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    if args.batch_size < 1:
        raise RuntimeError("--batch-size must be greater than zero")
    client = SupabaseRest(url, key) if not args.dry_run else None
    category_ids = load_context(client, args.tenant_slug, args.domain_slug, args.domain_name, args.create_domain, args.owner_user_id) if client else {"other": "dry-run-category", "__tenant_id": "dry-run-tenant", "__domain_id": "dry-run-domain"}
    published_at, seen, records, rejected = datetime.now(timezone.utc).isoformat(), set(), [], []
    inserted = 0
    processed = 0
    for sequence, raw in enumerate(read_places(args.input), start=1):
        if args.sample and processed >= args.sample:
            break
        processed += 1
        try:
            records.append(map_place(raw, category_ids, sequence, seen, published_at))
        except (PlaceRejected, TypeError, ValueError) as error:
            rejected.append({"row": sequence, "error": str(error)})
        if len(records) >= args.batch_size and client:
            try:
                client.request("POST", "listings", {"on_conflict": "domain_id,slug"}, records)
                inserted += len(records)
            except RuntimeError as error:
                rejected.append({"batch_end_row": sequence, "error": str(error)})
            records.clear()
    if client and records:
        try:
            client.request("POST", "listings", {"on_conflict": "domain_id,slug"}, records)
            inserted += len(records)
        except RuntimeError as error:
            rejected.append({"batch_end_row": processed, "error": str(error)})
    manifest = {"release": RELEASE, "bbox": BBOX, "input": str(args.input), "processed": processed, "mapped": len(seen), "inserted": inserted if client else len(seen), "rejected": len(rejected), "errors": rejected, "dry_run": args.dry_run, "started_at": published_at, "completed_at": datetime.now(timezone.utc).isoformat()}
    if args.manifest:
        args.manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
