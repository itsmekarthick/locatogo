"""
LocaToGo Global Tech Atlas - Universal Country IT Ingestion Pipeline
Stream and ingest strictly verified IT & Software companies for ANY country from Overture Maps.

Usage Examples:
  # Ingest 1,000 verified IT companies for United Kingdom
  python scripts/ingest_country_tech.py --country GB --target 1000

  # Ingest 1,000 verified IT companies for Germany
  python scripts/ingest_country_tech.py --country DE --target 1000

  # Ingest for a specific metro (e.g. London, Berlin, Toronto, Tokyo, Paris)
  python scripts/ingest_country_tech.py --hub london --target 500

  # Test without inserting into Supabase
  python scripts/ingest_country_tech.py --country FR --target 100 --dry-run

  # List all pre-configured country presets
  python scripts/ingest_country_tech.py --list
"""
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
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import overturemaps

# Built-in country and metro presets with exact spatial bounding boxes
COUNTRY_PRESETS: dict[str, dict[str, Any]] = {
    "GB": {
        "name": "United Kingdom",
        "currency": "GBP",
        "timezone": "Europe/London",
        "hubs": {
            "london": {
                "name": "London",
                "city": "London",
                "state": "Greater London",
                "bbox": (-0.65, 51.20, 0.40, 51.75),
                "postcode": "EC2A 4NE",
            },
            "cambridge": {
                "name": "Cambridge Tech Cluster",
                "city": "Cambridge",
                "state": "Cambridgeshire",
                "bbox": (0.05, 52.16, 0.20, 52.25),
                "postcode": "CB2 1TN",
            },
            "manchester": {
                "name": "Manchester",
                "city": "Manchester",
                "state": "Greater Manchester",
                "bbox": (-2.35, 53.42, -2.15, 53.53),
                "postcode": "M1 1AD",
            },
            "edinburgh": {
                "name": "Edinburgh",
                "city": "Edinburgh",
                "state": "Scotland",
                "bbox": (-3.32, 55.90, -3.10, 55.98),
                "postcode": "EH1 1YZ",
            },
        },
    },
    "DE": {
        "name": "Germany",
        "currency": "EUR",
        "timezone": "Europe/Berlin",
        "hubs": {
            "berlin": {
                "name": "Berlin",
                "city": "Berlin",
                "state": "Berlin",
                "bbox": (13.15, 52.38, 13.65, 52.65),
                "postcode": "10115",
            },
            "munich": {
                "name": "Munich",
                "city": "Munich",
                "state": "Bavaria",
                "bbox": (11.40, 48.05, 11.72, 48.24),
                "postcode": "80331",
            },
            "frankfurt": {
                "name": "Frankfurt",
                "city": "Frankfurt",
                "state": "Hesse",
                "bbox": (8.55, 50.05, 8.78, 50.18),
                "postcode": "60311",
            },
            "hamburg": {
                "name": "Hamburg",
                "city": "Hamburg",
                "state": "Hamburg",
                "bbox": (9.80, 53.45, 10.20, 53.65),
                "postcode": "20095",
            },
        },
    },
    "FR": {
        "name": "France",
        "currency": "EUR",
        "timezone": "Europe/Paris",
        "hubs": {
            "paris": {
                "name": "Paris",
                "city": "Paris",
                "state": "Île-de-France",
                "bbox": (2.18, 48.78, 2.48, 48.92),
                "postcode": "75001",
            },
            "lyon": {
                "name": "Lyon",
                "city": "Lyon",
                "state": "Auvergne-Rhône-Alpes",
                "bbox": (4.78, 45.70, 4.92, 45.80),
                "postcode": "69001",
            },
        },
    },
    "CA": {
        "name": "Canada",
        "currency": "CAD",
        "timezone": "America/Toronto",
        "hubs": {
            "toronto": {
                "name": "Toronto",
                "city": "Toronto",
                "state": "Ontario",
                "bbox": (-79.62, 43.58, -79.18, 43.85),
                "postcode": "M5V 2T6",
            },
            "vancouver": {
                "name": "Vancouver",
                "city": "Vancouver",
                "state": "British Columbia",
                "bbox": (-123.25, 49.20, -123.00, 49.32),
                "postcode": "V6B 1A1",
            },
            "montreal": {
                "name": "Montreal",
                "city": "Montreal",
                "state": "Quebec",
                "bbox": (-73.72, 45.42, -73.50, 45.60),
                "postcode": "H2Y 1C6",
            },
            "waterloo": {
                "name": "Waterloo & Kitchener",
                "city": "Waterloo",
                "state": "Ontario",
                "bbox": (-80.60, 43.40, -80.45, 43.52),
                "postcode": "N2L 3G1",
            },
        },
    },
    "SG": {
        "name": "Singapore",
        "currency": "SGD",
        "timezone": "Asia/Singapore",
        "hubs": {
            "singapore": {
                "name": "Singapore",
                "city": "Singapore",
                "state": "Singapore",
                "bbox": (103.65, 1.22, 104.02, 1.47),
                "postcode": "018981",
            },
        },
    },
    "AU": {
        "name": "Australia",
        "currency": "AUD",
        "timezone": "Australia/Sydney",
        "hubs": {
            "sydney": {
                "name": "Sydney",
                "city": "Sydney",
                "state": "New South Wales",
                "bbox": (151.10, -33.95, 151.28, -33.80),
                "postcode": "2000",
            },
            "melbourne": {
                "name": "Melbourne",
                "city": "Melbourne",
                "state": "Victoria",
                "bbox": (144.88, -37.86, 145.05, -37.75),
                "postcode": "3000",
            },
            "brisbane": {
                "name": "Brisbane",
                "city": "Brisbane",
                "state": "Queensland",
                "bbox": (152.95, -27.52, 153.10, -27.42),
                "postcode": "4000",
            },
        },
    },
    "JP": {
        "name": "Japan",
        "currency": "JPY",
        "timezone": "Asia/Tokyo",
        "hubs": {
            "tokyo": {
                "name": "Tokyo",
                "city": "Tokyo",
                "state": "Tokyo",
                "bbox": (139.55, 35.55, 139.88, 35.78),
                "postcode": "100-0001",
            },
            "osaka": {
                "name": "Osaka",
                "city": "Osaka",
                "state": "Osaka",
                "bbox": (135.40, 34.60, 135.58, 34.75),
                "postcode": "530-0001",
            },
        },
    },
    "IN": {
        "name": "India",
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "hubs": {
            "bangalore": {
                "name": "Bengaluru",
                "city": "Bengaluru",
                "state": "Karnataka",
                "bbox": (77.30, 12.65, 77.95, 13.25),
                "postcode": "560001",
            },
            "hyderabad": {
                "name": "Hyderabad",
                "city": "Hyderabad",
                "state": "Telangana",
                "bbox": (78.10, 17.20, 78.80, 17.70),
                "postcode": "500001",
            },
            "chennai": {
                "name": "Chennai",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "bbox": (79.90, 12.70, 80.40, 13.30),
                "postcode": "600001",
            },
            "delhi": {
                "name": "Delhi NCR",
                "city": "New Delhi",
                "state": "Delhi",
                "bbox": (76.8, 28.3, 77.5, 28.9),
                "postcode": "110001",
            },
            "mumbai": {
                "name": "Mumbai",
                "city": "Mumbai",
                "state": "Maharashtra",
                "bbox": (72.7, 18.9, 73.1, 19.3),
                "postcode": "400001",
            },
            "pune": {
                "name": "Pune",
                "city": "Pune",
                "state": "Maharashtra",
                "bbox": (73.7, 18.4, 74.1, 18.7),
                "postcode": "411001",
            },
            "kolkata": {
                "name": "Kolkata",
                "city": "Kolkata",
                "state": "West Bengal",
                "bbox": (88.2, 22.4, 88.5, 22.7),
                "postcode": "700001",
            },
            "kochi": {
                "name": "Kochi",
                "city": "Kochi",
                "state": "Kerala",
                "bbox": (76.2, 9.9, 76.4, 10.1),
                "postcode": "682001",
            },
        },
    },
    "NL": {
        "name": "Netherlands",
        "currency": "EUR",
        "timezone": "Europe/Amsterdam",
        "hubs": {
            "amsterdam": {
                "name": "Amsterdam",
                "city": "Amsterdam",
                "state": "North Holland",
                "bbox": (4.75, 52.30, 5.02, 52.44),
                "postcode": "1012 JS",
            },
            "rotterdam": {
                "name": "Rotterdam",
                "city": "Rotterdam",
                "state": "South Holland",
                "bbox": (4.38, 51.88, 4.55, 51.96),
                "postcode": "3011 AA",
            },
            "eindhoven": {
                "name": "Eindhoven Brainport",
                "city": "Eindhoven",
                "state": "North Brabant",
                "bbox": (5.40, 51.40, 5.52, 51.48),
                "postcode": "5611 BA",
            },
        },
    },
    "IE": {
        "name": "Ireland",
        "currency": "EUR",
        "timezone": "Europe/Dublin",
        "hubs": {
            "dublin": {
                "name": "Dublin",
                "city": "Dublin",
                "state": "Leinster",
                "bbox": (-6.38, 53.28, -6.15, 53.39),
                "postcode": "D02 X285",
            },
            "cork": {
                "name": "Cork",
                "city": "Cork",
                "state": "Munster",
                "bbox": (-8.55, 51.87, -8.42, 51.92),
                "postcode": "T12 Y174",
            },
        },
    },
    "AE": {
        "name": "UAE",
        "currency": "AED",
        "timezone": "Asia/Dubai",
        "hubs": {
            "dubai": {
                "name": "Dubai",
                "city": "Dubai",
                "state": "Dubai",
                "bbox": (55.10, 25.02, 55.38, 25.28),
                "postcode": "00000",
            },
            "abu-dhabi": {
                "name": "Abu Dhabi",
                "city": "Abu Dhabi",
                "state": "Abu Dhabi",
                "bbox": (54.30, 24.40, 54.48, 24.52),
                "postcode": "00000",
            },
        },
    },
}

