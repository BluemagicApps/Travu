// Single source of truth for country data used across the booking flow:
// passport country, contact dialing code, billing country, plus the
// per-country rules that drive dynamic passport-number and phone-number
// validation. Specific passport patterns are provided for major issuers;
// every other country falls back to a sensible generic alphanumeric rule.

export interface PassportRule {
  /** Validates the FULL passport number (already uppercased, spaces stripped). */
  regex: RegExp;
  /** Placeholder shown in the input. */
  example: string;
  /** Max characters to accept in the field. */
  maxLen: number;
  /** Allowed character set for live filtering: alphanumeric or digits only. */
  charset: "alnum" | "digits";
}

export interface Country {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  name: string;
  /** Calling code without the leading "+". */
  dial: string;
  /** Allowed national-number digit counts (excludes the dial code). */
  phoneLengths: number[];
}

// [code, name, dial, nationalPhoneLength?]
type Raw = [string, string, string, number?];

const RAW: Raw[] = [
  ["AF", "Afghanistan", "93", 9],
  ["AL", "Albania", "355", 9],
  ["DZ", "Algeria", "213", 9],
  ["AD", "Andorra", "376", 6],
  ["AO", "Angola", "244", 9],
  ["AG", "Antigua and Barbuda", "1", 10],
  ["AR", "Argentina", "54", 10],
  ["AM", "Armenia", "374", 8],
  ["AU", "Australia", "61", 9],
  ["AT", "Austria", "43", 10],
  ["AZ", "Azerbaijan", "994", 9],
  ["BS", "Bahamas", "1", 10],
  ["BH", "Bahrain", "973", 8],
  ["BD", "Bangladesh", "880", 10],
  ["BB", "Barbados", "1", 10],
  ["BY", "Belarus", "375", 9],
  ["BE", "Belgium", "32", 9],
  ["BZ", "Belize", "501", 7],
  ["BJ", "Benin", "229", 8],
  ["BT", "Bhutan", "975", 8],
  ["BO", "Bolivia", "591", 8],
  ["BA", "Bosnia and Herzegovina", "387", 8],
  ["BW", "Botswana", "267", 8],
  ["BR", "Brazil", "55", 11],
  ["BN", "Brunei", "673", 7],
  ["BG", "Bulgaria", "359", 9],
  ["BF", "Burkina Faso", "226", 8],
  ["BI", "Burundi", "257", 8],
  ["KH", "Cambodia", "855", 9],
  ["CM", "Cameroon", "237", 9],
  ["CA", "Canada", "1", 10],
  ["CV", "Cape Verde", "238", 7],
  ["CF", "Central African Republic", "236", 8],
  ["TD", "Chad", "235", 8],
  ["CL", "Chile", "56", 9],
  ["CN", "China", "86", 11],
  ["CO", "Colombia", "57", 10],
  ["KM", "Comoros", "269", 7],
  ["CG", "Congo", "242", 9],
  ["CD", "Congo (DRC)", "243", 9],
  ["CR", "Costa Rica", "506", 8],
  ["CI", "Côte d'Ivoire", "225", 10],
  ["HR", "Croatia", "385", 9],
  ["CU", "Cuba", "53", 8],
  ["CY", "Cyprus", "357", 8],
  ["CZ", "Czechia", "420", 9],
  ["DK", "Denmark", "45", 8],
  ["DJ", "Djibouti", "253", 8],
  ["DM", "Dominica", "1", 10],
  ["DO", "Dominican Republic", "1", 10],
  ["EC", "Ecuador", "593", 9],
  ["EG", "Egypt", "20", 10],
  ["SV", "El Salvador", "503", 8],
  ["GQ", "Equatorial Guinea", "240", 9],
  ["ER", "Eritrea", "291", 7],
  ["EE", "Estonia", "372", 8],
  ["SZ", "Eswatini", "268", 8],
  ["ET", "Ethiopia", "251", 9],
  ["FJ", "Fiji", "679", 7],
  ["FI", "Finland", "358", 9],
  ["FR", "France", "33", 9],
  ["GA", "Gabon", "241", 8],
  ["GM", "Gambia", "220", 7],
  ["GE", "Georgia", "995", 9],
  ["DE", "Germany", "49", 11],
  ["GH", "Ghana", "233", 9],
  ["GR", "Greece", "30", 10],
  ["GD", "Grenada", "1", 10],
  ["GT", "Guatemala", "502", 8],
  ["GN", "Guinea", "224", 9],
  ["GW", "Guinea-Bissau", "245", 7],
  ["GY", "Guyana", "592", 7],
  ["HT", "Haiti", "509", 8],
  ["HN", "Honduras", "504", 8],
  ["HK", "Hong Kong", "852", 8],
  ["HU", "Hungary", "36", 9],
  ["IS", "Iceland", "354", 7],
  ["IN", "India", "91", 10],
  ["ID", "Indonesia", "62", 10],
  ["IR", "Iran", "98", 10],
  ["IQ", "Iraq", "964", 10],
  ["IE", "Ireland", "353", 9],
  ["IL", "Israel", "972", 9],
  ["IT", "Italy", "39", 10],
  ["JM", "Jamaica", "1", 10],
  ["JP", "Japan", "81", 10],
  ["JO", "Jordan", "962", 9],
  ["KZ", "Kazakhstan", "7", 10],
  ["KE", "Kenya", "254", 9],
  ["KI", "Kiribati", "686", 8],
  ["KW", "Kuwait", "965", 8],
  ["KG", "Kyrgyzstan", "996", 9],
  ["LA", "Laos", "856", 9],
  ["LV", "Latvia", "371", 8],
  ["LB", "Lebanon", "961", 8],
  ["LS", "Lesotho", "266", 8],
  ["LR", "Liberia", "231", 8],
  ["LY", "Libya", "218", 9],
  ["LI", "Liechtenstein", "423", 7],
  ["LT", "Lithuania", "370", 8],
  ["LU", "Luxembourg", "352", 9],
  ["MO", "Macau", "853", 8],
  ["MG", "Madagascar", "261", 9],
  ["MW", "Malawi", "265", 9],
  ["MY", "Malaysia", "60", 9],
  ["MV", "Maldives", "960", 7],
  ["ML", "Mali", "223", 8],
  ["MT", "Malta", "356", 8],
  ["MH", "Marshall Islands", "692", 7],
  ["MR", "Mauritania", "222", 8],
  ["MU", "Mauritius", "230", 8],
  ["MX", "Mexico", "52", 10],
  ["FM", "Micronesia", "691", 7],
  ["MD", "Moldova", "373", 8],
  ["MC", "Monaco", "377", 8],
  ["MN", "Mongolia", "976", 8],
  ["ME", "Montenegro", "382", 8],
  ["MA", "Morocco", "212", 9],
  ["MZ", "Mozambique", "258", 9],
  ["MM", "Myanmar", "95", 9],
  ["NA", "Namibia", "264", 9],
  ["NR", "Nauru", "674", 7],
  ["NP", "Nepal", "977", 10],
  ["NL", "Netherlands", "31", 9],
  ["NZ", "New Zealand", "64", 9],
  ["NI", "Nicaragua", "505", 8],
  ["NE", "Niger", "227", 8],
  ["NG", "Nigeria", "234", 10],
  ["KP", "North Korea", "850", 10],
  ["MK", "North Macedonia", "389", 8],
  ["NO", "Norway", "47", 8],
  ["OM", "Oman", "968", 8],
  ["PK", "Pakistan", "92", 10],
  ["PW", "Palau", "680", 7],
  ["PS", "Palestine", "970", 9],
  ["PA", "Panama", "507", 8],
  ["PG", "Papua New Guinea", "675", 8],
  ["PY", "Paraguay", "595", 9],
  ["PE", "Peru", "51", 9],
  ["PH", "Philippines", "63", 10],
  ["PL", "Poland", "48", 9],
  ["PT", "Portugal", "351", 9],
  ["QA", "Qatar", "974", 8],
  ["RO", "Romania", "40", 9],
  ["RU", "Russia", "7", 10],
  ["RW", "Rwanda", "250", 9],
  ["KN", "Saint Kitts and Nevis", "1", 10],
  ["LC", "Saint Lucia", "1", 10],
  ["VC", "Saint Vincent and the Grenadines", "1", 10],
  ["WS", "Samoa", "685", 7],
  ["SM", "San Marino", "378", 10],
  ["ST", "São Tomé and Príncipe", "239", 7],
  ["SA", "Saudi Arabia", "966", 9],
  ["SN", "Senegal", "221", 9],
  ["RS", "Serbia", "381", 9],
  ["SC", "Seychelles", "248", 7],
  ["SL", "Sierra Leone", "232", 8],
  ["SG", "Singapore", "65", 8],
  ["SK", "Slovakia", "421", 9],
  ["SI", "Slovenia", "386", 8],
  ["SB", "Solomon Islands", "677", 7],
  ["SO", "Somalia", "252", 8],
  ["ZA", "South Africa", "27", 9],
  ["KR", "South Korea", "82", 10],
  ["SS", "South Sudan", "211", 9],
  ["ES", "Spain", "34", 9],
  ["LK", "Sri Lanka", "94", 9],
  ["SD", "Sudan", "249", 9],
  ["SR", "Suriname", "597", 7],
  ["SE", "Sweden", "46", 9],
  ["CH", "Switzerland", "41", 9],
  ["SY", "Syria", "963", 9],
  ["TW", "Taiwan", "886", 9],
  ["TJ", "Tajikistan", "992", 9],
  ["TZ", "Tanzania", "255", 9],
  ["TH", "Thailand", "66", 9],
  ["TL", "Timor-Leste", "670", 8],
  ["TG", "Togo", "228", 8],
  ["TO", "Tonga", "676", 7],
  ["TT", "Trinidad and Tobago", "1", 10],
  ["TN", "Tunisia", "216", 8],
  ["TR", "Turkey", "90", 10],
  ["TM", "Turkmenistan", "993", 8],
  ["TV", "Tuvalu", "688", 6],
  ["UG", "Uganda", "256", 9],
  ["UA", "Ukraine", "380", 9],
  ["AE", "United Arab Emirates", "971", 9],
  ["GB", "United Kingdom", "44", 10],
  ["US", "United States", "1", 10],
  ["UY", "Uruguay", "598", 8],
  ["UZ", "Uzbekistan", "998", 9],
  ["VU", "Vanuatu", "678", 7],
  ["VA", "Vatican City", "39", 10],
  ["VE", "Venezuela", "58", 10],
  ["VN", "Vietnam", "84", 9],
  ["YE", "Yemen", "967", 9],
  ["ZM", "Zambia", "260", 9],
  ["ZW", "Zimbabwe", "263", 9],
];

