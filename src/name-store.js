// src/name-store.js — persists display name in localStorage.
const KEY = 'eyedrop-name';
export const getName = ()     => localStorage.getItem(KEY) || '';
export const setName = (name) => localStorage.setItem(KEY, name.trim().slice(0, 20));
