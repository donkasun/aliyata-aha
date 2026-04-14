// src/name-filter.js — flags inappropriate display names.
const BAD_TERMS = [
  'ammata',
  'asshole',
  'bastard',
  'bitch',
  'cunt',
  'dick',
  'fuck',
  'motherfucker',
  'hukapan',
  'hukana',
  'huththa',
  'huththo',
  'pakaya',
  'pussy',
  'shit',
  'slut',
  'whore',

  // Common Sinhala (romanized) profanity (non-exhaustive)
  'hutta',
  'puka',
  'wesige',
  'wesi',
  'wessige',
];

export function isBadName(name = '') {
  const lower = String(name).toLowerCase();
  const squashed = lower.replace(/[^a-z0-9]+/g, ''); // catches "h u t t a" / punctuation obfuscation
  return BAD_TERMS.some((term) => lower.includes(term) || squashed.includes(term));
}
