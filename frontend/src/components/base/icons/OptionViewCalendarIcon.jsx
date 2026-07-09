import { getIconSize } from '../../../utils/sizeIcon';

const OptionViewCalendarIcon = ({
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
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M3 17h18v2H3zm0-7h18v5H3zm0-4h18v2H3z" />
    </svg>
  );
};
export default OptionViewCalendarIcon;
