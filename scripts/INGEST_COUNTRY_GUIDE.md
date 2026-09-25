# Universal Country IT Company Ingestion Guide

The script [scripts/ingest_country_tech.py](file:///d:/Projects/Mapora/scripts/ingest_country_tech.py) is a command-line tool that allows you to stream, filter, and ingest **strictly verified IT & Software companies** with valid websites and exact GPS coordinates for **any country or tech hub in the world** into LocaToGo.

---

## 🚀 Quick Start Examples

Run using the virtual environment Python or through the npm script:

### 1. Ingest by Country Code
```powershell
# United Kingdom (London, Cambridge, Manchester, Edinburgh) - 1,000 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country GB --target 1000

# Germany (Berlin, Munich, Frankfurt, Hamburg) - 1,000 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country DE --target 1000

# France (Paris, Lyon) - 500 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country FR --target 500

# Canada (Toronto, Vancouver, Montreal, Waterloo) - 1,000 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country CA --target 1000

# Singapore - 500 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country SG --target 500

# Australia (Sydney, Melbourne, Brisbane) - 800 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country AU --target 800

# Japan (Tokyo, Osaka) - 600 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country JP --target 600

# Netherlands (Amsterdam, Rotterdam, Eindhoven) - 600 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country NL --target 600

# Ireland (Dublin, Cork) - 500 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country IE --target 500

# UAE (Dubai, Abu Dhabi) - 500 IT companies
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country AE --target 500
```

---

### 2. Ingest for a Specific Metro Hub
```powershell
# London only
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --hub london --target 500

# Berlin only
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --hub berlin --target 500

# Tokyo only
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --hub tokyo --target 500
```

---

### 3. Ingest Any Custom Country or Bounding Box
For any country not in the built-in preset list (e.g. Spain, Sweden, Switzerland, Brazil):
```powershell
# Barcelona, Spain (BBox: minx, miny, maxx, maxy)
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py `
  --country ES `
  --city Barcelona `
  --state Catalonia `
  --bbox "2.05,41.32,2.25,41.46" `
  --target 300

# Stockholm, Sweden
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py `
  --country SE `
  --city Stockholm `
  --state Stockholm `
  --bbox "17.90,59.25,18.20,59.40" `
  --target 300
```

---

### 4. Test Without Writing to Database (`--dry-run`)
```powershell
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --country DE --target 100 --dry-run
```

---

### 5. View All Available Built-In Presets
```powershell
.\.venv-overture\Scripts\python.exe scripts/ingest_country_tech.py --list
```

---

## 🛡️ Built-in Strict IT & Software Filters

The script applies strict filtering to prevent non-IT businesses from entering the database:

1. **Category Whitelist**:
   - `software_development` (Enterprise SaaS, cloud applications, mobile apps)
   - `information_technology_company` (IT consulting, enterprise solutions)
   - `data_processing_services` (Cloud data infrastructure, ETL, AI/ML pipelines)
   - `web_design_services` (Digital product engineering, web development)
   - `computer_systems_design` (Systems architecture, hardware-software integration)

2. **Strict Exclusions**:
   - Retail electronics stores (Best Buy, Currys, Reliance Digital, Apple stores)
   - Telecom carrier stores (AT&T, Verizon, T-Mobile, Vodafone, O2, EE shops)
   - Hardware and screen repair shops
   - Coworking spaces and shared offices
   - Tutoring centers, coaching institutes, schools
   - Clinics, dental, legal, accounting, and real estate offices

3. **Database Integrity**:
   - Automatically provisions missing metro `domains` in Supabase under tenant `1c186ac3-a365-4653-bd47-b87758890dfb`.
   - Prevents duplicate websites and duplicate slugs (`on_conflict=domain_id,slug`).
   - Sanitizes address strings to avoid database check constraint failures.
