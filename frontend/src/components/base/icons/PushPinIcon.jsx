import { getIconSize } from '../../../utils/sizeIcon';

const PushPinIcon = ({
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
      viewBox="0 0 48 48"
      fill={color}
      className={className}
      {...props}
    >
      <path d="M30.7 3.4c-.8.9-1.8 2.9-2.2 4.5-.8 3.6-4.3 6.1-8.5 6.1-3.8 0-9 2.1-10.9 4.4-1.3 1.5-.9 2.2 3 6.2l4.3 4.4-6.5 6.8C-1.6 47.5.5 49.6 12.2 38.1l6.8-6.5 4.3 4.2c2.3 2.3 4.8 4.2 5.4 4.2 1.6 0 5.3-8 5.3-11.4 0-4.7 2.5-8.1 6.8-9.4 2.2-.7 4.2-1.8 4.5-2.6.3-.8-2.3-4.2-6.2-8-6.2-6.1-6.9-6.6-8.4-5.2zm6 7.8c3.9 3.8 4.1 4.8.9 4.8-3.2 0-7.1 6.2-7.8 12.3-.3 2.6-.9 5.1-1.2 5.5-.4.3-3.9-2.6-7.8-6.6-4-3.9-6.9-7.4-6.6-7.8.4-.3 2.9-.9 5.5-1.2 6.4-.7 12.3-4.4 12.3-7.7s.7-3.2 4.7.7z" />
  </svg>
  );
};

export default PushPinIcon;
