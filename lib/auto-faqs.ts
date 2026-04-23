/**
 * Auto-generated FAQs for city guide pages using real data values.
 */

export interface FAQItem {
  question: string;
  answer: string;
}

interface CityData {
  short_name: string;
  name: string;
  state: string;
  population?: number | null;
  cost_index?: number | null;
  median_income?: number | null;
  median_rent?: number | null;
  median_home_value?: number | null;
  housing_index?: number | null;
  goods_index?: number | null;
  utilities_index?: number | null;
}

interface WeatherData {
  [month: string]: { avg_high: number; avg_low: number; precip_mm: number };
}

function fmt(v: number | null | undefined): string {
  return v ? '$' + v.toLocaleString('en-US') : 'N/A';
}

function fmtIdx(v: number | null | undefined): string {
  return v ? v.toFixed(1) : 'N/A';
}

export function generateAutoFAQs(city: CityData, weather: WeatherData | null): FAQItem[] {
  return [];
}
