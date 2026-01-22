import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { PrimaryButton, SecondaryButton } from '../../components';
import {
  computeHomography,
  homographyToCssMatrix3d,
  renderMockupToCanvas,
  toDisplayPoint,
  toNormalizedPoint,
} from '../../util/overlayTransform';

import css from './OverlayEditor.module.css';

const DEFAULT_OPACITY = 0.8;
const DEFAULT_CORNERS = {
  tl: { x: 0.2, y: 0.2 },
  tr: { x: 0.8, y: 0.2 },
  br: { x: 0.8, y: 0.8 },
  bl: { x: 0.2, y: 0.8 },
};

const OverlayEditor = props => {
  const {
    baseImageUrl,
    overlayState,
    onOverlayAdd,
    onOverlaySetActive,
    onOverlayCornersChange,
    onOverlayOpacityChange,
    onOverlayReset,
  } = props;
  const intl = useIntl();
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const rafRef = useRef(null);
  const draggingRef = useRef(null);
  const cornersRef = useRef(DEFAULT_CORNERS);
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  const handleBaseImageLoad = () => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (rect?.width && rect?.height) {
      setBaseSize({ width: rect.width, height: rect.height });
    }
  };

  const overlays = overlayState?.overlays || [];
  const activeOverlayId = overlayState?.activeOverlayId || overlays[0]?.id || null;
  const activeOverlay = overlays.find(item => item.id === activeOverlayId) || overlays[0] || null;
  const activeCorners = activeOverlay?.corners || DEFAULT_CORNERS;
  const opacity = typeof overlayState?.opacity === 'number' ? overlayState.opacity : DEFAULT_OPACITY;

  useEffect(() => {
    cornersRef.current = activeCorners;
  }, [activeCorners]);

  useEffect(() => {
    if (!overlays.length) return;
    if (!activeOverlayId || !overlays.some(item => item.id === activeOverlayId)) {
      onOverlaySetActive(overlays[0].id);
    }
  }, [overlays, activeOverlayId, onOverlaySetActive]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return undefined;

    const updateSize = () => {
      const rect = img.getBoundingClientRect();
      if (rect.width && rect.height) {
        setBaseSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();

    let observer = null;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => updateSize());
      observer.observe(img);
    } else {
      window.addEventListener('resize', updateSize);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener('resize', updateSize);
      }
    };
  }, [baseImageUrl]);

  const overlayTransforms = useMemo(() => {
    if (!baseSize.width || !baseSize.height) {
      return {};
    }
    return overlays.reduce((acc, overlay) => {
      const image = overlay?.image;
      if (!image) {
        return acc;
      }
      const corners = overlay.corners || DEFAULT_CORNERS;
      const h = computeHomography(
        { width: image.naturalWidth, height: image.naturalHeight },
        corners,
        baseSize
      );
      const matrix = homographyToCssMatrix3d(h);
      if (matrix) {
        acc[overlay.id] = `matrix3d(${matrix.join(',')})`;
      }
      return acc;
    }, {});
  }, [overlays, baseSize]);

  const createOverlayId = () =>
    `overlay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const handleFileChange = event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target.result;
      const img = new Image();
      img.onload = () => {
        onOverlayAdd({
          id: createOverlayId(),
          image: {
            url,
            name: file.name,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          },
          corners: DEFAULT_CORNERS,
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const updateCorner = useCallback(
    (cornerKey, nextPoint, constrain) => {
      const current = cornersRef.current || DEFAULT_CORNERS;
      let nextCorners = { ...current, [cornerKey]: nextPoint };

      if (constrain) {
        if (cornerKey === 'tl') {
          nextCorners = {
            ...current,
            tl: nextPoint,
            tr: { x: current.tr.x, y: nextPoint.y },
            bl: { x: nextPoint.x, y: current.bl.y },
            br: current.br,
          };
        } else if (cornerKey === 'tr') {
          nextCorners = {
            ...current,
            tr: nextPoint,
            tl: { x: current.tl.x, y: nextPoint.y },
            br: { x: nextPoint.x, y: current.br.y },
            bl: current.bl,
          };
        } else if (cornerKey === 'br') {
          nextCorners = {
            ...current,
            br: nextPoint,
            tr: { x: nextPoint.x, y: current.tr.y },
            bl: { x: current.bl.x, y: nextPoint.y },
            tl: current.tl,
          };
        } else if (cornerKey === 'bl') {
          nextCorners = {
            ...current,
            bl: nextPoint,
            tl: { x: nextPoint.x, y: current.tl.y },
            br: { x: current.br.x, y: nextPoint.y },
            tr: current.tr,
          };
        }
      }

      cornersRef.current = nextCorners;
      if (activeOverlayId) {
        onOverlayCornersChange({ id: activeOverlayId, corners: nextCorners });
      }
    },
    [onOverlayCornersChange, activeOverlayId]
  );

  const handlePointerMove = useCallback(
    event => {
      if (!draggingRef.current || !baseSize.width || !baseSize.height) return;
      const { cornerKey } = draggingRef.current;
      const rect = imgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nextPoint = toNormalizedPoint({ x, y }, baseSize);

      const isConstrained = event.shiftKey === true;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        updateCorner(cornerKey, nextPoint, isConstrained);
      });
    },
    [baseSize, updateCorner]
  );

  const handlePointerUp = useCallback(event => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    if (event.target?.releasePointerCapture) {
      event.target.releasePointerCapture(event.pointerId);
    }
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  }, []);

  const startDrag = cornerKey => event => {
    if (!baseSize.width || !baseSize.height) return;
    draggingRef.current = { cornerKey };
    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const cornersInDisplay = baseSize.width && activeCorners
    ? {
        tl: toDisplayPoint(activeCorners.tl, baseSize),
        tr: toDisplayPoint(activeCorners.tr, baseSize),
        br: toDisplayPoint(activeCorners.br, baseSize),
        bl: toDisplayPoint(activeCorners.bl, baseSize),
      }
    : null;

  const loadImage = (url, crossOrigin) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const handleDownload = async () => {
    if (!overlays.length || !baseImageUrl) return;
    try {
      const baseImg = await loadImage(baseImageUrl, 'anonymous');
      const overlayAssets = await Promise.all(
        overlays.map(async overlay => {
          const image = overlay.image;
          if (!image) return null;
          const loaded = await loadImage(image.url, 'anonymous');
          return {
            id: overlay.id,
            image: loaded,
            corners: overlay.corners || DEFAULT_CORNERS,
            size: { width: image.naturalWidth, height: image.naturalHeight },
            hidden: overlay.hidden,
          };
        })
      );

      const canvas = renderMockupToCanvas({
        baseImage: baseImg,
        overlays: overlayAssets.filter(Boolean),
        outputSize: { width: baseImg.naturalWidth, height: baseImg.naturalHeight },
        overlayOpacity: opacity,
      });

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mockup.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      // Canvas export can fail if images are served without CORS headers.
      // In that case, the canvas becomes tainted and blob export is blocked.
      // eslint-disable-next-line no-console
      console.error('Failed to export mockup image', err);
    }
  };

  return (
    <section className={css.section}>
      <div className={css.headerRow}>
        <div className={css.title}>
          <FormattedMessage id="ListingPage.overlayEditor.title" />
        </div>
        <div className={css.controls}>
          <input
            ref={fileInputRef}
            className={css.fileInput}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          <PrimaryButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={css.primaryAction}
          >
            <FormattedMessage
              id={
                overlays.length
                  ? 'ListingPage.overlayEditor.add'
                  : 'ListingPage.overlayEditor.upload'
              }
            />
          </PrimaryButton>
          <SecondaryButton
            type="button"
            onClick={() =>
              activeOverlayId
                ? onOverlayReset({ id: activeOverlayId, corners: DEFAULT_CORNERS })
                : null
            }
            disabled={!activeOverlayId}
            className={css.secondaryAction}
          >
            <FormattedMessage id="ListingPage.overlayEditor.reset" />
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={handleDownload}
            disabled={!overlays.length}
            className={css.downloadAction}
          >
            <FormattedMessage id="ListingPage.overlayEditor.download" />
          </SecondaryButton>
        </div>
      </div>

      <div className={css.sliderRow}>
        <label className={css.sliderLabel} htmlFor="overlay-opacity">
          <FormattedMessage id="ListingPage.overlayEditor.opacity" />
        </label>
        <input
          id="overlay-opacity"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={e => onOverlayOpacityChange(Number.parseFloat(e.target.value))}
          disabled={!overlays.length}
          className={css.slider}
          aria-label={intl.formatMessage({ id: 'ListingPage.overlayEditor.opacity' })}
        />
      </div>

      <div className={css.editor}>
        <div className={css.imageStage}>
          <img
            ref={imgRef}
            src={baseImageUrl}
            alt=""
            className={css.baseImage}
            onLoad={handleBaseImageLoad}
          />
          {overlays.map(overlay => {
            const image = overlay.image;
            if (!image) return null;
            const transform = overlayTransforms[overlay.id];
            if (!transform) return null;
            return (
              <img
                key={overlay.id}
                src={image.url}
                alt={image.name || ''}
                className={classNames(css.overlayImage, {
                  [css.overlayVisible]: transform,
                  [css.overlayActive]: overlay.id === activeOverlayId,
                })}
                style={{
                  transform,
                  opacity,
                  width: `${image.naturalWidth || 0}px`,
                  height: `${image.naturalHeight || 0}px`,
                }}
                onPointerDown={() => onOverlaySetActive(overlay.id)}
              />
            );
          })}
          {activeOverlay && cornersInDisplay ? (
            <div
              className={css.handlesLayer}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {Object.entries(cornersInDisplay).map(([key, point]) => (
                <button
                  key={key}
                  type="button"
                  className={css.handle}
                  style={{ left: point.x, top: point.y }}
                  onPointerDown={startDrag(key)}
                  aria-label={intl.formatMessage(
                    { id: 'ListingPage.overlayEditor.handleLabel' },
                    { corner: key }
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={css.helperText}>
        <FormattedMessage id="ListingPage.overlayEditor.helper" />
      </div>
    </section>
  );
};

export default OverlayEditor;
