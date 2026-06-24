/**
 * Maps ESPN team abbreviations → ISO 3166-1 alpha-2 country codes → flag emoji.
 *
 * ESPN abbreviations are 2-3 characters and vary by competition.
 * This table covers all 48 FIFA World Cup 2026 qualified nations.
 * Add entries as needed if ESPN uses unexpected abbreviations.
 */

const ESPN_TO_ISO2: Record<string, string> = {
  // South America
  ARG: 'AR', BRA: 'BR', URU: 'UY', COL: 'CO',
  ECU: 'EC', PAR: 'PY', VEN: 'VE', PER: 'PE',
  CHL: 'CL', BOL: 'BO',

  // North/Central America & Caribbean
  USA: 'US', MEX: 'MX', CAN: 'CA', CRC: 'CR',
  PAN: 'PA', JAM: 'JM', HON: 'HN', SLV: 'SV',
  HAI: 'HT', TRI: 'TT',

  // Europe
  ENG: 'GB', FRA: 'FR', ESP: 'ES', GER: 'DE',
  POR: 'PT', NED: 'NL', BEL: 'BE', ITA: 'IT',
  CRO: 'HR', SUI: 'CH', AUT: 'AT', DEN: 'DK',
  SWE: 'SE', NOR: 'NO', POL: 'PL', CZE: 'CZ',
  SRB: 'RS', GRE: 'GR', TUR: 'TR', UKR: 'UA',
  WAL: 'GB', SCO: 'GB', IRE: 'IE', HUN: 'HU',
  ROU: 'RO', SVK: 'SK', SLO: 'SI', GEO: 'GE',
  ALB: 'AL',

  // Africa
  SEN: 'SN', MAR: 'MA', NGA: 'NG', GHA: 'GH',
  CMR: 'CM', MLI: 'ML', EGY: 'EG', TUN: 'TN',
  CIV: 'CI', ALG: 'DZ', ZIM: 'ZW', COM: 'KM',

  // Asia & Oceania
  JPN: 'JP', KOR: 'KR', IRN: 'IR', SAU: 'SA',
  QAT: 'QA', AUS: 'AU', NZL: 'NZ', PHI: 'PH',
  IND: 'IN', CHN: 'CN', IDN: 'ID',

  // Middle East
  UAE: 'AE', IRQ: 'IQ', JOR: 'JO', OMA: 'OM',
}

/**
 * Convert a 2-character ISO 3166-1 alpha-2 code to a flag emoji.
 * Uses Unicode regional indicator symbols (U+1F1E6 through U+1F1FF).
 */
function isoToFlag(iso2: string): string {
  return [...iso2.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('')
}

/**
 * Get a flag emoji from an ESPN team abbreviation.
 * Returns the white flag emoji if the abbreviation is not in the table.
 */
export function getTeamFlag(espnAbbreviation: string): string {
  const iso2 = ESPN_TO_ISO2[espnAbbreviation?.toUpperCase() ?? '']
  return iso2 ? isoToFlag(iso2) : '🏳️'
}

/**
 * Get the ISO 3166-1 alpha-2 code from an ESPN abbreviation.
 * Used for storing team codes (flag is always computed, never stored).
 */
export function getTeamCode(espnAbbreviation: string): string {
  return ESPN_TO_ISO2[espnAbbreviation?.toUpperCase() ?? ''] ?? espnAbbreviation
    }
