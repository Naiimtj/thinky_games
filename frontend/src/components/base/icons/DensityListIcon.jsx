import { getIconSize } from '../../../utils/sizeIcon';

const DensityListIcon = ({
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
      <path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3zM3 8h10v1H3zm0 7h10v1H3z" />
    </svg>
  );
};
export default DensityListIcon;
