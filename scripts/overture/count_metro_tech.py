import pyarrow.parquet as pq
import re

METROS = {
    'bangalore': {
        'name': 'Bangalore',
        'bbox': (77.40, 12.80, 77.85, 13.20),
    },
    'chennai': {
        'name': 'Chennai',
        'bbox': (80.05, 12.85, 80.35, 13.25),
    },
    'mumbai': {
        'name': 'Mumbai',
        'bbox': (72.75, 18.85, 73.15, 19.35),
    },
    'hyderabad': {
        'name': 'Hyderabad',
        'bbox': (78.20, 17.20, 78.65, 17.60),
    },
    'delhi': {
        'name': 'Delhi NCR',
        'bbox': (76.85, 28.30, 77.50, 28.90),
    },
    'pune': {
        'name': 'Pune',
        'bbox': (73.70, 18.40, 74.05, 18.70),
    },
    'kolkata': {
        'name': 'Kolkata',
        'bbox': (88.20, 22.40, 88.55, 22.75),
    },
    'kochi': {
        'name': 'Kochi',
        'bbox': (76.15, 9.85, 76.45, 10.15),
    },
}

TECH_KEYWORDS = {
    "software", "technology", "information_technology", "it_service", "computer",
    "coworking", "tech", "data", "ai", "consulting", "internet", "telecom"
}

NON_TECH_RE = re.compile(
    r"\b(repair|store|shop|tailor|bakery|saloon|salon|hotel|restaurant|clinic|medical|tea|juice|meat|vegetable|dry clean|garage|laundry|pharmacy|sweet|tuition|school|xerox|furniture|jewel|jeweller|optician|optical|hardware store|electrical store|sanitary|plywood|marble|tiles|paint|auto parts|tyre|motor|cycle|steel|iron|cement|cloth|textile|garment|fashion|footwear|shoe|saree|sweet|dairy|grocery|provisions|supermarket|mart|fancy)\b",
    re.IGNORECASE
)

print("Scanning india_places.parquet...")
table = pq.read_table(
    "scripts/overture/india_places.parquet",
    columns=["names", "categories", "websites", "addresses", "bbox"]
)
print(f"Total rows in parquet: {table.num_rows}")

p_names = table["names"].to_pylist()
p_categories = table["categories"].to_pylist()
p_websites = table["websites"].to_pylist()
p_addresses = table["addresses"].to_pylist()
p_bbox = table["bbox"].to_pylist()

counts = {k: 0 for k in METROS}

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

    # Check which metro this falls into
    target_metro = None
    for m_id, m_data in METROS.items():
        b = m_data['bbox']
        if b[0] <= lon <= b[2] and b[1] <= lat <= b[3]:
            target_metro = m_id
            break

    if not target_metro:
        continue

    names_obj = p_names[i]
    if not names_obj:
        continue
    primary_name = names_obj.get("primary")
    if not primary_name or len(primary_name.strip()) < 3:
        continue
    primary_name = primary_name.strip()

    if NON_TECH_RE.search(primary_name):
        continue

    cats_obj = p_categories[i] or {}
    main_cat = str(cats_obj.get("main") or "").lower()
    alt_cats = [str(c).lower() for c in (cats_obj.get("alternate") or [])]
    all_cats = " ".join([main_cat] + alt_cats)

    is_tech = any(k in all_cats for k in TECH_KEYWORDS) or any(k in primary_name.lower() for k in [
        "technologies", "software", "infotech", "tech labs", "solutions", "systems", "consulting", "tech", "digital", "data"
    ])

    if is_tech:
        counts[target_metro] += 1

print("\n--- TECH PLACES COUNT PER METRO IN OVERTURE PARQUET ---")
for k, v in counts.items():
    print(f"{METROS[k]['name'].padEnd(12)}: {v}")