const GENERIC_PHONE_LENGTHS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export const COUNTRIES: Country[] = RAW.map(([code, name, dial, len]) => ({
  code,
  name,
  dial,
  phoneLengths: len ? [len] : GENERIC_PHONE_LENGTHS,
})).sort((a, b) => a.name.localeCompare(b.name));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
// First country wins for shared dial codes (e.g. +1 → United States); fine for length checks.
const BY_DIAL = new Map<string, Country>();
for (const c of COUNTRIES) if (!BY_DIAL.has(c.dial)) BY_DIAL.set(c.dial, c);

// --- Passport rules -------------------------------------------------------

export const GENERIC_PASSPORT: PassportRule = {
  regex: /^[A-Z0-9]{5,9}$/,
  example: "AB123456",
  maxLen: 9,
  charset: "alnum",
};

const PASSPORT_RULES: Record<string, PassportRule> = {
  US: { regex: /^[0-9]{9}$/, example: "123456789", maxLen: 9, charset: "digits" },
  GB: { regex: /^[0-9]{9}$/, example: "123456789", maxLen: 9, charset: "digits" },
  CA: { regex: /^[A-Z]{2}[0-9]{6}$/, example: "AB123456", maxLen: 8, charset: "alnum" },
  NG: { regex: /^[A-Z][0-9]{8}$/, example: "A12345678", maxLen: 9, charset: "alnum" },
  IN: { regex: /^[A-Z][0-9]{7}$/, example: "A1234567", maxLen: 8, charset: "alnum" },
  AU: { regex: /^[A-Z][0-9]{7}$|^[A-Z]{2}[0-9]{7}$/, example: "N1234567", maxLen: 9, charset: "alnum" },
  DE: { regex: /^[CFGHJKLMNPRTVWXYZ0-9]{9}$/, example: "C01X00T47", maxLen: 9, charset: "alnum" },
  FR: { regex: /^[0-9]{2}[A-Z]{2}[0-9]{5}$/, example: "12AB34567", maxLen: 9, charset: "alnum" },
  ZA: { regex: /^[A-Z][0-9]{8}$/, example: "A12345678", maxLen: 9, charset: "alnum" },
  AE: { regex: /^[A-Z0-9]{7,9}$/, example: "P1234567", maxLen: 9, charset: "alnum" },
  GH: { regex: /^[A-Z][0-9]{7,8}$/, example: "G1234567", maxLen: 9, charset: "alnum" },
  KE: { regex: /^[A-Z][0-9]{6,8}$/, example: "A1234567", maxLen: 9, charset: "alnum" },
  CN: { regex: /^[A-Z][0-9]{8}$/, example: "E12345678", maxLen: 9, charset: "alnum" },
  JP: { regex: /^[A-Z]{2}[0-9]{7}$/, example: "TK1234567", maxLen: 9, charset: "alnum" },
  BR: { regex: /^[A-Z]{2}[0-9]{6}$/, example: "AB123456", maxLen: 8, charset: "alnum" },
  IT: { regex: /^[A-Z0-9]{2}[0-9]{7}$/, example: "YA1234567", maxLen: 9, charset: "alnum" },
  ES: { regex: /^[A-Z0-9]{2}[0-9]{6}$/, example: "AB123456", maxLen: 8, charset: "alnum" },
  NL: { regex: /^[A-Z]{2}[A-Z0-9]{6}[0-9]$/, example: "NX12A3B45", maxLen: 9, charset: "alnum" },
  RU: { regex: /^[0-9]{9}$/, example: "123456789", maxLen: 9, charset: "digits" },
  MX: { regex: /^[A-Z0-9]{8,9}$/, example: "G12345678", maxLen: 9, charset: "alnum" },
};

export function getCountry(code: string): Country | undefined {
  return BY_CODE.get(code);
}

export function getCountryByDial(dial: string): Country | undefined {
  return BY_DIAL.get(dial);
}

export function passportRule(code: string): PassportRule {
  return PASSPORT_RULES[code] ?? GENERIC_PASSPORT;
}

/** Allowed national-number lengths for a given dial code. */
export function phoneLengthsForDial(dial: string): number[] {
  return BY_DIAL.get(dial)?.phoneLengths ?? GENERIC_PHONE_LENGTHS;
}

/** Allowed national-number lengths for a given ISO country code. */
export function phoneLengthsForCountry(code: string): number[] {
  return BY_CODE.get(code)?.phoneLengths ?? GENERIC_PHONE_LENGTHS;
}

/** Validate a passport number against the selected country's rule. */
export function isValidPassport(code: string, value: string): boolean {
  if (!value) return false;
  return passportRule(code).regex.test(value.toUpperCase());
}

/** Validate a phone national-number (digits only) against the country's allowed lengths. */
export function isValidPhone(code: string, value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return phoneLengthsForCountry(code).includes(digits.length);
}
