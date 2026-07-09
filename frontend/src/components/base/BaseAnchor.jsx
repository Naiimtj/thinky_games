const BaseAnchor = ({
  label,
  icon,
  href,
  size = 'md',
  variant = 'primary',
  className = '',
  tooltip,
  disabled = false,
  children,
  ...props
}) => {
  const getVariantClasses = () => {
    const variantMap = {
      primary: 'text-btn-primary hover:text-btn-primary-hover hover:underline',
      secondary:
        'text-btn-secondary hover:text-btn-secondary-hover hover:underline',
      success: 'text-success hover:text-success-hover hover:underline',
      danger: 'text-error hover:text-error-hover hover:underline',
      warning: 'text-warning hover:text-warning-hover hover:underline',
      info: 'text-info hover:text-info-hover hover:underline',
      help: 'text-btn-secondary hover:text-btn-secondary-hover hover:underline',
    };
    return variantMap[variant] || variantMap.primary;
  };

  const variantClasses = getVariantClasses();

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const getIconClass = () => {
    if (!icon) return '';
    return icon.startsWith('pi-') ? `pi ${icon}` : icon;
  };

  return (
    <a
      href={disabled ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 transition-colors ${variantClasses} ${
        sizeClasses[size]
      } ${!label ? 'px-2' : ''} ${
        disabled
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer'
      } ${className}`}
      title={tooltip}
      {...props}
    >
      {icon && <i className={getIconClass()} />}
      <span>{label || children}</span>
    </a>
  );
};

export default BaseAnchor;
