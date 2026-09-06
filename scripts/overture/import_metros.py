"""
Import top verified places from Overture Maps for 8 Indian Metro Cities
into their respective Locatogo domains, owned by Karthick.
"""
from __future__ import annotations

import argparse
import hashlib
import heapq
import json
import os
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import pyarrow.compute as pc
import pyarrow.parquet as pq

# Bounding boxes and target limits for 8 major Indian metro cities
METROS = {
    'bangalore': {
        'name': 'Bangalore',
        'domain_id': '461e4ee7-7a16-43b3-b342-5a968e44f306',
        'bbox': (77.40, 12.80, 77.82, 13.18),
        'limit': 15000,
    },
    'chennai': {
        'name': 'Chennai',
        'domain_id': '5f4cdbe4-d2c6-45f1-9812-6c8114c62c8b',
        'bbox': (80.05, 12.85, 80.35, 13.25),
        'limit': 15000,
    },
    'mumbai': {
        'name': 'Mumbai',
        'domain_id': 'cbe0a7d8-63d8-4c5b-9a72-4cef88922272',
        'bbox': (72.75, 18.85, 73.15, 19.35),
        'limit': 15000,
    },
    'hyderabad': {
        'name': 'Hyderabad',
        'domain_id': 'c0441a34-5395-4462-9492-e982ab9035c0',
        'bbox': (78.25, 17.20, 78.65, 17.60),
        'limit': 15000,
    },
    'kochi': {
        'name': 'Kochi',
        'domain_id': '2cf6a26b-5672-400e-ac9d-75361d56a842',
        'bbox': (76.15, 9.85, 76.45, 10.15),
        'limit': 12000,
    },
    'delhi': {
        'name': 'Delhi NCR',
        'domain_id': '09f2c99c-be3c-4272-b217-6de226d9edc1',
        'bbox': (76.85, 28.35, 77.50, 28.90),
        'limit': 15000,
    },
    'kolkata': {
        'name': 'Kolkata',
        'domain_id': '4071b01b-b555-4a6a-b92a-4feda0679cac',
        'bbox': (88.20, 22.40, 88.55, 22.75),
        'limit': 15000,
    },
    'pune': {
        'name': 'Pune',
        'domain_id': 'f3ae324b-fa4d-4556-af94-f9a5e343cc41',
        'bbox': (73.70, 18.40, 74.05, 18.70),
        'limit': 15000,
    },
}

TENANT_ID = '1c186ac3-a365-4653-bd47-b87758890dfb'  # karthick
OWNER_USER_ID = 'a3c518b0-52b3-4d92-ac26-6306e30eb01f'  # Karthick

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

CATEGORY_ALIASES = {
    "place_of_worship": "temples-religious", "religious_site": "temples-religious",
    "medical_clinic": "hospitals-clinics", "healthcare": "hospitals-clinics",
    "office": "professional-services", "business": "professional-services",
    "store": "independent-retail", "shop": "independent-retail",
    "supermarket": "shopping-malls", "department_store": "shopping-malls",
    "food_and_drink": "restaurants-cafes", "fast_food_restaurant": "restaurants-cafes",
    "lodging": "hotels-accommodation", "bed_and_breakfast": "hotels-accommodation",
    "railway_station": "transportation", "subway_station": "transportation",
    "parking": "transportation", "post_office": "government-public",
}

CATEGORY_TOKEN_RULES = (
    ("school education college university preschool tutoring training", "schools-education"),
    ("restaurant cafe bakery food dining fast_food indian_restaurant", "restaurants-cafes"),
    ("hospital clinic medical health pharmacy dentist diagnostic", "hospitals-clinics"),
    ("hotel hostel resort accommodation lodging travel tours", "hotels-accommodation"),
    ("bank financial finance atm credit_union insurance", "banks-finance"),
    ("software information_technology it_service computer", "tech-coworking"),
    ("temple hindu religious church mosque worship cathedral", "temples-religious"),
    ("government public_service police fire post_office", "government-public"),
    ("fuel gas_station automotive car_dealer car_repair motorcycle auto_parts", "petrol-automotive"),
    ("gym sports yoga swimming stadium", "gyms-sports"),
    ("beauty salon spa barber massage", "beauty-spa"),
    ("cinema theater nightclub bar pub party event amusement arts entertainment landmark", "entertainment-nightlife"),
    ("park garden playground recreation", "parks-recreation"),
    ("bus train metro railway airport transportation", "transportation"),
    ("grocery supermarket convenience butcher vegetable", "groceries-daily-needs"),
    ("professional real_estate business office consultant lawyer accountant construction developer property", "professional-services"),
    ("clothing electronics mobile_phone jewelry shoe furniture hardware bookstore flowers gifts computer store shopping", "independent-retail"),
    ("community nonprofit library museum", "community-nonprofit"),
)