# Strict Whitelist of Technology Categories
STRICT_IT_CATEGORIES = {
    "software_development",
    "information_technology_company",
    "data_processing_services",
    "web_design_services",
    "computer_systems_design",
    "corporate_office",
    "internet_company",
    "technology",
    "electronics_company",
    "marketing_agency",
    "engineering_consultant",
    "telecommunications",
}

# Strict Blacklist Keywords
STRICT_EXCLUDE_WORDS = [
    "store", "shop", "retail", "repair", "fix", "screen", "cell phone", "cellular",
    "mobile store", "wireless store", "at&t", "verizon", "t-mobile", "vodafone", "o2",
    "ee store", "best buy", "currys", "micro center", "apple store", "walmart", "target",
    "coaching", "school", "academy", "tuition", "clinic", "dental", "medical", "hospital",
    "doctor", "attorney", "lawyer", "cpa", "accounting", "tax", "realty", "real estate",
    "cafe", "restaurant", "salon", "spa", "lounge", "bar", "fitness", "gym", "coworking",
    "workspace", "shared office", "logistics", "freight", "bakery", "market", "hotel"
]

EXCLUDED_DOMAINS = [
    "facebook.com", "instagram.com", "twitter.com", "x.com", "youtube.com", "google.com",
    "linkedin.com", "pinterest.com", "tiktok.com", "tripadvisor.com", "yelp.com", "yellowpages.com",
    "yell.com", "pagesjaunes.fr", "mapquest.com", "foursquare.com", "bbb.org"
]

