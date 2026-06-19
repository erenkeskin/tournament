// 48 World Cup nations → emoji flags
export const COUNTRY_FLAGS: Record<string, string> = {
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  Brazil: '🇧🇷',
  Cameroon: '🇨🇲',
  Canada: '🇨🇦',
  Chile: '🇨🇱',
  China: '🇨🇳',
  Colombia: '🇨🇴',
  Costa_Rica: '🇨🇷',
  Croatia: '🇭🇷',
  Denmark: '🇩🇰',
  Ecuador: '🇪🇨',
  Egypt: '🇪🇬',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Iran: '🇮🇷',
  Iraq: '🇮🇶',
  Italy: '🇮🇹',
  Japan: '🇯🇵',
  Korea_Republic: '🇰🇷',
  Mali: '🇲🇱',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  Netherlands: '🇳🇱',
  New_Zealand: '🇳🇿',
  Nigeria: '🇳🇬',
  Norway: '🇳🇴',
  Paraguay: '🇵🇾',
  Peru: '🇵🇪',
  Poland: '🇵🇱',
  Portugal: '🇵🇹',
  Qatar: '🇶🇦',
  Romania: '🇷🇴',
  Saudi_Arabia: '🇸🇦',
  Senegal: '🇸🇳',
  Serbia: '🇷🇸',
  South_Africa: '🇿🇦',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Turkey: '🇹🇷',
  Ukraine: '🇺🇦',
  United_States: '🇺🇸',
  Uruguay: '🇺🇾',
};

export function getFlag(nation: string | null | undefined): string {
  if (!nation) return '';
  // Try exact match first, then underscore variant
  if (COUNTRY_FLAGS[nation]) return COUNTRY_FLAGS[nation];
  const underscored = nation.replace(/ /g, '_');
  if (COUNTRY_FLAGS[underscored]) return COUNTRY_FLAGS[underscored];
  return '';
}
