import { getIconSize } from '../../../utils/sizeIcon';

const DensityStackedIcon = ({
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
      <rect x="3" y="5" width="18" height="2.5" rx="1" />
      <rect x="3" y="10.5" width="18" height="2.5" rx="1" />
      <rect x="3" y="16" width="18" height="2.5" rx="1" />
    </svg>
  );
};
export default DensityStackedIcon;
