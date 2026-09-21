export const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Austrália' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
  { code: 'IT', name: 'Itália' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'PT', name: 'Portugal' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'ZA', name: 'África do Sul' },
] as const;

const ALIASES: Record<string, string> = {
  brazil: 'BR',
  france: 'FR',
  italy: 'IT',
  spain: 'ES',
  portugal: 'PT',
  argentina: 'AR',
  chile: 'CL',
  germany: 'DE',
  australia: 'AU',
  uruguay: 'UY',
  'united states': 'US',
  usa: 'US',
  'south africa': 'ZA',
  'new zealand': 'NZ',
};

export function countryName(code: string | null | undefined): string {
  if (!code) return '';
  return COUNTRIES.find((country) => country.code === code)?.name ?? code;
}

export function inferCountryCode(text: string): string | null {
  const hay = text.toLowerCase();
  const byName = [...COUNTRIES].sort((a, b) => b.name.length - a.name.length);
  for (const country of byName) {
    if (hay.includes(country.name.toLowerCase())) return country.code;
  }
  for (const [alias, code] of Object.entries(ALIASES)) {
    if (hay.includes(alias)) return code;
  }
  const token = text.toUpperCase().match(/\b(AR|AU|BR|CL|DE|ES|FR|IT|NZ|PT|US|UY|ZA)\b/);
  return token ? token[1] : null;
}
