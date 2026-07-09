import { useRef, useState } from 'react';
import DragAndDropFile from './DragAndDropFile';
import BaseButton from '../BaseButton';
import BaseIcon from '../BaseIcon';

const BaseDropFile = ({
  label = 'Upload Files',
  limitNumberFiles = 1,
  limitSizeFile = '10',
  formats = [],
  buttonLabel = 'Browse files',
  files = [],
  labelFormat = 'Format accepted:',
  labelLimit = 'Limit of file:',
  labelDragAndDrop = 'Drag and drop files here',
  labelInvalidFormatMessage0 = 'Invalid file format',
  labelInvalidFormatMessage1 = 'Remember the file must be in',
  labelInvalidFormatMessage2 = 'format and less than',
  labelMaxFile = 'Max. number of files',
  labelReachedMaxFiles = 'Reached maximum number of files',
  disabled = false,
  onAddFiles,
  onDeleteFile,
  ...props
}) => {
  const fileInputRef = useRef(null);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [invalidFilesNames, setInvalidFilesNames] = useState([]);

  const MAX_FILE_SIZE_BYTES = Number(limitSizeFile) * 1024 * 1024;
  const uploadIsDisabled = (files?.length ?? 0) >= limitNumberFiles || disabled;

  const formattedFormats =
    formats?.map((format) => `.${format}`).join(', ') || '';

  const truncateString = (name, length = 25) => {
    if (name.length > length) {
      const extension = name.split('.').pop();
      return name.substring(0, length) + '... .' + extension;
    }
    return name;
  };

  const getInvalidFiles = (addedFiles) => {
    return addedFiles.filter((file) => {
      const fileExtensionInName = file.name.split('.').pop()?.toLowerCase();
      const isValidFormat = formats.includes(fileExtensionInName);
      const isValidSize = file.size <= MAX_FILE_SIZE_BYTES;
      return !isValidFormat || !isValidSize;
    });
  };

  const addFiles = (addedFiles) => {
    const currentFilesCount = files?.length ?? 0;
    const availableSlots = limitNumberFiles - currentFilesCount;

    if (addedFiles.length > availableSlots) {
      if (availableSlots <= 0) {
        return;
      }
      addedFiles = addedFiles.slice(0, availableSlots);
    }

    const invalidFiles = getInvalidFiles(addedFiles);
    if (invalidFiles.length > 0) {
      setShowErrorMessage(true);
      setInvalidFilesNames(invalidFiles.map((file) => file.name));
      return;
    }

    if (onAddFiles) {
      onAddFiles(addedFiles);
    }
  };

  const cleanErrorFiles = () => {
    setShowErrorMessage(false);
    setInvalidFilesNames([]);
  };

  const handleFileInputChange = (event) => {
    const input = event.target;
    if (input.files && input.files.length > 0) {
      cleanErrorFiles();
      addFiles(Array.from(input.files));
    }
  };

  const handleFilesDropped = (droppedFiles) => {
    if (droppedFiles && droppedFiles.length > 0) {
      cleanErrorFiles();
      addFiles(droppedFiles);
    }
  };

  const handleClickBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteFile = (index) => {
    if (onDeleteFile) {
      onDeleteFile(index);
    }
  };

  return (
    <DragAndDropFile onFilesDrop={handleFilesDropped}>
      {({ dropZoneActive }) => (
        <div
          className={`${
            dropZoneActive ? 'border-dashed border border-gray-300' : ''
          }`}
          {...props}
        >
          <div className="flex flex-col gap-2.5 w-full">
            <div className="flex flex-row items-center gap-4 w-full">
              <div className="flex-1">
                <h2 className="text-lg text-gray-900 font-medium">{label}</h2>
                <span className="flex text-sm text-gray-500 text-left">
                  {labelFormat} {formats?.join(', ').toUpperCase()}
                </span>
                <div className="flex text-sm text-gray-500 text-left">
                  {labelLimit} {limitSizeFile} MB | {labelMaxFile}:{' '}
                  {limitNumberFiles}
                  {uploadIsDisabled && (
                    <span className="flex flex-row gap-2 items-center ml-2 text-yellow-600 text-xs">
                      <i className="pi pi-exclamation-circle" />
                      {labelReachedMaxFiles}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-gray-400">
                <BaseButton
                  outlined
                  onClick={handleClickBrowse}
                  disabled={uploadIsDisabled}
                  label={buttonLabel}
                />
                <input
                  type="file"
                  className="hidden"
                  id="upload"
                  name="upload"
                  accept={formats.map((f) => `.${f}`).join(',')}
                  onChange={handleFileInputChange}
                  ref={fileInputRef}
                  multiple
                />
              </div>
            </div>

            {!uploadIsDisabled && (
              <div className="flex flex-col items-center justify-center">
                <div className="text-gray-400 w-full flex flex-col gap-2 justify-center items-center border-dashed border-2 py-10">
                  <i className="pi pi-file" style={{ fontSize: '1.5rem' }} />
                  <span>{labelDragAndDrop}</span>
                </div>

                {/* Error Message */}
                {showErrorMessage && (
                  <div className="text-red-600 text-sm flex flex-col items-center mt-4">
                    <p className="font-bold text-base">
                      - {labelInvalidFormatMessage0} -
                    </p>
                    {invalidFilesNames.map((name, index) => (
                      <p key={`invalid-${name}-${index}`}>"{name}"</p>
                    ))}
                    <p>
                      {labelInvalidFormatMessage1} {formattedFormats}{' '}
                      {labelInvalidFormatMessage2} {limitSizeFile} MB.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Files List */}
          {files && files.length > 0 && (
            <div className="bg-gray-50 p-4 w-full mt-4">
              <div className="flex flex-row flex-wrap gap-4">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex flex-col gap-2 w-fit items-center bg-white p-2 rounded-md drop-shadow-md relative"
                  >
                    <i className="pi pi-file" style={{ fontSize: '1.5rem' }} />

                    {/* Delete File Button */}
                    <button
                      onClick={() => handleDeleteFile(index)}
                      disabled={disabled}
                      className="absolute top-3 right-2 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Delete file ${file.name}`}
                    >
                      <BaseIcon
                        icon="pi-trash"
                        size="small"
                        aria-hidden="true"
                      />
                    </button>

                    {/* File Name */}
                    <span className="text-xs text-gray-700 mt-4">
                      {truncateString(file.name)}
                    </span>

                    {/* Download File Button */}
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      aria-label={`Download file ${file.name}`}
                    >
                      <BaseIcon
                        icon="pi-download"
                        size="small"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DragAndDropFile>
  );
};

export default BaseDropFile;
