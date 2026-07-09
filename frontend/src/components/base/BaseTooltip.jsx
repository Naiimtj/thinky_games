const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const BaseTooltip = ({ tooltip, position = 'top', children, ...props }) => {
  if (!tooltip) {
    return children;
  }

  return (
    <span className="relative inline-flex items-center group" {...props}>
      {children}
      <span
        className={`absolute ${positionClasses[position] || positionClasses.top} pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50`}
      >
        {tooltip}
      </span>
    </span>
  );
};

export default BaseTooltip;
