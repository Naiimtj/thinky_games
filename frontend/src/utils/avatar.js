const COLORS = [
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#EC4899',
  '#EF4444',
  '#84CC16',
];

const hashString = (value = '') => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + (value.codePointAt(index) ?? 0)) >>> 0;
  }
  return hash;
};

export const getAvatarInitials = (username = '') =>
  username.trim().slice(0, 2).toUpperCase() || 'TG';

export const getAvatarColor = (username = '') => {
  const hash = hashString(username.trim().toLowerCase());
  return COLORS[hash % COLORS.length];
};
