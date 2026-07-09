import { useId } from 'react';
import BaseIcon from './BaseIcon';

const BaseModal = ({
  visible = false,
  title,
  onClose,
  fullscreen = false,
  closeButtonHidden = false,
  closeLabel = 'Close',
  children,
  ...props
}) => {
  const titleId = useId();

  if (!visible) return null;

  return (
    <div
      role="none"
      className="fixed inset-0 bg-black/30 backdrop-blur-xl flex items-center justify-center z-50 "
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
      {...props}
    >
      <dialog
        open
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`bg-white dark:bg-gray-900 shadow-lg relative max-h-[88vh] md:max-h-[90vh] md:max-w-[90%] overflow-y-auto p-0 rounded-lg ${
          fullscreen
            ? 'w-full h-full md:h-auto md:w-[90%] md:max-w-2xl'
            : 'w-[90%] max-w-2xl'
        }`}
      >
        {!closeButtonHidden && (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="absolute z-10 right-0 top-0 m-1 p-0 bg-transparent border-none cursor-pointer leading-none"
          >
            <BaseIcon
              icon="close"
              className="fill-darkPrimary hover:fill-textPrimary dark:fill-gray-300 dark:hover:fill-white"
              aria-hidden="true"
            />
          </button>
        )}

        <div className="bg-gray-50 dark:bg-gray-900 p-6 flex flex-col gap-4">
          {title && (
            <h2
              id={titleId}
              className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center"
            >
              {title}
            </h2>
          )}
          {children}
        </div>
      </dialog>
    </div>
  );
};

export default BaseModal;
