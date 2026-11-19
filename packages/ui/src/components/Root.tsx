import React, { useContext, forwardRef, ReactNode, Ref, useEffect } from 'react';
import { Size } from '@pdfme/common';
import { FontContext, OptionsContext } from '../contexts.js';
import { DESIGNER_CLASSNAME } from '../constants.js';
import { getCanvasBackground } from '../designerOptions.js';
import Spinner from './Spinner.js';

type Props = { size: Size; scale: number; children: ReactNode };

const Root = ({ size, scale, children }: Props, ref: Ref<HTMLDivElement>) => {
  const font = useContext(FontContext);
  const options = useContext(OptionsContext);

  useEffect(() => {
    if (!document || !document.fonts) return;
    const fontFaces = Object.entries(font).map(
      ([key, { data }]) =>
        new FontFace(key, typeof data === 'string' ? `url(${data})` : (data as BufferSource), {
          display: 'swap',
        }),
    );
    const newFontFaces = fontFaces.filter((fontFace) => !document.fonts.has(fontFace));

    void Promise.allSettled(newFontFaces.map((f) => f.load())).then((loadedFontFaces) => {
      loadedFontFaces.forEach((loadedFontFace) => {
        if (loadedFontFace.status === 'fulfilled') {
          document.fonts.add(loadedFontFace.value);
        }
      });
    });
  }, [font]);

  return (
    <div
      className={DESIGNER_CLASSNAME + 'root'}
      ref={ref}
      style={{ position: 'relative', background: getCanvasBackground(options), ...size }}
    >
      <div className={DESIGNER_CLASSNAME + 'background'} style={{ margin: '0 auto', ...size }}>
        {scale === 0 ? <Spinner /> : children}
      </div>
    </div>
  );
};

export default forwardRef<HTMLDivElement, Props>(Root);
