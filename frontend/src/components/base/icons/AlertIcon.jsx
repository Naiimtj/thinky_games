const AlertIcon = ({
  size = 'md',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  const sizeMap = {
    'x-small': '16',
    small: '20',
    md: '24',
    large: '32',
    'x-large': '48',
  };

  const iconSize = sizeMap[size] || sizeMap.md;

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
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
};

export default AlertIcon;
