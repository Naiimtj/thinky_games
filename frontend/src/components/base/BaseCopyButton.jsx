import { useState } from 'react';
import { useTranslate } from '../../hooks/useTranslate';
import BaseIcon from './BaseIcon';
import BaseTooltip from './BaseTooltip';

export default function BaseCopyButton({
  value,
  size = 16,
  className = '',
  showText = false,
  showIcon = false,
}) {
  const { t } = useTranslate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();

    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!value) return null;

  if (showText) {
    return (
      <BaseTooltip tooltip={copied ? t('common.copied') : t('common.copy')}>
        <div
          onClick={handleCopy}
          className={`group font-semibold flex items-center gap-2 cursor-pointer -mx-2 -my-1 px-2 py-1 rounded transition-all ${
            copied
              ? 'text-textPrimary'
              : 'text-textPrimary hover:underline hover:decoration-textPrimary'
          }`}
        >
          <span>{value}</span>
          {showIcon && (
            <BaseIcon
              icon={copied ? 'check' : 'copy'}
              size={size}
              className={
                copied
                  ? 'stroke-textPrimary'
                  : 'fill-textPrimary transition-all'
              }
            />
          )}
        </div>
      </BaseTooltip>
    );
  }

  return (
    <BaseIcon
      icon={copied ? 'check' : 'copy'}
      size={size}
      onClick={handleCopy}
      className={
        className +
        (!copied
          ? ' hover:fill-textPrimary fill-grayDark'
          : 'stroke-textPrimary')
      }
      tooltip={copied ? t('common.copied') : t('common.copy')}
    />
  );
}