TECH_PRIMARY_CATEGORIES = {
    "software_development", "information_technology_company",
    "it_service_and_computer_repair", "computer_hardware_company",
    "computer_store", "computer_coaching", "computer_wholesaler",
    "b2b_science_and_technology", "b2b_science_and_technology_service",
    "biotechnology_company", "coworking_space", "it_consultant",
    "event_technology_service", "shared_office_space", "engineering_services",
    "engineering_service",
}

CATEGORY_SLUG_TO_ID = {
    "banks-finance": "21af23e6-c103-4a79-bf0e-bf72b3740813",
    "beauty-spa": "01bf8c3b-4088-4015-9ce9-b7d5a0a2a78e",
    "community-nonprofit": "88d882cb-1de3-4556-86d0-662bf8055661",
    "creative-arts": "e8ac6702-0863-4ba5-9c12-8107b2ce1f6c",
    "entertainment-nightlife": "15561d0f-732f-4f3b-8067-95ddf9e22853",
    "government-public": "3927d625-e91f-4062-9a3c-e6ca9914c1db",
    "groceries-daily-needs": "2d8c103d-34b8-4f1b-b9f4-ad63ba863220",
    "gyms-sports": "da0d347d-db5d-4f5a-b63b-c43b7e30a7ae",
    "health-wellness": "729db55e-310b-4935-a61a-850ad8ba5447",
    "hospitals-clinics": "fc153809-2f83-4a1a-8c55-28fbe1fd697f",
    "hospitals-healthcare": "6d5afe4b-c176-4565-95a6-9831bc33e847",
    "hotels-accommodation": "dda003b2-8b08-4754-9897-66e896f30cc2",
    "independent-retail": "30f7de05-0195-4220-be9b-be617059f124",
    "other": "c8ed542f-55b6-404a-8013-b4c60c45f4f6",
    "parks-recreation": "155eb851-8af7-40ad-a2c7-6999f76e53ea",
    "petrol-automotive": "f5810d95-f330-438e-8ebc-05ec6bebd6d8",
    "petrol-bunks-fuel": "c9876f27-bb55-4529-a22c-c104455d0c99",
    "professional-services": "c62cef47-2aae-4a6b-888e-a019eace2f47",
    "restaurants-cafes": "831abfbb-c697-4271-8936-f0db15391fb0",
    "schools-education": "6000ef39-e152-43d5-8320-0d50d379dfab",
    "shopping-malls": "0d9acf87-1d8f-460c-a0d2-9728994a4a86",
    "tech-coworking": "54f2fdaa-7953-4cd4-bdfa-9c6053fb8838",
    "temples-religious": "1b799dbc-fe40-4fbd-9561-b3beeffa4851",
    "transportation": "8aef3ff5-9a03-4f4d-a8c0-ac8f145acabd",
}


def load_env() -> tuple[str, str]:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        env_file = Path(".env")
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k, v = k.strip(), v.strip().strip("'\"")
                if k == "NEXT_PUBLIC_SUPABASE_URL" and not url:
                    url = v
                elif k == "SUPABASE_SERVICE_ROLE_KEY" and not key:
                    key = v
    if not (url and key):
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return url.rstrip("/"), key


def as_text(value: Any) -> str | None:
    if isinstance(value, dict):
        value = value.get("value") or value.get("name") or value.get("url")
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def first_val(value: Any) -> str | None:
    if isinstance(value, list):
        return first_val(value[0]) if value else None
    return as_text(value)


def category_id_for(raw_cat: Any, category_ids: dict[str, str]) -> str:
    raw = first_val(raw_cat)
    normalized = raw.strip().lower().replace(" ", "_") if raw else ""
    normalized = normalized.split(":")[-1]
    slug = CATEGORY_MAP.get(normalized) or CATEGORY_ALIASES.get(normalized)
    if not slug:
        slug = next(
            (target for tokens, target in CATEGORY_TOKEN_RULES
             if any(token in normalized for token in tokens.split())),
            "other",
        )
    return category_ids.get(slug) or category_ids["other"]


