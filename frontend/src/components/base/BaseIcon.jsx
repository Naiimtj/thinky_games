import { iconRegistry } from './icons';

const BaseIcon = ({
  icon,
  size = 'md',
  color = '#000',
  className = '',
  wrapperClassName = '',
  onClick,
  tooltip,
  tooltipPosition = 'top',
  ...props
}) => {
  const IconComponent = iconRegistry[icon];

  const handleKeyDown = onClick
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      }
    : undefined;

  const svgElement = IconComponent ? (
    <IconComponent
      size={size}
      color={color}
      className={`${className} select-none touch-callout-none focus:outline-none${onClick && !wrapperClassName ? ' cursor-pointer' : ''}`}
      onClick={wrapperClassName ? undefined : onClick}
      tabIndex={onClick && !wrapperClassName ? 0 : undefined}
      onKeyDown={wrapperClassName ? undefined : handleKeyDown}
      aria-hidden={onClick ? undefined : true}
      {...props}
    />
  ) : null;

  const iconElement = IconComponent ? (
    wrapperClassName ? (
      <span
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={`${wrapperClassName} select-none ${onClick ? 'cursor-pointer' : ''}`}
      >
        {svgElement}
      </span>
    ) : (
      svgElement
    )
  ) : (
    (() => {
      const sizeClasses = {
        'x-small': 'text-xs',
        small: 'text-sm',
        md: 'text-base',
        large: 'text-lg',
        'x-large': 'text-xl',
        '2x-large': 'text-2xl',
        '3x-large': 'text-3xl',
      };

      const iEl = (
        <i
          className={`${icon} ${sizeClasses[size]} ${className} cursor-pointer`}
          style={{ color }}
          aria-hidden="true"
        />
      );

      if (onClick) {
        return (
          <button
            type="button"
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none p-0 cursor-pointer inline-flex items-center"
            {...props}
          >
            {iEl}
          </button>
        );
      }

      return (
        <i
          className={`${icon} ${sizeClasses[size]} ${className} `}
          style={{ color }}
          aria-hidden="true"
          {...props}
        />
      );
    })()
  );

  if (!tooltip) {
    return iconElement;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span className="relative inline-flex items-center group">
      {iconElement}
      <span
        className={`absolute ${positionClasses[tooltipPosition] || positionClasses.top} pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50`}
      >
        {tooltip}
      </span>
    </span>
  );
};

export default BaseIcon;
