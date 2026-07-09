import { useState, useRef, useEffect } from 'react';
import BaseIcon from './BaseIcon';

const COLOR_CLASSES = {
  default: 'bg-btn-primary/10 text-btn-primary border-btn-primary/30',
  gray: 'bg-gray-100 text-gray-600 border-gray-300',
  primary: 'bg-lightPrimary text-extraDarkPrimary border-textPrimary',
  warning: 'bg-warning/10 text-warning-active border-warning/30',
  info: 'bg-violet-100 text-violet-800 border-violet-300',
};

const COLOR_ICON_CLASSES = {
  default: 'fill-btn-primary',
  gray: 'fill-gray-600',
  primary: 'fill-extraDarkPrimary',
  warning: 'fill-warning-active',
  info: 'fill-violet-800',
};

const BaseTag = ({
  label = '',
  icon,
  deletable = false,
  editable = false,
  onDelete,
  onEdit,
  color = 'default',
  classNameIcon = '',
  ...props
}) => {
  const [editionMode, setEditionMode] = useState(false);
  const [labelInput, setLabelInput] = useState(label);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editionMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editionMode]);

  const handleToggleEditionMode = () => {
    if (!editable) return;
    setEditionMode(!editionMode);
  };

  const handleUpdateLabel = () => {
    if (onEdit) {
      onEdit(labelInput);
    }
    setEditionMode(false);
  };

  const handleChange = (e) => {
    setLabelInput(e.target.value);
  };

  const colorClass = COLOR_CLASSES[color] ?? COLOR_CLASSES.default;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 ${colorClass} rounded-full text-sm font-medium border group`}
      {...props}
    >
      {icon && (
        <BaseIcon
          icon={icon}
          size="x-small"
          className={`${COLOR_ICON_CLASSES[color] ?? COLOR_ICON_CLASSES.default} ${classNameIcon}`}
        />
      )}
      {(() => {
        if (editionMode) {
          return (
            <input
              ref={inputRef}
              type="text"
              value={labelInput}
              onChange={handleChange}
              onBlur={handleUpdateLabel}
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateLabel();
                }
              }}
              className="w-fit border-b border-gray-700 bg-transparent focus:outline-none text-btn-primary"
              style={{ borderBottom: 'solid 1px #333' }}
            />
          );
        }
        if (editable) {
          return (
            <button
              type="button"
              onClick={handleToggleEditionMode}
              className="cursor-pointer hover:opacity-80 bg-transparent border-none p-0"
            >
              {label}
            </button>
          );
        }
        return <span>{label}</span>;
      })()}

      {deletable && (
        <button
          onClick={() => onDelete?.()}
          aria-label={`Delete ${label}`}
          className="ml-1 opacity-60 hover:opacity-100 transition-opacity leading-none"
        >
          <BaseIcon icon="close" size="x-small" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default BaseTag;
