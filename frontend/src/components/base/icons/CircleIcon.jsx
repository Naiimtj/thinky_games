import { getIconSize } from '../../../utils/sizeIcon';

const CircleIcon = ({
  size = 'md',
  color = '#000',
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
      fill={color}
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
};

export default CircleIcon;
