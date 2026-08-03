import React, { useState } from 'react';

const DragAndDropFile = ({ onFilesDrop, children, ...props }) => {
  const [active, setActive] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setActive(false);
    if (onFilesDrop) {
      onFilesDrop(Array.from(e.dataTransfer.files));
    }
  };

  // If children is a function (render prop), pass the dropZoneActive state
  const renderChildren =
    typeof children === 'function'
      ? children({ dropZoneActive: active })
      : children;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-active={active}
      {...props}
    >
      {renderChildren}
    </div>
  );
};

export default DragAndDropFile;
