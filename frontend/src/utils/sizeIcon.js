const SIZES = {
  'x-small': 12,
  small: 16,
  md: 20,
  large: 24,
  'x-large': 28,
  '2x-large': 32,
};

export function getIconSize(size) {
  return SIZES[size] ?? SIZES.md;
}
