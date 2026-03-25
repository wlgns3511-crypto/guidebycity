"""
Build city guide database combining Census data + BEA cost data.
Usage: python3 scripts/build-db.py --census-key=YOUR_KEY --bea-key=YOUR_KEY
"""
import json
import os
import re
import sqlite3
import subprocess
import sys
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DATA_DIR, 'cities.db')
CENSUS_API = 'https://api.census.gov/data/2022/acs/acs5'
BEA_API = 'https://apps.bea.gov/api/data/'

CENSUS_KEY = ''
BEA_KEY = ''
for arg in sys.argv:
    if arg.startswith('--census-key='): CENSUS_KEY = arg.split('=', 1)[1]
    if arg.startswith('--bea-key='): BEA_KEY = arg.split('=', 1)[1]


def slugify(text):
    text = re.sub(r'\s*\(Metropolitan Statistical Area\)', '', text)
    text = text.lower().strip()
    text = re.sub(r'[,()\[\]/\\\'\"]+', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:80]


def short_name(name):
    name = re.sub(r'\s*\(Metropolitan Statistical Area\)', '', name)
    parts = name.split(',')
    if len(parts) < 2: return name
    city = parts[0].split('-')[0].strip()
    state = parts[-1].strip().split('-')[0].strip()
    return f'{city}, {state}'


def extract_state(name):
    m = re.search(r',\s*([A-Z]{2})', name)
    return m.group(1) if m else ''


def api_curl(url):
    raw = subprocess.check_output(['curl', '-s', '--max-time', '120', url], timeout=180)
    return json.loads(raw)


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(DB_PATH): os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.executescript('''
        CREATE TABLE cities (
            fips TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            short_name TEXT NOT NULL,
            state TEXT,
            slug TEXT UNIQUE NOT NULL,
            population INTEGER,
            median_income INTEGER,
            median_home_value INTEGER,
            median_rent INTEGER,
            per_capita_income INTEGER,
            poverty_rate REAL,
            median_age REAL,
            cost_index REAL,
            housing_index REAL
        );
        CREATE INDEX idx_cities_slug ON cities(slug);
        CREATE INDEX idx_cities_state ON cities(state);
        CREATE INDEX idx_cities_population ON cities(population);
    ''')
    conn.commit()
    return conn


def fetch_census(conn):
    if not CENSUS_KEY:
        print('  SKIP Census (no key)')
        return

    variables = 'NAME,B01003_001E,B19013_001E,B25077_001E,B25064_001E,B19301_001E'
    url = (f'{CENSUS_API}?get={variables}'
           f'&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*'
           f'&key={CENSUS_KEY}')

    print('  Fetching Census data...')
    try:
        result = api_curl(url)
        rows = result[1:]
        c = conn.cursor()
        count = 0
        slug_counts = {}

        for row in rows:
            fips = row[-1]
            name = row[0]
            if 'Micro Area' in name: continue  # Skip micropolitan

            sname = short_name(name)
            state = extract_state(name)
            slug = slugify(name)
            if slug in slug_counts:
                slug_counts[slug] += 1
                slug = f'{slug}-{slug_counts[slug]}'
            else:
                slug_counts[slug] = 1

            def pv(v):
                if not v or v in ('-666666666', 'null', 'None'): return None
                try: return int(float(v))
                except: return None

            def pf(v):
                if not v or v in ('-666666666', 'null', 'None'): return None
                try: return float(v)
                except: return None

            pop = pv(row[1])
            income = pv(row[2])
            home_val = pv(row[3])
            rent = pv(row[4])
            per_capita = pv(row[5])
            poverty_rate = None
            median_age = None

            c.execute('''INSERT OR IGNORE INTO cities
                (fips, name, short_name, state, slug, population, median_income,
                 median_home_value, median_rent, per_capita_income, poverty_rate, median_age,
                 cost_index, housing_index)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NULL,NULL)''',
                (fips, name, sname, state, slug, pop, income, home_val, rent, per_capita, poverty_rate, median_age))
            count += 1

        conn.commit()
        print(f'    {count} cities')
    except Exception as e:
        print(f'    ERROR: {e}')


def fetch_bea_rpp(conn):
    if not BEA_KEY:
        print('  SKIP BEA (no key)')
        return

    for line_code, field in [('1', 'cost_index'), ('3', 'housing_index')]:
        url = (f'{BEA_API}?method=GetData&DataSetName=Regional'
               f'&TableName=MARPP&LineCode={line_code}&GeoFips=MSA'
               f'&Year=LAST5&UserID={BEA_KEY}&ResultFormat=json')

        print(f'  Fetching BEA {field}...')
        try:
            result = api_curl(url)
            data = result.get('BEAAPI', {}).get('Results', {}).get('Data', [])
            c = conn.cursor()
            count = 0
            # Get latest year data
            latest = {}
            for row in data:
                fips = row.get('GeoFips', '').strip()
                year = int(row.get('TimePeriod', '0'))
                val = row.get('DataValue', '')
                if not fips or not val or val == '(NA)': continue
                try:
                    v = float(val.replace(',', ''))
                except: continue
                if fips not in latest or year > latest[fips][0]:
                    latest[fips] = (year, v)

            for fips, (year, val) in latest.items():
                c.execute(f'UPDATE cities SET {field} = ? WHERE fips = ?', (val, fips))
                if c.rowcount > 0: count += 1

            conn.commit()
            print(f'    {count} updated')
        except Exception as e:
            print(f'    ERROR: {e}')
        time.sleep(0.5)


def main():
    print('=== City Guide Data Builder ===')
    conn = init_db()

    print('\n1. Census ACS data...')
    fetch_census(conn)

    print('\n2. BEA cost of living...')
    fetch_bea_rpp(conn)

    c = conn.cursor()
    total = c.execute('SELECT COUNT(*) FROM cities').fetchone()[0]
    with_cost = c.execute('SELECT COUNT(*) FROM cities WHERE cost_index IS NOT NULL').fetchone()[0]
    with_pop = c.execute('SELECT COUNT(*) FROM cities WHERE population IS NOT NULL').fetchone()[0]

    print(f'\n=== Summary ===')
    print(f'  Cities: {total}')
    print(f'  With population: {with_pop}')
    print(f'  With cost index: {with_cost}')
    print(f'  Compare pages: {total * (total - 1) // 2}')
    print(f'  DB size: {os.path.getsize(DB_PATH) / 1024:.0f} KB')

    conn.close()
    print('\nDone!')

if __name__ == '__main__':
    main()