def slugify(val: str) -> str:
    val = unicodedata.normalize("NFKD", val).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", val).strip("-") or "place"


def make_clean_slug(title: str, raw_id: str, seq: int, seen: set[str]) -> str:
    cleaned = slugify(title)[:40].rstrip("-")
    if not cleaned:
        cleaned = "place"
    hash_id = hashlib.sha256(f"{raw_id}:{seq}".encode()).hexdigest()[:6]
    candidate = re.sub(r"-+", "-", f"{cleaned}-{hash_id}").strip("-")
    if candidate in seen or not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", candidate):
        candidate = re.sub(r"-+", "-", f"place-{hash_id}-{seq}").strip("-")
    seen.add(candidate)
    return candidate


def calculate_quality_score(raw: dict[str, Any]) -> float:
    score = (raw.get("confidence") or 0.5) * 10.0
    if raw.get("websites"):
        score += 8.0
    if raw.get("phones"):
        score += 8.0
    if raw.get("emails"):
        score += 4.0
    if raw.get("brand"):
        score += 5.0
    addrs = raw.get("addresses") or []
    if addrs and isinstance(addrs, list) and addrs[0].get("freeform"):
        score += 6.0
    return score


class SupabaseClient:
    def __init__(self, url: str, key: str) -> None:
        self.url = url
        self.key = key

    def insert_batch(self, records: list[dict[str, Any]]) -> None:
        req = Request(
            f"{self.url}/rest/v1/listings?on_conflict=domain_id,slug",
            data=json.dumps(records).encode("utf-8"),
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            method="POST",
        )
        for attempt in range(5):
            try:
                with urlopen(req, timeout=90) as resp:
                    resp.read()
                    return
            except HTTPError as err:
                body = err.read().decode("utf-8")
                print(f"Supabase HTTPError 400 details: {body}", file=sys.stderr)
                if attempt == 4:
                    raise RuntimeError(f"Insert failed: {err} -> {body}")
                time.sleep(2 ** attempt)
            except URLError as err:
                if attempt == 4:
                    raise RuntimeError(f"Insert failed: {err}")
                time.sleep(2 ** attempt)

    def get(self, table: str, params: str) -> list[dict[str, Any]]:
        for attempt in range(5):
            req = Request(
                f"{self.url}/rest/v1/{table}?{params}",
                headers={"apikey": self.key, "Authorization": f"Bearer {self.key}"},
                method="GET",
            )
            try:
                with urlopen(req, timeout=60) as resp:
                    return json.loads(resp.read().decode("utf-8"))
            except (HTTPError, URLError):
                if attempt == 4:
                    raise
                time.sleep(2 ** attempt)
        raise RuntimeError(f"Could not read {table}")

    def delete_all_listings(self) -> None:
        for attempt in range(5):
            req = Request(
                f"{self.url}/rest/v1/listings?id=not.is.null",
                headers={
                    "apikey": self.key,
                    "Authorization": f"Bearer {self.key}",
                    "Prefer": "return=minimal",
                },
                method="DELETE",
            )
            try:
                with urlopen(req, timeout=120) as resp:
                    resp.read()
                    return
            except HTTPError as err:
                body = err.read().decode("utf-8", errors="replace")
                print(f"Supabase reset error ({err.code}): {body}", file=sys.stderr)
                if attempt == 4:
                    raise RuntimeError(f"Could not delete existing listings: {err}") from err
                time.sleep(2 ** attempt)
            except URLError:
                if attempt == 4:
                    raise
                time.sleep(2 ** attempt)

    def delete_tech_listings(self) -> None:
        self.delete_rows("company_jobs", "id=not.is.null")
        listing_rows: list[dict[str, Any]] = []
        for offset in range(0, 1_000_000, 1_000):
            page = self.get(
                "listings",
                f"company_type=not.is.null&select=id&limit=1000&offset={offset}",
            )
            listing_rows.extend(page)
            if len(page) < 1_000:
                break
        listing_ids = [row["id"] for row in listing_rows if row.get("id")]
        for start in range(0, len(listing_ids), 250):
            ids = ",".join(listing_ids[start:start + 250])
            self.delete_rows("listings", f"id=in.({ids})")

    def delete_rows(self, table: str, params: str) -> None:
        req = Request(
            f"{self.url}/rest/v1/{table}?{params}",
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Prefer": "return=minimal",
            },
            method="DELETE",
        )
        with urlopen(req, timeout=120) as resp:
            resp.read()

    def resolve_import_ids(self) -> tuple[str, dict[str, str]]:
        tenant_rows = self.get("tenants", "slug=eq.karthick&select=id")
        if not tenant_rows:
            raise RuntimeError("Tenant karthick not found")
        tenant_id = tenant_rows[0]["id"]
        domains = self.get(
            "domains",
            f"tenant_id=eq.{tenant_id}&slug=in.({','.join(METROS)})&select=id,slug",
        )
        domain_ids = {row["slug"]: row["id"] for row in domains}
        missing_domains = sorted(set(METROS) - set(domain_ids))
        if missing_domains:
            raise RuntimeError(f"Metro domains not found: {', '.join(missing_domains)}")

        categories = self.get(
            "categories",
            f"tenant_id=eq.{tenant_id}&domain_id=is.null&select=id,slug",
        )
        category_ids = {row["slug"]: row["id"] for row in categories}
        if "other" not in category_ids:
            raise RuntimeError("Global 'other' category not found")
        return tenant_id, {**category_ids, **{f"domain:{slug}": domain_ids[slug] for slug in domain_ids}}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--parquet", default="scripts/overture/india_places.parquet", type=Path)
    parser.add_argument("--batch-size", default=500, type=int)
    parser.add_argument("--city", help="Specific city to import (e.g. bangalore)")
    parser.add_argument(
        "--reset-listings",
        action="store_true",
        help="Delete every existing listing before importing; domains and categories remain",
    )
    parser.add_argument(
        "--tech-only",
        action="store_true",
        help="Import only Overture technology and engineering places as Tech Atlas companies",
    )
    parser.add_argument(
        "--reset-tech",
        action="store_true",
        help="Delete existing company listings and jobs before a Tech-only import",
    )
    args = parser.parse_args()

    url, key = load_env()
    client = SupabaseClient(url, key)
    if args.reset_listings:
        print("⚠️  Deleting all existing listings before import...")
        client.delete_all_listings()
        print("✅ Existing listings deleted")
    if args.reset_tech:
        print("⚠️  Deleting existing Tech Atlas companies and jobs...")
        client.delete_tech_listings()
        print("✅ Existing Tech Atlas companies deleted")
    tenant_id, resolved_ids = client.resolve_import_ids()

    target_metros = {args.city: METROS[args.city]} if args.city and args.city in METROS else METROS
    print(f"🎯 Target Metros to import: {list(target_metros.keys())}")

    f = pq.ParquetFile(args.parquet)
    rg_count = f.num_row_groups
    print(f"📦 Parquet loaded: {f.metadata.num_rows:,} total rows across {rg_count} row groups")

    published_at = datetime.now(timezone.utc).isoformat()

    for metro_key, cfg in target_metros.items():
        print(f"\n==========================================")
        print(f"🏙️  Processing {cfg['name']} (domain: /{metro_key})")
        print(f"==========================================")
        min_lon, min_lat, max_lon, max_lat = cfg["bbox"]
        target_limit = cfg["limit"]
        domain_id = resolved_ids[f"domain:{metro_key}"]

        # Keep only the best rows needed for this city instead of retaining the
        # entire bbox in memory.
        collected_candidates: list[tuple[float, int, float, float, str, dict[str, Any]]] = []
        candidate_sequence = 0
        seen_slugs = set()

        for i in range(rg_count):
            col = f.read_row_group(i, columns=["bbox"])["bbox"]
            xs = pc.struct_field(col, "xmin")
            ys = pc.struct_field(col, "ymin")
            rg_min_x, rg_max_x = pc.min(xs).as_py(), pc.max(xs).as_py()
            rg_min_y, rg_max_y = pc.min(ys).as_py(), pc.max(ys).as_py()

            # Skip row groups outside city bbox
            if rg_max_x < min_lon or rg_min_x > max_lon or rg_max_y < min_lat or rg_min_y > max_lat:
                continue

            # Load only fields used for scoring and record creation.
            rg_table = f.read_row_group(i, columns=[
                "id", "names", "bbox", "addresses", "categories", "confidence",
                "websites", "phones", "emails", "brand",
            ])
            rg_rows = rg_table.to_pylist()

            for row in rg_rows:
                bbox = row.get("bbox") or {}
                lon, lat = bbox.get("xmin"), bbox.get("ymin")
                if lon is None or lat is None:
                    continue
                if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
                    continue

                names = row.get("names") or {}
                title = as_text(names.get("primary") if isinstance(names, dict) else names)
                if not title:
                    continue

                raw_categories = row.get("categories") or {}
                primary_category = raw_categories.get("primary") if isinstance(raw_categories, dict) else raw_categories
                if args.tech_only and primary_category not in TECH_PRIMARY_CATEGORIES:
                    continue

                score = calculate_quality_score(row)
                candidate_sequence += 1
                candidate = (score, candidate_sequence, lon, lat, title, row)
                if len(collected_candidates) < target_limit:
                    heapq.heappush(collected_candidates, candidate)
                elif candidate > collected_candidates[0]:
                    heapq.heapreplace(collected_candidates, candidate)

        print(f"  🔍 Retained top {len(collected_candidates):,} places in {cfg['name']} bbox")

        # Restore deterministic quality order after bounded collection.
        top_places = sorted(collected_candidates, key=lambda x: (x[0], x[1]), reverse=True)
        print(f"  ⭐ Selected top {len(top_places):,} highest quality places for import")

        records_to_insert = []
        inserted_count = 0
        batch_num = 0

        for seq, (score, _candidate_sequence, lon, lat, title, raw) in enumerate(top_places, start=1):
            addr_list = raw.get("addresses") or []
            first_addr = addr_list[0] if isinstance(addr_list, list) and addr_list else {}
            addr_line = as_text(first_addr.get("freeform"))
            if not addr_line and isinstance(first_addr.get("address_lines"), list):
                addr_line = ", ".join(str(l).strip() for l in first_addr["address_lines"] if str(l).strip())
            if not addr_line:
                addr_line = as_text(first_addr.get("locality")) or cfg["name"]

            raw_cat = raw.get("categories") or {}
            primary_cat = raw_cat.get("primary") if isinstance(raw_cat, dict) else raw_cat
            cat_id = category_id_for(primary_cat, resolved_ids)

            raw_id = as_text(raw.get("id")) or f"{title}|{seq}"
            slug_title = f"tech-{title}" if args.tech_only else title
            slug = make_clean_slug(slug_title, raw_id, seq, seen_slugs)

            brand = raw.get("brand") or {}
            brand_name = as_text(brand.get("names", {}).get("primary")) if isinstance(brand, dict) else None
            short_desc = f"Brand: {brand_name}" if brand_name else None

            record = {
                "tenant_id": tenant_id,
                "domain_id": domain_id,
                "category_id": resolved_ids["tech-coworking"] if args.tech_only else cat_id,
                "owner_user_id": OWNER_USER_ID,
                "title": title,
                "slug": slug,
                "short_description": short_desc,
                "address_line_1": addr_line,
                "locality": as_text(first_addr.get("locality")) or cfg["name"],
                "city": cfg["name"],
                "company_type": "it_services_consulting" if args.tech_only else None,
                "administrative_area": as_text(first_addr.get("region")),
                "country_code": "IN",
                "postal_code": as_text(first_addr.get("postcode")),
                "latitude": float(lat),
                "longitude": float(lon),
                "website": first_val(raw.get("websites")),
                "phone": first_val(raw.get("phones")),
                "email": first_val(raw.get("emails")),
                "status": "published",
                "verification_status": "unverified",
                "is_featured": False,
                "priority": 0,
                "published_at": published_at,
            }
            records_to_insert.append(record)

            if len(records_to_insert) >= args.batch_size:
                client.insert_batch(records_to_insert)
                inserted_count += len(records_to_insert)
                batch_num += 1
                records_to_insert.clear()
                if batch_num % 5 == 0 or inserted_count == len(top_places):
                    print(f"    Inserted {inserted_count:,} / {len(top_places):,} places...")

        if records_to_insert:
            client.insert_batch(records_to_insert)
            inserted_count += len(records_to_insert)

        print(f"  ✅ Completed {cfg['name']}: {inserted_count:,} places inserted into /{metro_key}!\n")

    print("\n🎉 ALL METRO CITIES IMPORT FINISHED SUCCESSFULLY!")


if __name__ == "__main__":
    main()
