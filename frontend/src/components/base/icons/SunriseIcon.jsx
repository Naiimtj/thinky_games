import { getIconSize } from '../../../utils/sizeIcon';

const SunriseIcon = ({
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 2v3" />
      <path d="M5.22 6.22l1.42 1.42" />
      <path d="M17.36 7.64l1.42-1.42" />
      <path d="M2 13h3" />
      <path d="M19 13h3" />
      <path d="M5 17.5a7 7 0 0 1 14 0" />
      <line x1="2" y1="17.5" x2="22" y2="17.5" />
      <path d="M8 22l4-5 4 5" />
    </svg>
  );
};

export default SunriseIcon;
