import json
import re
import pyarrow.parquet as pq

BBOX = (77.40, 12.80, 77.85, 13.20)  # Bangalore bounding box

TECH_KEYWORDS = {
    "software", "technology", "information_technology", "it_service", "computer",
    "coworking", "tech", "data", "ai", "consulting", "internet", "telecom"
}

NON_TECH_RE = re.compile(
    r"\b(repair|store|shop|tailor|bakery|saloon|salon|hotel|restaurant|clinic|medical|tea|juice|meat|vegetable|dry clean|garage|laundry|pharmacy|sweet)\b",
    re.IGNORECASE
)

def extract():
    print("Reading Overture Parquet file...")
    table = pq.read_table(
        "scripts/overture/india_places.parquet",
        columns=["id", "names", "categories", "websites", "addresses", "bbox"]
    )
    print(f"Loaded {table.num_rows} rows from Parquet.")

    p_names = table["names"].to_pylist()
    p_categories = table["categories"].to_pylist()
    p_websites = table["websites"].to_pylist()
    p_addresses = table["addresses"].to_pylist()
    p_bbox = table["bbox"].to_pylist()

    extracted = []
    seen_names = set()

    for i in range(len(p_names)):
        box = p_bbox[i]
        if not box:
            continue
        min_lon = box.get("minx")
        min_lat = box.get("miny")
        max_lon = box.get("maxx")
        max_lat = box.get("maxy")

        if min_lon is None or min_lat is None:
            continue

        lon = (min_lon + (max_lon or min_lon)) / 2
        lat = (min_lat + (max_lat or min_lat)) / 2

        # Check bbox
        if not (BBOX[0] <= lon <= BBOX[2] and BBOX[1] <= lat <= BBOX[3]):
            continue

        names_obj = p_names[i]
        if not names_obj:
            continue
        primary_name = names_obj.get("primary")
        if not primary_name or len(primary_name.strip()) < 3:
            continue
        primary_name = primary_name.strip()

        # Check categories
        cats_obj = p_categories[i] or {}
        main_cat = str(cats_obj.get("main") or "").lower()
        alt_cats = [str(c).lower() for c in (cats_obj.get("alternate") or [])]
        all_cats = " ".join([main_cat] + alt_cats)

        is_tech = any(k in all_cats for k in TECH_KEYWORDS) or any(k in primary_name.lower() for k in ["technologies", "software", "infotech", "tech labs", "solutions", "systems", "consulting"])
        if not is_tech:
            continue

        if NON_TECH_RE.search(primary_name):
            continue

        norm_name = primary_name.lower().replace("pvt ltd", "").replace("private limited", "").strip()
        if norm_name in seen_names:
            continue
        seen_names.add(norm_name)

        websites = p_websites[i] or []
        website = websites[0] if websites else None

        addrs = p_addresses[i] or []
        addr = addrs[0] if addrs else {}
        freeform = addr.get("freeform") or ""
        locality = addr.get("locality") or "Bengaluru"
        postal_code = addr.get("postcode") or "560001"

        extracted.append({
            "name": primary_name,
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "website": website,
            "address": freeform or f"{primary_name}, {locality}, Bengaluru",
            "locality": locality,
            "postal_code": postal_code,
            "category": main_cat or "tech_company",
        })

    print(f"Extracted {len(extracted)} Bangalore Tech Places!")
    with open("scripts/scrapers/bangalore_overture_tech.json", "w", encoding="utf-8") as f:
        json.dump(extracted, f, indent=2)
    print("Saved to scripts/scrapers/bangalore_overture_tech.json")

if __name__ == "__main__":
    extract()
