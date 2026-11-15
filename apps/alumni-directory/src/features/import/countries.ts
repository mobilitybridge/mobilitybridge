// Countries the import recognises, with the spellings found in Arabic and English sheets.
// ISO 3166-1 alpha-2 codes are what the database stores.

export interface Country {
  code: string;
  en: string;
  ar: string;
  aliases: string[];
}

export const COUNTRIES: Country[] = [
  // Erasmus+ programme countries
  { code: 'AT', en: 'Austria', ar: 'النمسا', aliases: [] },
  { code: 'BE', en: 'Belgium', ar: 'بلجيكا', aliases: [] },
  { code: 'BG', en: 'Bulgaria', ar: 'بلغاريا', aliases: [] },
  { code: 'HR', en: 'Croatia', ar: 'كرواتيا', aliases: [] },
  { code: 'CY', en: 'Cyprus', ar: 'قبرص', aliases: [] },
  { code: 'CZ', en: 'Czechia', ar: 'التشيك', aliases: ['Czech Republic', 'جمهورية التشيك', 'تشيكيا'] },
  { code: 'DK', en: 'Denmark', ar: 'الدنمارك', aliases: ['الدانمارك'] },
  { code: 'EE', en: 'Estonia', ar: 'إستونيا', aliases: [] },
  { code: 'FI', en: 'Finland', ar: 'فنلندا', aliases: [] },
  { code: 'FR', en: 'France', ar: 'فرنسا', aliases: [] },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا', aliases: ['Deutschland', 'المانيا'] },
  { code: 'GR', en: 'Greece', ar: 'اليونان', aliases: [] },
  { code: 'HU', en: 'Hungary', ar: 'هنغاريا', aliases: ['المجر'] },
  { code: 'IS', en: 'Iceland', ar: 'آيسلندا', aliases: [] },
  { code: 'IE', en: 'Ireland', ar: 'أيرلندا', aliases: ['ايرلندا'] },
  { code: 'IT', en: 'Italy', ar: 'إيطاليا', aliases: ['ايطاليا', 'Italia'] },
  { code: 'LV', en: 'Latvia', ar: 'لاتفيا', aliases: [] },
  { code: 'LI', en: 'Liechtenstein', ar: 'ليختنشتاين', aliases: [] },
  { code: 'LT', en: 'Lithuania', ar: 'ليتوانيا', aliases: [] },
  { code: 'LU', en: 'Luxembourg', ar: 'لوكسمبورغ', aliases: [] },
  { code: 'MT', en: 'Malta', ar: 'مالطا', aliases: [] },
  { code: 'NL', en: 'Netherlands', ar: 'هولندا', aliases: ['Holland', 'The Netherlands'] },
  { code: 'MK', en: 'North Macedonia', ar: 'مقدونيا الشمالية', aliases: ['Macedonia'] },
  { code: 'NO', en: 'Norway', ar: 'النرويج', aliases: [] },
  { code: 'PL', en: 'Poland', ar: 'بولندا', aliases: [] },
  { code: 'PT', en: 'Portugal', ar: 'البرتغال', aliases: [] },
  { code: 'RO', en: 'Romania', ar: 'رومانيا', aliases: [] },
  { code: 'RS', en: 'Serbia', ar: 'صربيا', aliases: [] },
  { code: 'SK', en: 'Slovakia', ar: 'سلوفاكيا', aliases: [] },
  { code: 'SI', en: 'Slovenia', ar: 'سلوفينيا', aliases: [] },
  { code: 'ES', en: 'Spain', ar: 'إسبانيا', aliases: ['اسبانيا', 'España'] },
  { code: 'SE', en: 'Sweden', ar: 'السويد', aliases: [] },
  { code: 'TR', en: 'Türkiye', ar: 'تركيا', aliases: ['Turkey'] },
  // Others that appear in alumni records (home country, later careers, partner countries)
  { code: 'PS', en: 'Palestine', ar: 'فلسطين', aliases: ['State of Palestine'] },
  { code: 'JO', en: 'Jordan', ar: 'الأردن', aliases: ['الاردن'] },
  { code: 'EG', en: 'Egypt', ar: 'مصر', aliases: [] },
  { code: 'LB', en: 'Lebanon', ar: 'لبنان', aliases: [] },
  { code: 'MA', en: 'Morocco', ar: 'المغرب', aliases: [] },
  { code: 'TN', en: 'Tunisia', ar: 'تونس', aliases: [] },
  { code: 'DZ', en: 'Algeria', ar: 'الجزائر', aliases: [] },
  { code: 'AE', en: 'United Arab Emirates', ar: 'الإمارات', aliases: ['UAE', 'الامارات'] },
  { code: 'QA', en: 'Qatar', ar: 'قطر', aliases: [] },
  { code: 'SA', en: 'Saudi Arabia', ar: 'السعودية', aliases: ['KSA'] },
  { code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة', aliases: ['UK', 'Britain', 'England', 'بريطانيا'] },
  { code: 'CH', en: 'Switzerland', ar: 'سويسرا', aliases: [] },
  { code: 'US', en: 'United States', ar: 'الولايات المتحدة', aliases: ['USA', 'US', 'أمريكا', 'امريكا'] },
  { code: 'CA', en: 'Canada', ar: 'كندا', aliases: [] },
];

export function countryName(code: string, language: 'ar' | 'en'): string {
  const country = COUNTRIES.find((c) => c.code === code);
  return country ? country[language] : code;
}
