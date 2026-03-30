#!/usr/bin/env python3
"""
Expand GuideByCity with ZIP-level city guide pages using ZipPeek data.
Creates a zip_guides table with demographic + cost data per ZIP code.
"""

import sqlite3
import os
import re

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'cities.db')
ZIPPEEK_DB = os.path.join(os.path.dirname(__file__), '..', '..', 'zippeek', 'data', 'zippeek.db')

US_STATES = {
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
}


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def main():
    print("=== GuideByCity ZIP Expansion ===\n")

    if not os.path.exists(ZIPPEEK_DB):
        print(f"ERROR: ZipPeek DB not found at {ZIPPEEK_DB}")
        return

    conn = sqlite3.connect(DB_PATH)

    # Load state cost indices for mapping
    state_costs = {}
    for r in conn.execute('SELECT state, AVG(cost_index) as avg_cost, AVG(housing_index) as avg_housing FROM cities WHERE cost_index IS NOT NULL GROUP BY state').fetchall():
        state_costs[r[0]] = {'cost_index': round(r[1], 1), 'housing_index': round(r[2], 1)}

    # Create zip_guides table
    conn.execute('DROP TABLE IF EXISTS zip_guides')
    conn.execute('''
        CREATE TABLE zip_guides (
            zip_code TEXT PRIMARY KEY,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            population INTEGER,
            median_income INTEGER,
            median_home_value INTEGER,
            median_rent INTEGER,
            median_age REAL,
            poverty_rate REAL,
            bachelors_pct REAL,
            homeowner_rate REAL,
            unemployment_rate REAL,
            cost_index REAL
        )
    ''')
    conn.execute('CREATE INDEX idx_zg_state ON zip_guides(state)')
    conn.execute('CREATE INDEX idx_zg_slug ON zip_guides(slug)')
    conn.execute('CREATE INDEX idx_zg_population ON zip_guides(population)')
    conn.execute('CREATE INDEX idx_zg_income ON zip_guides(median_income)')

    # Load ZipPeek data
    zconn = sqlite3.connect(ZIPPEEK_DB)
    zconn.row_factory = sqlite3.Row
    zips = zconn.execute('''
        SELECT zip_code, city, state, population, median_income,
               median_home_value, median_rent, median_age,
               poverty_rate, bachelors_pct, homeowner_rate, unemployment_rate
        FROM zips
    ''').fetchall()
    zconn.close()

    inserted = 0
    for z in zips:
        state = z['state']
        if state not in US_STATES:
            continue

        slug = f"{z['zip_code']}-{slugify(z['city'])}-{state.lower()}-guide"
        cost_idx = state_costs.get(state, {}).get('cost_index')

        try:
            conn.execute('''
                INSERT OR IGNORE INTO zip_guides
                (zip_code, city, state, slug, population, median_income,
                 median_home_value, median_rent, median_age,
                 poverty_rate, bachelors_pct, homeowner_rate, unemployment_rate, cost_index)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                z['zip_code'], z['city'], state, slug,
                z['population'], z['median_income'],
                z['median_home_value'], z['median_rent'], z['median_age'],
                z['poverty_rate'], z['bachelors_pct'], z['homeowner_rate'],
                z['unemployment_rate'], cost_idx
            ))
            inserted += 1
        except sqlite3.IntegrityError:
            pass

        if inserted % 5000 == 0 and inserted > 0:
            conn.commit()
            print(f"  {inserted} inserted...")

    conn.commit()

    total = conn.execute('SELECT COUNT(*) FROM zip_guides').fetchone()[0]
    print(f"\n=== Done ===")
    print(f"  Inserted: {inserted}")
    print(f"  Total ZIP guides: {total}")

    by_state = conn.execute('SELECT state, COUNT(*) FROM zip_guides GROUP BY state ORDER BY COUNT(*) DESC LIMIT 5').fetchall()
    print(f"  Top states: {[(s,c) for s,c in by_state]}")

    conn.close()


if __name__ == '__main__':
    main()
