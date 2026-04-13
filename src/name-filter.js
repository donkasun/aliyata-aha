// src/name-filter.js — flags inappropriate display names.
const BAD_TERMS = [
  'ammata',
  'hukapan',
  'hukana',
  'pakaya',
];

export function isBadName(name = '') {
  const lower = name.toLowerCase();
  return BAD_TERMS.some((term) => lower.includes(term));
}
