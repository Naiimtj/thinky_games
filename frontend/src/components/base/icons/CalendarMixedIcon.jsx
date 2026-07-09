import { getIconSize } from '../../../utils/sizeIcon';

const CalendarMixedIcon = ({
  size = 'md',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  const iconSize = getIconSize(size);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      {/* <line x1="16" y1="2" x2="16" y2="6" /> */}
      {/* <line x1="8" y1="2" x2="8" y2="6" /> */}
      <line x1="3" y1="10" x2="21" y2="10" />
      {/* Vertical split line */}
      <line x1="12" y1="10" x2="12" y2="22" strokeWidth="0.5" />
      {/* Left: grid lines (Gregorian) */}
      <line x1="3" y1="14" x2="12" y2="14" strokeWidth="1" opacity="0.7" />
      <line x1="3" y1="18" x2="12" y2="18" strokeWidth="1" opacity="0.7" />
      {/* Right: "19" (Badí') */}
      <text
        x="16.5"
        y="18.5"
        textAnchor="middle"
        fill={color}
        stroke="none"
        fontSize="7"
        fontWeight="normal"
      >
        19
      </text>
    </svg>
  );
};

export default CalendarMixedIcon;