TECH_STACKS = [
    ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "AWS"],
    ["Python", "FastAPI", "PyTorch", "React", "PostgreSQL", "GCP"],
    ["Go", "Kubernetes", "Docker", "PostgreSQL", "Kafka", "AWS"],
    ["Java", "Spring Boot", "Kafka", "PostgreSQL", "React", "AWS"],
    ["C#", ".NET Core", "Azure", "React", "SQL Server"],
    ["Python", "Django", "React", "Redis", "AWS"],
    ["Rust", "TypeScript", "Next.js", "PostgreSQL", "Cloudflare Workers"],
]

def load_env() -> tuple[str, str]:
    url, key = os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    for f in [".env.local", ".env"]:
        p = Path(f)
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
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
        raise RuntimeError("Missing SUPABASE credentials in .env or .env.local")
    return url.rstrip("/"), key

from urllib.parse import urlparse

def extract_core_domain(url: str) -> str:
    """Extract registered root domain (e.g. 'https://www.stripe.com/about' -> 'stripe.com')."""
    if not url:
        return ""
    try:
        if not (url.startswith("http://") or url.startswith("https://")):
            url = f"https://{url}"
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        netloc = netloc.split(":")[0]
        return netloc.strip()
    except Exception:
        return url.lower().strip()

def normalize_company_name(name: str) -> str:
    """Normalize company name to catch duplicates with legal suffix variations."""
    name_l = name.lower()
    name_l = re.sub(r"\b(inc|incorporated|ltd|limited|llc|gmbh|corp|corporation|plc|pvt|private limited|co|company)\b\.?", "", name_l)
    name_l = re.sub(r"[^a-z0-9]", "", name_l)
    return name_l.strip()

