import BaseButton from '../BaseButton';

const ConfirmDeleteFile = ({
  title = 'Confirm File Deletion',
  message = 'Are you sure you want to delete this file',
  warning = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  fileName = 'file',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-4 p-6" {...props}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <p className="text-gray-700">
        {message} <span className="font-medium">"{fileName}"</span>?
      </p>

      <p className="text-sm text-gray-600">{warning}</p>

      <div className="flex gap-2 justify-end">
        <BaseButton label="Cancel" text onClick={onCancel} />
        <BaseButton label="Delete" variant="danger" onClick={onConfirm} />
      </div>
    </div>
  );
};

export default ConfirmDeleteFile;
