import { useCallback, useRef, useState } from 'react';
import { Heading } from '../../components';
import { FormattedMessage } from '../../util/reactIntl';

import css from './SectionAdPreview.module.css';

/**
 * SectionAdPreview - Allows users to upload their ad design and preview it
 * overlaid on the listing's ad space image with drag and resize functionality.
 *
 * @param {Object} props
 * @param {Object} props.listing - The current listing
 * @param {string} props.dimensions - The dimensions text from publicData
 * @param {string} props.listingImageUrl - URL of the first listing image
 */
const SectionAdPreview = props => {
  const { listing, dimensions, listingImageUrl } = props;
  const [previewImage, setPreviewImage] = useState(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 50, y: 50 });
  const [overlaySize, setOverlaySize] = useState({ width: 200, height: 120 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = event => {
        setPreviewImage(event.target.result);
        // Reset position, size and rotation for new image
        setOverlayPosition({ x: 50, y: 50 });
        setOverlaySize({ width: 200, height: 120 });
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get mouse/touch position relative to container
  const getEventPosition = useCallback((e, container) => {
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // Drag handlers
  const handleDragStart = useCallback(
    e => {
      if (isResizing || isRotating) return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const pos = getEventPosition(e, container);
      setIsDragging(true);
      setDragStart({
        x: pos.x - overlayPosition.x,
        y: pos.y - overlayPosition.y,
      });
    },
    [overlayPosition, isResizing, isRotating, getEventPosition]
  );

  const handleDragMove = useCallback(
    e => {
      if (!isDragging) return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const pos = getEventPosition(e, container);
      const containerRect = container.getBoundingClientRect();

      // Calculate new position with bounds checking
      let newX = pos.x - dragStart.x;
      let newY = pos.y - dragStart.y;

      // Keep overlay within container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - overlaySize.width));
      newY = Math.max(0, Math.min(newY, containerRect.height - overlaySize.height));

      setOverlayPosition({ x: newX, y: newY });
    },
    [isDragging, dragStart, overlaySize, getEventPosition]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;

      const pos = getEventPosition(e, container);
      setIsResizing(true);
      setDragStart({ x: pos.x, y: pos.y });
    },
    [getEventPosition]
  );

  const handleResizeMove = useCallback(
    e => {
      if (!isResizing) return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const pos = getEventPosition(e, container);
      const containerRect = container.getBoundingClientRect();

      // Calculate new size
      const deltaX = pos.x - dragStart.x;
      const deltaY = pos.y - dragStart.y;

      let newWidth = Math.max(50, overlaySize.width + deltaX);
      let newHeight = Math.max(30, overlaySize.height + deltaY);

      // Keep within container bounds
      newWidth = Math.min(newWidth, containerRect.width - overlayPosition.x);
      newHeight = Math.min(newHeight, containerRect.height - overlayPosition.y);

      setOverlaySize({ width: newWidth, height: newHeight });
      setDragStart({ x: pos.x, y: pos.y });
    },
    [isResizing, dragStart, overlaySize, overlayPosition, getEventPosition]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Rotation handlers
  const handleRotateStart = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
  }, []);

  const handleRotateMove = useCallback(
    e => {
      if (!isRotating) return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const pos = getEventPosition(e, container);

      // Calculate center of overlay
      const centerX = overlayPosition.x + overlaySize.width / 2;
      const centerY = overlayPosition.y + overlaySize.height / 2;

      // Calculate angle from center to mouse position
      const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
      const degrees = (angle * 180) / Math.PI + 90; // +90 to align with top handle

      setRotation(degrees);
    },
    [isRotating, overlayPosition, overlaySize, getEventPosition]
  );

  const handleRotateEnd = useCallback(() => {
    setIsRotating(false);
  }, []);

  // Combined move handler
  const handlePointerMove = useCallback(
    e => {
      if (isDragging) {
        handleDragMove(e);
      } else if (isResizing) {
        handleResizeMove(e);
      } else if (isRotating) {
        handleRotateMove(e);
      }
    },
    [isDragging, isResizing, isRotating, handleDragMove, handleResizeMove, handleRotateMove]
  );

  // Combined end handler
  const handlePointerEnd = useCallback(() => {
    handleDragEnd();
    handleResizeEnd();
    handleRotateEnd();
  }, [handleDragEnd, handleResizeEnd, handleRotateEnd]);

  if (!listing?.id) {
    return null;
  }

  return (
    <section className={css.sectionAdPreview}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="ListingPage.adPreviewTitle" />
      </Heading>

      <p className={css.sectionDescription}>
        <FormattedMessage id="ListingPage.adPreviewDescription" />
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={css.hiddenInput}
      />

      {!previewImage ? (
        <div className={css.uploadSection}>
          {listingImageUrl && (
            <div className={css.previewHint}>
              <img src={listingImageUrl} alt="Ad space" className={css.hintImage} />
              <div className={css.hintOverlay}>
                <FormattedMessage id="ListingPage.adPreviewHint" />
              </div>
            </div>
          )}
          <button type="button" onClick={handleUploadClick} className={css.uploadButton}>
            <FormattedMessage id="ListingPage.adPreviewUploadButton" />
          </button>
        </div>
      ) : (
        <div className={css.previewContainer}>
          {/* Interactive preview area */}
          <div
            ref={containerRef}
            className={css.interactivePreview}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerEnd}
            onMouseLeave={handlePointerEnd}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerEnd}
          >
            {/* Base listing image */}
            {listingImageUrl ? (
              <img src={listingImageUrl} alt="Ad space" className={css.baseImage} />
            ) : (
              <div className={css.noImage}>
                <FormattedMessage id="ListingPage.adPreviewNoImage" />
              </div>
            )}

            {/* Draggable/resizable overlay */}
            <div
              className={css.overlay}
              style={{
                left: `${overlayPosition.x}px`,
                top: `${overlayPosition.y}px`,
                width: `${overlaySize.width}px`,
                height: `${overlaySize.height}px`,
                transform: `rotate(${rotation}deg)`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <img src={previewImage} alt="Your design" className={css.overlayImage} />
              {/* Resize handle */}
              <div
                className={css.resizeHandle}
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
              />
              {/* Rotate handle */}
              <div
                className={css.rotateHandle}
                onMouseDown={handleRotateStart}
                onTouchStart={handleRotateStart}
              />
            </div>
          </div>

          {/* Instructions */}
          <p className={css.instructions}>
            <FormattedMessage id="ListingPage.adPreviewInstructions" />
          </p>

          {/* Dimensions reminder */}
          {dimensions && (
            <p className={css.dimensionsReminder}>
              <FormattedMessage id="ListingPage.adPreviewDimensions" values={{ dimensions }} />
            </p>
          )}

          {/* Action buttons */}
          <div className={css.actionButtons}>
            <button type="button" onClick={handleUploadClick} className={css.changeButton}>
              <FormattedMessage id="ListingPage.adPreviewChangeButton" />
            </button>
            <button type="button" onClick={handleRemove} className={css.removeButton}>
              <FormattedMessage id="ListingPage.adPreviewRemoveButton" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default SectionAdPreview;