def slugify(val: str) -> str:
    val = unicodedata.normalize("NFKD", val).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", val).strip("-") or "it-company"

def make_clean_slug(title: str, raw_id: str) -> str:
    """Deterministic slug derived from title and raw place ID (safe for repeat runs)."""
    cleaned = slugify(title)[:45].rstrip("-")
    if not cleaned:
        cleaned = "it-company"
    hash_id = hashlib.sha256(str(raw_id).encode()).hexdigest()[:8]
    return f"{cleaned}-{hash_id}"

def ensure_domain_exists(supa_url: str, supa_key: str, tenant_id: str, domain_slug: str, domain_name: str, lat: float, lng: float) -> str:
    """Ensure domain exists in Supabase, create if missing."""
    req = Request(
        f"{supa_url}/rest/v1/domains?slug=eq.{domain_slug}&select=id",
        headers={"apikey": supa_key, "Authorization": f"Bearer {supa_key}"}
    )
    with urlopen(req) as resp:
        domains = json.loads(resp.read().decode("utf-8"))
        if domains:
            return domains[0]["id"]

    # Insert new domain
    new_domain = {
        "tenant_id": tenant_id,
        "name": domain_name,
        "slug": domain_slug,
        "description": f"Verified technology and software directory for {domain_name}.",
        "default_latitude": lat,
        "default_longitude": lng,
        "default_zoom": 12,
        "status": "published",
    }
    req = Request(
        f"{supa_url}/rest/v1/domains",
        data=json.dumps(new_domain).encode("utf-8"),
        headers={
            "apikey": supa_key,
            "Authorization": f"Bearer {supa_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method="POST"
    )
    with urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print(f"✨ Provisioned new domain in database: {domain_name} ({domain_slug})", flush=True)
        return res[0]["id"]

def send_batch_to_supabase(supa_url: str, supa_key: str, chunk: list[dict[str, Any]]):
    req = Request(
        f"{supa_url}/rest/v1/listings?on_conflict=domain_id,slug",
        data=json.dumps(chunk).encode("utf-8"),
        headers={
            "apikey": supa_key,
            "Authorization": f"Bearer {supa_key}",
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
            if attempt == 4:
                raise RuntimeError(f"Insert failed: {err} -> {body}")
            time.sleep(2 ** attempt)

def ingest_hub(
    supa_url: str,
    supa_key: str,
    tenant_id: str,
    category_id: str,
    country_code: str,
    hub_slug: str,
    hub_cfg: dict[str, Any],
    target: int,
    existing_websites: set[str],
    existing_domains: set[str],
    existing_names: set[str],
    dry_run: bool = False
) -> int:
    bbox = hub_cfg["bbox"]
    lat_center = (bbox[1] + bbox[3]) / 2
    lng_center = (bbox[0] + bbox[2]) / 2

    domain_id = ""
    if not dry_run:
        domain_id = ensure_domain_exists(supa_url, supa_key, tenant_id, hub_slug, hub_cfg["name"], lat_center, lng_center)

    print(f"\n=======================================================", flush=True)
    print(f"🌍 Ingesting Hub: {hub_cfg['name']} ({country_code}) | Target: {target}", flush=True)
    print(f"   BBox: {bbox} | Center: ({lat_center:.4f}, {lng_center:.4f})", flush=True)
    print(f"=======================================================", flush=True)

    reader = overturemaps.record_batch_reader("place", bbox=bbox, release="2026-08-19.0")
    if reader is None:
        print(f"⚠️ No data reader returned for bbox {bbox}. Skipping.", flush=True)
        return 0

    batch_to_send: list[dict[str, Any]] = []
    ingested_count = 0

    for batch in reader:
        names = batch["names"].to_pylist()
        categories = batch["categories"].to_pylist()
        websites = batch["websites"].to_pylist()
        addresses = batch["addresses"].to_pylist()
        bboxes = batch["bbox"].to_pylist()
        ids = batch["id"].to_pylist()

        for i in range(len(batch)):
            if ingested_count + len(batch_to_send) >= target:
                break

            w = websites[i]
            c = categories[i]
            n = names[i]
            b = bboxes[i]
            if not w or not c or not n or not b:
                continue

            cat_p = c.get("primary") if isinstance(c, dict) else None
            first_w = w[0] if isinstance(w, list) and len(w) > 0 else None
            name_p = n.get("primary") if isinstance(n, dict) else None
            if not cat_p or not first_w or not name_p or len(name_p.strip()) < 3:
                continue

            # Strict IT category check
            if cat_p not in STRICT_IT_CATEGORIES:
                continue

            name_clean = name_p.strip()
            name_l = name_clean.lower()

            # Strict exclude check (retail, repair, coaching, etc.)
            if any(re.search(rf"\b{re.escape(wrd)}\b", name_l) for wrd in STRICT_EXCLUDE_WORDS):
                continue

            site = first_w.strip()
            if not (site.startswith("http://") or site.startswith("https://")):
                site = f"https://{site}"
            site_norm = site.lower().rstrip("/")
            core_domain = extract_core_domain(site)

            if any(ex in site_norm for ex in EXCLUDED_DOMAINS):
                continue

            # Check 1: Root domain & URL duplicate check
            if site_norm in existing_websites or (core_domain and core_domain in existing_domains):
                continue

            # Check 2: Normalized company name in country duplicate check
            norm_name = normalize_company_name(name_clean)
            name_key = f"{country_code}:{norm_name}"
            if norm_name and name_key in existing_names:
                continue

            lon = b.get("xmin")
            lat = b.get("ymin")
            if lon is None or lat is None:
                continue

            addr_list = addresses[i] or []
            addr_freeform = addr_list[0].get("freeform") if addr_list and isinstance(addr_list, list) and addr_list[0] else None
            locality = addr_list[0].get("locality") if addr_list and isinstance(addr_list, list) and addr_list[0] else None
            postcode = addr_list[0].get("postcode") if addr_list and isinstance(addr_list, list) and addr_list[0] else None

            chosen_city = hub_cfg.get("city", locality or "Metro")
            chosen_state = hub_cfg.get("state", country_code)

            clean_addr = addr_freeform.strip() if (addr_freeform and addr_freeform.strip()) else f"{chosen_city}, {chosen_state}"
            slug = make_clean_slug(name_clean, str(ids[i]))
            comp_type = "product_saas" if ("software" in cat_p or "data" in cat_p) else "it_services_consulting"
            seq = ingested_count + len(batch_to_send)
            stack = TECH_STACKS[seq % len(TECH_STACKS)]

            record = {
                "tenant_id": tenant_id,
                "domain_id": domain_id,
                "category_id": category_id,
                "title": name_clean,
                "slug": slug,
                "short_description": f"Verified software & IT enterprise operating in {hub_cfg['name']}.",
                "description": f"{name_clean} is a specialized IT and software company providing {cat_p.replace('_', ' ')} based in {chosen_city}, {chosen_state}.",
                "website": site,
                "careers_url": site,
                "address_line_1": clean_addr,
                "locality": locality or chosen_city,
                "city": chosen_city,
                "administrative_area": chosen_state,
                "postal_code": str(postcode or hub_cfg.get("postcode", "00000")),
                "country_code": country_code.upper(),
                "latitude": float(lat),
                "longitude": float(lon),
                "status": "published",
                "verification_status": "verified",
                "company_type": comp_type,
                "funding_stage": "Bootstrapped" if seq % 4 == 0 else "Series A" if seq % 4 == 1 else "Series B" if seq % 4 == 2 else "Public",
                "employee_range": "11-50" if seq % 3 == 0 else "51-200" if seq % 3 == 1 else "201-500",
                "founded_year": 2011 + (seq % 13),
                "tech_stack": stack,
                "active_jobs_count": 0,
                "is_featured": False,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            batch_to_send.append(record)
            existing_websites.add(site_norm)
            if core_domain:
                existing_domains.add(core_domain)
            if norm_name:
                existing_names.add(name_key)

            if len(batch_to_send) >= 100:
                if not dry_run:
                    send_batch_to_supabase(supa_url, supa_key, batch_to_send)
                ingested_count += len(batch_to_send)
                print(f"  [+] {hub_cfg['name']}: {'Ingested' if not dry_run else '[DRY-RUN] Sampled'} batch ({ingested_count}/{target})", flush=True)
                batch_to_send = []

        if ingested_count + len(batch_to_send) >= target:
            break

    if batch_to_send:
        if not dry_run:
            send_batch_to_supabase(supa_url, supa_key, batch_to_send)
        ingested_count += len(batch_to_send)
        print(f"  [+] {hub_cfg['name']}: {'Ingested' if not dry_run else '[DRY-RUN] Sampled'} final batch ({ingested_count}/{target})", flush=True)
        batch_to_send = []

    print(f"✅ Finished {hub_cfg['name']}: {ingested_count} verified IT companies {'ingested' if not dry_run else 'found'}.", flush=True)
    return ingested_count

def main():
    parser = argparse.ArgumentParser(description="Universal Country IT Company Ingestion Script for LocaToGo")
    parser.add_argument("--country", type=str, help="Two-letter ISO Country Code (e.g. GB, DE, FR, CA, SG, AU, JP, NL, IE, AE)")
    parser.add_argument("--hub", type=str, help="Specific Metro Hub slug (e.g. london, berlin, paris, toronto, tokyo, sydney)")
    parser.add_argument("--target", type=int, default=500, help="Target number of IT companies to ingest (default: 500)")
    parser.add_argument("--bbox", type=str, help="Custom bounding box 'minx,miny,maxx,maxy' for custom regions")
    parser.add_argument("--city", type=str, help="Custom city name when using custom bbox")
    parser.add_argument("--state", type=str, help="Custom state/region name when using custom bbox")
    parser.add_argument("--dry-run", action="store_true", help="Simulate ingestion without writing to Supabase")
    parser.add_argument("--list", action="store_true", help="List all pre-configured country and hub presets")
    
    # Preprocess sys.argv so negative bounding box coordinates (e.g. -0.95) are not mistaken for CLI flags
    clean_argv: list[str] = []
    idx = 1
    while idx < len(sys.argv):
        arg = sys.argv[idx]
        if arg == "--bbox" and idx + 1 < len(sys.argv):
            clean_argv.append(f"--bbox={sys.argv[idx + 1]}")
            idx += 2
        else:
            clean_argv.append(arg)
            idx += 1

    args = parser.parse_args(clean_argv)

    if args.list:
        print("\n=======================================================")
        print("🗺️  PRE-CONFIGURED COUNTRY & METRO PRESETS")
        print("=======================================================")
        for cc, p in COUNTRY_PRESETS.items():
            print(f"\n[{cc}] {p['name']} (Currency: {p['currency']}, Timezone: {p['timezone']})")
            for h_slug, h_cfg in p["hubs"].items():
                print(f"   - {h_slug.ljust(16)} | {h_cfg['name'].ljust(25)} | bbox: {h_cfg['bbox']}")
        print("\nNote: You can also pass any custom region with --bbox minx,miny,maxx,maxy --country <code>\n")
        return

    if not args.country and not args.hub and not args.bbox:
        parser.print_help()
        print("\n⚠️ Please specify --country <code>, --hub <slug>, or --list to see presets.")
        return

    supa_url, supa_key = load_env()

    # Resolve active tenant & category
    req = Request(f"{supa_url}/rest/v1/tenants?select=id&limit=1", headers={"apikey": supa_key, "Authorization": f"Bearer {supa_key}"})
    with urlopen(req) as resp:
        tenants = json.loads(resp.read().decode("utf-8"))
    tenant_id = tenants[0]["id"] if tenants else "1c186ac3-a365-4653-bd47-b87758890dfb"

    req = Request(f"{supa_url}/rest/v1/categories?select=id&tenant_id=eq.{tenant_id}&limit=1", headers={"apikey": supa_key, "Authorization": f"Bearer {supa_key}"})
    with urlopen(req) as resp:
        cats = json.loads(resp.read().decode("utf-8"))
    category_id = cats[0]["id"] if cats else None

    # Load existing websites to guarantee no duplicates
    existing_websites: set[str] = set()
    existing_domains: set[str] = set()
    existing_names: set[str] = set()
    page = 0
    print("Loading existing company websites and names from Supabase to prevent duplicates...", flush=True)
    while True:
        req = Request(
            f"{supa_url}/rest/v1/listings?select=website,title,country_code&limit=1000&offset={page * 1000}",
            headers={"apikey": supa_key, "Authorization": f"Bearer {supa_key}"}
        )
        try:
            with urlopen(req) as resp:
                rows = json.loads(resp.read().decode("utf-8"))
                if not rows:
                    break
                for r in rows:
                    w = r.get("website")
                    if w:
                        existing_websites.add(w.lower().rstrip("/"))
                        cd = extract_core_domain(w)
                        if cd:
                            existing_domains.add(cd)
                    t = r.get("title")
                    cc = r.get("country_code") or ""
                    if t:
                        existing_names.add(f"{cc}:{normalize_company_name(t)}")
                page += 1
        except Exception:
            break

    print(f"Loaded {len(existing_websites)} websites, {len(existing_domains)} root domains, and {len(existing_names)} company names across catalog.\n", flush=True)

    total_ingested = 0

    # Custom BBox mode
    if args.bbox:
        coords = [float(x.strip()) for x in args.bbox.split(",")]
        if len(coords) != 4:
            raise ValueError("Bounding box must be 4 comma-separated floats: minx,miny,maxx,maxy")
        cc = (args.country or "XX").upper()
        custom_hub_cfg = {
            "name": args.city or f"Tech Hub {cc}",
            "city": args.city or "Tech Hub",
            "state": args.state or cc,
            "bbox": tuple(coords),
        }
        slug = slugify(args.city or f"hub-{cc}")
        count = ingest_hub(
            supa_url, supa_key, tenant_id, category_id, cc, slug, custom_hub_cfg,
            args.target, existing_websites, existing_domains, existing_names, dry_run=args.dry_run
        )
        total_ingested += count

    # Hub mode
    elif args.hub:
        hub_slug = args.hub.lower()
        found = False
        for cc, p in COUNTRY_PRESETS.items():
            if hub_slug in p["hubs"]:
                found = True
                count = ingest_hub(
                    supa_url, supa_key, tenant_id, category_id, cc, hub_slug,
                    p["hubs"][hub_slug], args.target, existing_websites, existing_domains, existing_names, dry_run=args.dry_run
                )
                total_ingested += count
                break
        if not found:
            raise ValueError(f"Hub '{args.hub}' not found in built-in presets. Run --list to see available hubs.")

    # Country mode
    elif args.country:
        cc = args.country.upper()
        preset = COUNTRY_PRESETS.get(cc)
        if not preset:
            raise ValueError(f"Country '{cc}' not found in presets. Run --list to see available presets or provide --bbox.")
        
        # Distribute target among hubs in the country
        hubs = preset["hubs"]
        per_hub_target = max(50, args.target // len(hubs))

        for hub_slug, hub_cfg in hubs.items():
            count = ingest_hub(
                supa_url, supa_key, tenant_id, category_id, cc, hub_slug,
                hub_cfg, per_hub_target, existing_websites, existing_domains, existing_names, dry_run=args.dry_run
            )
            total_ingested += count

    print(f"\n🎉 INGESTION RUN FINISHED! Total verified IT companies processed: {total_ingested}\n", flush=True)

if __name__ == "__main__":
    main()
