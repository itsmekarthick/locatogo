import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import overturemaps

US_METROS = {
    'siliconvalley': {
        'name': 'Silicon Valley & SF',
        'bbox': (-122.60, 37.15, -121.75, 37.95),
        'target': 2500,
    },
    'new-york': {
        'name': 'New York City',
        'bbox': (-74.26, 40.50, -73.70, 40.92),
        'target': 2000,
    },
    'los-angeles': {
        'name': 'Los Angeles',
        'bbox': (-118.67, 33.70, -117.75, 34.35),
        'target': 1500,
    },
    'seattle': {
        'name': 'Seattle',
        'bbox': (-122.50, 47.45, -122.10, 47.78),
        'target': 1000,
    },
    'boston': {
        'name': 'Boston',
        'bbox': (-71.25, 42.25, -70.95, 42.45),
        'target': 1000,
    },
    'austin': {
        'name': 'Austin',
        'bbox': (-98.00, 30.10, -97.55, 30.55),
        'target': 800,
    },
    'chicago': {
        'name': 'Chicago',
        'bbox': (-87.95, 41.65, -87.50, 42.05),
        'target': 800,
    },
    'denver': {
        'name': 'Denver',
        'bbox': (-105.35, 39.55, -104.75, 40.10),
        'target': 600,
    },
    'atlanta': {
        'name': 'Atlanta',
        'bbox': (-84.55, 33.65, -84.20, 34.15),
        'target': 600,
    },
    'san-diego': {
        'name': 'San Diego',
        'bbox': (-117.30, 32.65, -117.05, 33.15),
        'target': 500,
    },
}

EXCLUDED_DOMAINS = [
    'facebook.com', 'instagram.com', 'twitter.com', 'youtube.com', 'google.com',
    'linkedin.com', 'pinterest.com', 'tiktok.com', 'tripadvisor.com', 'yelp.com'
]

TECH_KEYWORDS = [
    'software', 'information_technology', 'computer', 'internet', 'coworking',
    'telecommunication', 'data_processing', 'web_design', 'electronics'
]

for slug, metro in US_METROS.items():
    print(f"\nChecking {metro['name']}...")
    reader = overturemaps.record_batch_reader('place', bbox=metro['bbox'], release='2026-08-19.0')
    count = 0
    for batch in reader:
        cats = batch['categories'].to_pylist()
        webs = batch['websites'].to_pylist()
        for i in range(len(batch)):
            c = cats[i]
            w = webs[i]
            if not c or not w:
                continue
            cat_p = c.get('primary') if isinstance(c, dict) else None
            first_w = w[0] if isinstance(w, list) and len(w) > 0 else None
            if not cat_p or not first_w:
                continue
            if any(ex in first_w.lower() for ex in EXCLUDED_DOMAINS):
                continue
            if any(t in cat_p for t in TECH_KEYWORDS):
                count += 1
                if count >= metro['target']:
                    break
        if count >= metro['target']:
            break
    print(f"  -> Found {count} companies (target: {metro['target']})")
