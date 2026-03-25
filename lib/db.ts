import Database from 'better-sqlite3';
import path from 'path';
const DB_PATH = path.join(process.cwd(), 'data', 'cities.db');
let _db: Database.Database | null = null;
function getDb(): Database.Database {
  if (!_db) _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  return _db;
}

export interface City {
  fips: string; name: string; short_name: string; state: string; slug: string;
  population: number | null; median_income: number | null;
  median_home_value: number | null; median_rent: number | null;
  per_capita_income: number | null; cost_index: number | null;
  housing_index: number | null; goods_index: number | null;
  utilities_index: number | null; weather_json: string | null;
}

export interface MonthWeather {
  avg_high: number; avg_low: number; precip_mm: number;
}

export function getWeather(city: City): Record<string, MonthWeather> | null {
  if (!city.weather_json) return null;
  try { return JSON.parse(city.weather_json); } catch { return null; }
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function monthName(m: number): string { return MONTH_NAMES[m - 1] || ''; }

export function getAllCities(): City[] {
  return getDb().prepare('SELECT * FROM cities ORDER BY short_name').all() as City[];
}
export function getCityBySlug(slug: string): City | undefined {
  return getDb().prepare('SELECT * FROM cities WHERE slug = ?').get(slug) as City | undefined;
}
export function getCitiesByState(state: string): City[] {
  return getDb().prepare('SELECT * FROM cities WHERE state = ? ORDER BY short_name').all(state) as City[];
}
export function getAllStates(): string[] {
  return (getDb().prepare('SELECT DISTINCT state FROM cities WHERE state IS NOT NULL ORDER BY state').all() as { state: string }[]).map(r => r.state);
}
export function getMostExpensive(limit = 15): City[] {
  return getDb().prepare('SELECT * FROM cities WHERE cost_index IS NOT NULL ORDER BY cost_index DESC LIMIT ?').all(limit) as City[];
}
export function getCheapest(limit = 15): City[] {
  return getDb().prepare('SELECT * FROM cities WHERE cost_index IS NOT NULL ORDER BY cost_index ASC LIMIT ?').all(limit) as City[];
}
export function getHighestIncome(limit = 15): City[] {
  return getDb().prepare('SELECT * FROM cities WHERE median_income IS NOT NULL ORDER BY median_income DESC LIMIT ?').all(limit) as City[];
}
export function getTopComparisons(limit = 5000): { slugA: string; slugB: string }[] {
  return getDb().prepare(`
    SELECT a.slug as slugA, b.slug as slugB
    FROM cities a, cities b
    WHERE a.fips < b.fips AND a.cost_index IS NOT NULL AND b.cost_index IS NOT NULL
    ORDER BY ABS(a.cost_index - b.cost_index) DESC
    LIMIT ?
  `).all(limit) as { slugA: string; slugB: string }[];
}
export function countCities(): number {
  return (getDb().prepare('SELECT COUNT(*) as c FROM cities').get() as { c: number }).c;
}
