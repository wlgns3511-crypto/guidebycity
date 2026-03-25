"""Build city guide DB from existing costbycity data."""
import os
import re
import sqlite3

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DATA_DIR, 'cities.db')
COST_DB = '/Users/jihoon/projects/cost-of-living/data/costliving.db'


def short_name(name):
    name = re.sub(r'\s*\(Metropolitan Statistical Area\)', '', name)
    parts = name.split(',')
    if len(parts) < 2: return name
    city = parts[0].split('-')[0].strip()
    state = parts[-1].strip().split('-')[0].strip()
    return f'{city}, {state}'


def main():
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
            cost_index REAL,
            housing_index REAL,
            goods_index REAL,
            utilities_index REAL
        );
        CREATE INDEX idx_cities_slug ON cities(slug);
        CREATE INDEX idx_cities_state ON cities(state);
        CREATE INDEX idx_cities_population ON cities(population);
    ''')

    # Read from costbycity DB
    src = sqlite3.connect(COST_DB)
    sc = src.cursor()

    metros = sc.execute('SELECT * FROM metros').fetchall()
    print(f'Importing {len(metros)} cities from costbycity...')

    for metro in metros:
        fips, name, sname, state, slug = metro

        # Get RPP data
        rpps = sc.execute('SELECT category, value FROM rpp WHERE fips = ? AND year = (SELECT MAX(year) FROM rpp WHERE fips = ?)',
                          (fips, fips)).fetchall()
        rpp = {cat: val for cat, val in rpps}

        # Get ACS data
        acs = sc.execute('SELECT * FROM acs WHERE fips = ?', (fips,)).fetchone()
        income = acs[1] if acs else None
        home_val = acs[2] if acs else None
        rent = acs[3] if acs else None
        per_capita = acs[4] if acs else None

        # Estimate population from employment data or use None
        pop = None

        c.execute('''INSERT OR IGNORE INTO cities VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                  (fips, name, sname, state, slug, pop, income, home_val, rent, per_capita,
                   rpp.get('all'), rpp.get('housing'), rpp.get('goods'), rpp.get('utilities')))

    conn.commit()
    src.close()

    total = c.execute('SELECT COUNT(*) FROM cities').fetchone()[0]
    with_cost = c.execute('SELECT COUNT(*) FROM cities WHERE cost_index IS NOT NULL').fetchone()[0]
    with_income = c.execute('SELECT COUNT(*) FROM cities WHERE median_income IS NOT NULL').fetchone()[0]

    print(f'\n=== Summary ===')
    print(f'  Cities: {total}')
    print(f'  With cost index: {with_cost}')
    print(f'  With income data: {with_income}')
    print(f'  Compare pages: {total * (total - 1) // 2}')
    print(f'  DB: {os.path.getsize(DB_PATH) / 1024:.0f} KB')

    conn.close()
    print('Done!')

if __name__ == '__main__':
    main()
