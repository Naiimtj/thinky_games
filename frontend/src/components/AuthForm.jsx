/** Small building blocks shared by the login and register pages. */

import BaseButton from './base/BaseButton';
import BaseTextInput from './base/BaseTextInput';

export const Field = ({ label, type = 'text', value, onChange, ...rest }) => (
  <BaseTextInput
    label={label}
    type={type}
    value={value}
    onChange={onChange}
    required
    {...rest}
  />
);

export const AuthForm = ({
  title,
  submitLabel,
  onSubmit,
  busy,
  error,
  footer,
  children,
}) => (
  <div className="mx-auto max-w-sm">
    <h1 className="mb-6 text-2xl font-black text-slate-800 dark:text-slate-100">
      {title}
    </h1>
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800"
    >
      {children}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      <BaseButton
        type="submit"
        disabled={busy}
        className="w-full"
      >
        {busy ? 'Un momento…' : submitLabel}
      </BaseButton>
    </form>
    <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
      {footer}
    </p>
  </div>
);
