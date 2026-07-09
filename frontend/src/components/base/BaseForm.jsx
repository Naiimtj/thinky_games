import { Controller } from 'react-hook-form';
import BaseSelectInput from './BaseSelectInput';
import BaseSelect from './BaseSelect';
import BaseCheckbox from './BaseCheckbox';

/**
 * Controller + TextField wrapper for text, date, number, email, and multiline fields.
 *
 * @param {string} name - Field name for react-hook-form Controller
 * @param {object} control - react-hook-form control object
 * @param {string} label - Display label
 * @param {string} [required] - Required validation message; also appends " *" to label and sets mandatory
 * @param {object} [rules] - Additional react-hook-form validation rules (merged with required)
 * @param {string} [type='text'] - Input type: 'text' | 'date' | 'number' | 'email'
 * @param {boolean} [disabled=false]
 * @param {boolean} [fullWidth=true]
 * @param {boolean} [multiline=false]
 * @param {number} [rows] - Number of rows for multiline
 * @param {string} [placeholder]
 * @param {string} [variant='outlined']
 * @param {...any} rest - Additional props passed to MUI TextField
 */
export function BaseFormTextField({
  name,
  control,
  rules,
  required,
  label,
  type = 'text',
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows,
  placeholder,
  variant = 'outlined',
  ...rest
}) {
  const mergedRules = {
    ...(required ? { required } : {}),
    ...rules,
  };

  const displayLabel = required ? `${label} *` : label;
  const isDate = type === 'date';

  return (
    <Controller
      name={name}
      control={control}
      rules={mergedRules}
      render={({ field, fieldState: { error } }) => {
        const hasError = !!error;
        const InputTag = multiline ? 'textarea' : 'input';

        return (
          <div className={fullWidth ? 'w-full' : 'inline-block'}>
            {displayLabel && (
              <label
                className={`block text-sm font-medium mb-1 ${hasError ? 'text-input-label-error' : 'text-input-label'}`}
              >
                {displayLabel}
              </label>
            )}
            <InputTag
              {...field}
              value={field.value ?? ''}
              type={multiline ? undefined : type}
              disabled={disabled}
              placeholder={placeholder}
              rows={multiline ? rows : undefined}
              className={`w-full px-3 py-2 text-sm border rounded outline-none transition-colors ${
                hasError
                  ? 'border-input-error focus:border-input-error focus:ring-1 focus:ring-input-error'
                  : 'border-input-border focus:border-input-focus focus:ring-1 focus:ring-input-focus'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'} ${multiline ? 'resize-y' : ''}`}
              {...rest}
            />
            {error?.message && (
              <p className="mt-1 text-xs text-input-label-error">
                {error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

/**
 * Controller + BaseSelectInput wrapper.
 *
 * @param {string} name - Field name for react-hook-form Controller
 * @param {object} control - react-hook-form control object
 * @param {Array} options - Array of { value, label } options
 * @param {string} label - Display label
 * @param {string} [required] - Required validation message; also sets mandatory on BaseSelectInput
 * @param {object} [rules] - Additional react-hook-form validation rules (merged with required)
 * @param {boolean} [disabled=false]
 * @param {...any} rest - Additional props passed to BaseSelectInput
 */
export function BaseFormSelectInputField({
  name,
  control,
  rules,
  required,
  options,
  label,
  disabled = false,
  ...rest
}) {
  const mergedRules = {
    ...(required ? { required } : {}),
    ...rules,
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={mergedRules}
      render={({ field, fieldState: { error } }) => (
        <BaseSelectInput
          options={options}
          label={label}
          selectedValue={field.value || ''}
          onSelect={(value) => field.onChange(value)}
          disabled={disabled}
          mandatory={!!required}
          error={error}
          {...rest}
        />
      )}
    />
  );
}

/**
 * Controller + BaseSelect wrapper (pure dropdown, no search/typing).
 *
 * @param {string} name - Field name for react-hook-form Controller
 * @param {object} control - react-hook-form control object
 * @param {Array} options - Array of { value, label } options
 * @param {string} label - Display label
 * @param {string} [required] - Required validation message; also sets mandatory on BaseSelect
 * @param {object} [rules] - Additional react-hook-form validation rules (merged with required)
 * @param {boolean} [disabled=false]
 * @param {...any} rest - Additional props passed to BaseSelect
 */
export function BaseFormSelectField({
  name,
  control,
  rules,
  required,
  options,
  label,
  disabled = false,
  ...rest
}) {
  const mergedRules = {
    ...(required ? { required } : {}),
    ...rules,
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={mergedRules}
      render={({ field, fieldState: { error } }) => (
        <BaseSelect
          options={options}
          label={label}
          value={field.value ?? ''}
          onChange={(value) => field.onChange(value)}
          disabled={disabled}
          mandatory={!!required}
          errorMessage={error?.message}
          {...rest}
        />
      )}
    />
  );
}

/**
 * Controller + BaseCheckbox wrapper.
 *
 * @param {string} name - Field name for react-hook-form Controller
 * @param {object} control - react-hook-form control object
 * @param {string} label - Checkbox label
 * @param {boolean} [disabled=false]
 * @param {string} [className]
 * @param {string} [id] - Falls back to name if not provided
 * @param {...any} rest - Additional props passed to BaseCheckbox
 */
export function BaseFormCheckboxField({
  name,
  control,
  label,
  disabled = false,
  className,
  id,
  ...rest
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <BaseCheckbox
          {...field}
          label={label}
          disabled={disabled}
          className={className}
          id={id || name}
          {...rest}
        />
      )}
    />
  );
}

import BaseFormDateField from './BaseFormDateField';

const BaseForm = {
  TextField: BaseFormTextField,
  SelectInputField: BaseFormSelectInputField,
  SelectField: BaseFormSelectField,
  CheckboxField: BaseFormCheckboxField,
  DateField: BaseFormDateField,
};

export { BaseFormDateField };

export default BaseForm;
