import pyarrow.parquet as pq
from shapely import wkb

METROS = {
    'bangalore': {'bbox': (77.40, 12.80, 77.80, 13.18), 'name': 'Bangalore'},
    'chennai': {'bbox': (80.05, 12.85, 80.35, 13.25), 'name': 'Chennai'},
    'mumbai': {'bbox': (72.75, 18.85, 73.15, 19.35), 'name': 'Mumbai'},
    'hyderabad': {'bbox': (78.25, 17.20, 78.65, 17.60), 'name': 'Hyderabad'},
    'kochi': {'bbox': (76.15, 9.85, 76.45, 10.15), 'name': 'Kochi'},
    'delhi': {'bbox': (76.85, 28.35, 77.50, 28.90), 'name': 'Delhi NCR'},
    'kolkata': {'bbox': (88.20, 22.40, 88.55, 22.75), 'name': 'Kolkata'},
    'pune': {'bbox': (73.70, 18.40, 74.05, 18.70), 'name': 'Pune'},
}

counts = {k: 0 for k in METROS}
total_sampled = 0
f = pq.ParquetFile('scripts/overture/india_places.parquet')

# Check first 15 row groups
for i in range(15):
    batch = f.read_row_group(i, columns=['geometry']).to_pylist()
    for row in batch:
        geom = row.get('geometry')
        if geom:
            p = wkb.loads(bytes(geom))
            for k, cfg in METROS.items():
                minx, miny, maxx, maxy = cfg['bbox']
                if minx <= p.x <= maxx and miny <= p.y <= maxy:
                    counts[k] += 1
    total_sampled += len(batch)

print(f"Sampled: {total_sampled} / {f.metadata.num_rows} places")
for k, c in counts.items():
    estimated = int(c * (f.metadata.num_rows / total_sampled))
    print(f"  - {METROS[k]['name']} ({k}): sample={c}, estimated total={estimated:,}")
