import { getIconSize } from '../../../utils/sizeIcon';

const DensityCompactIcon = ({
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
      <path d="M4 7h16v1H4zm0 4.5h16v1H4zm0 4.5h16v1H4z" />
    </svg>
  );
};
export default DensityCompactIcon;
