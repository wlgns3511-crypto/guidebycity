"""
Add monthly weather data to cities using Open-Meteo API (free, no key).
Usage: python3 scripts/add-weather.py
"""
import json
import os
import sqlite3
import subprocess
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DATA_DIR, 'cities.db')

# Major US city coordinates (fips -> lat, lon)
CITY_COORDS = {
    "35620": (40.71, -74.01),   # New York
    "31080": (34.05, -118.24),  # Los Angeles
    "16980": (41.88, -87.63),   # Chicago
    "19100": (32.78, -96.80),   # Dallas
    "26420": (29.76, -95.37),   # Houston
    "47900": (38.91, -77.04),   # Washington DC
    "33100": (25.76, -80.19),   # Miami
    "37980": (39.95, -75.17),   # Philadelphia
    "12060": (33.75, -84.39),   # Atlanta
    "14460": (42.36, -71.06),   # Boston
    "38060": (33.45, -112.07),  # Phoenix
    "41860": (37.77, -122.42),  # San Francisco
    "19820": (42.33, -83.05),   # Detroit
    "42660": (47.61, -122.33),  # Seattle
    "33460": (44.98, -93.27),   # Minneapolis
    "41740": (32.72, -117.16),  # San Diego
    "45300": (27.95, -82.46),   # Tampa
    "19740": (39.74, -104.99),  # Denver
    "12580": (39.29, -76.61),   # Baltimore
    "36740": (28.54, -81.38),   # Orlando
    "16740": (35.23, -80.84),   # Charlotte
    "41940": (37.34, -121.89),  # San Jose
    "40900": (38.58, -121.49),  # Sacramento
    "38900": (45.52, -122.68),  # Portland
    "38300": (40.44, -79.99),   # Pittsburgh
    "12420": (30.27, -97.74),   # Austin
    "29820": (36.17, -115.14),  # Las Vegas
    "17460": (39.10, -84.51),   # Cincinnati
    "28140": (39.10, -94.58),   # Kansas City
    "18140": (39.96, -82.99),   # Columbus
    "26900": (39.77, -86.16),   # Indianapolis
    "17140": (41.50, -81.69),   # Cleveland
    "41700": (29.42, -98.49),   # San Antonio
    "34980": (36.16, -86.78),   # Nashville
    "27260": (30.33, -81.66),   # Jacksonville
    "36420": (35.47, -97.52),   # Oklahoma City
    "40060": (37.54, -77.44),   # Richmond
    "32820": (35.15, -90.05),   # Memphis
    "31140": (38.25, -85.76),   # Louisville
    "39580": (35.79, -78.64),   # Raleigh
    "25540": (41.76, -72.68),   # Hartford
    "35380": (29.95, -90.07),   # New Orleans
    "41620": (40.76, -111.89),  # Salt Lake City
    "13820": (33.52, -86.81),   # Birmingham
    "15380": (42.89, -78.88),   # Buffalo
    "40140": (33.95, -117.40),  # Riverside
    "46060": (32.22, -110.97),  # Tucson
    "39300": (41.82, -71.41),   # Providence
    "40380": (43.16, -77.61),   # Rochester
}


def get_monthly_weather(lat, lon):
    """Get monthly averages for a full year."""
    url = (
        f'https://archive-api.open-meteo.com/v1/archive'
        f'?latitude={lat}&longitude={lon}'
        f'&start_date=2024-01-01&end_date=2024-12-31'
        f'&daily=temperature_2m_max,temperature_2m_min,precipitation_sum'
        f'&timezone=auto&temperature_unit=fahrenheit'
    )
    raw = subprocess.check_output(['curl', '-s', url], timeout=30)
    data = json.loads(raw)
    daily = data.get('daily', {})

    if not daily.get('temperature_2m_max'):
        return None

    # Aggregate by month
    months = {}
    dates = daily.get('time', [])
    highs = daily.get('temperature_2m_max', [])
    lows = daily.get('temperature_2m_min', [])
    precip = daily.get('precipitation_sum', [])

    for i, date in enumerate(dates):
        month = int(date[5:7])
        if month not in months:
            months[month] = {'highs': [], 'lows': [], 'precip': []}
        if highs[i] is not None: months[month]['highs'].append(highs[i])
        if lows[i] is not None: months[month]['lows'].append(lows[i])
        if precip[i] is not None: months[month]['precip'].append(precip[i])

    result = {}
    for m in range(1, 13):
        if m in months and months[m]['highs']:
            d = months[m]
            result[m] = {
                'avg_high': round(sum(d['highs']) / len(d['highs']), 1),
                'avg_low': round(sum(d['lows']) / len(d['lows']), 1),
                'precip_mm': round(sum(d['precip']), 1),
            }
    return result


def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Add weather column if not exists
    try:
        c.execute('ALTER TABLE cities ADD COLUMN weather_json TEXT')
        conn.commit()
    except:
        pass  # Column already exists

    print('Fetching weather data for cities...')
    count = 0

    for fips, (lat, lon) in CITY_COORDS.items():
        # Pad fips to match DB format
        fips_padded = f'0{fips}0' if len(fips) == 5 else fips

        # Check if city exists
        city = c.execute('SELECT short_name FROM cities WHERE fips LIKE ?', (f'%{fips}%',)).fetchone()
        if not city:
            continue

        print(f'  {city[0]}...', end=' ', flush=True)
        try:
            weather = get_monthly_weather(lat, lon)
            if weather:
                c.execute('UPDATE cities SET weather_json = ? WHERE fips LIKE ?',
                          (json.dumps(weather), f'%{fips}%'))
                count += 1
                print('OK')
            else:
                print('no data')
        except Exception as e:
            print(f'ERR: {e}')

        time.sleep(0.3)

    conn.commit()
    with_weather = c.execute('SELECT COUNT(*) FROM cities WHERE weather_json IS NOT NULL').fetchone()[0]
    print(f'\n=== Weather added to {with_weather} cities ===')
    conn.close()

if __name__ == '__main__':
    main()
