import React from 'react';
import { Size } from '@pdfme/common';
import { type ZoomMode } from '../helper.js';
type CtlBarProps = {
    size: Size;
    pageCursor: number;
    pageNum: number;
    setPageCursor: (page: number) => void;
    zoomLevel: number;
    setZoomLevel: (zoom: number) => void;
    zoomMode: ZoomMode;
    fitWidth: () => void;
    fitHeight: () => void;
    addPageAfter?: () => void;
    removePage?: () => void;
};
declare const CtlBar: (props: CtlBarProps) => React.JSX.Element;
export default CtlBar;
