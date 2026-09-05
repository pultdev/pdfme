import { RefObject, MutableRefObject } from 'react';
import { Template, Size, SchemaForUI, ChangeSchemas } from '@pdfme/common';
import { type ZoomMode } from './helper.js';
export declare const usePrevious: <T>(value: T) => T | null;
type UIPreProcessorProps = {
    template: Template;
    size: Size;
    zoomLevel: number;
    maxZoom: number;
};
export declare const useUIPreProcessor: ({ template, size, zoomLevel, maxZoom }: UIPreProcessorProps) => {
    backgrounds: string[];
    pageSizes: {
        height: number;
        width: number;
    }[];
    baseScale: number;
    scale: number;
    error: Error | null;
    refresh: (template: Template) => Promise<void>;
};
type UseZoomProps = {
    baseScale: number;
    maxZoom: number;
    pageCursor: number;
    pageSizes: Size[];
    containerRef: RefObject<HTMLDivElement | null>;
    paperRefs: MutableRefObject<HTMLDivElement[]>;
    size: Size;
    hasRulers?: boolean;
    initialZoomLevel?: number;
    initialZoomMode?: ZoomMode;
    onZoomCommit?: () => void;
};
export declare const useZoom: ({ baseScale, maxZoom, pageCursor, pageSizes, containerRef, paperRefs, size, hasRulers, initialZoomLevel, initialZoomMode, onZoomCommit, }: UseZoomProps) => {
    displayScale: number;
    renderScale: number;
    zoomLevel: number;
    zoomMode: ZoomMode;
    setZoomLevel: (nextZoomLevel: number) => void;
    fitWidth: () => void;
    fitHeight: () => void;
};
type ScrollPageCursorProps = {
    ref: RefObject<HTMLDivElement | null>;
    paperRefs: MutableRefObject<HTMLDivElement[]>;
    pageSizes: Size[];
    scale: number;
    pageCursor: number;
    onChangePageCursor: (page: number) => void;
};
export declare const useScrollPageCursor: ({ ref, paperRefs, pageSizes, scale, pageCursor, onChangePageCursor, }: ScrollPageCursorProps) => void;
export declare const useMountStatus: () => boolean;
interface UseInitEventsParams {
    pageCursor: number;
    pageSizes: Size[];
    activeElements: HTMLElement[];
    template: Template;
    schemasList: SchemaForUI[][];
    changeSchemas: ChangeSchemas;
    commitSchemas: (newSchemas: SchemaForUI[]) => void;
    removeSchemas: (ids: string[]) => void;
    onSaveTemplate: (t: Template) => void;
    past: React.MutableRefObject<SchemaForUI[][]>;
    future: React.MutableRefObject<SchemaForUI[][]>;
    setSchemasList: React.Dispatch<React.SetStateAction<SchemaForUI[][]>>;
    onEdit: (targets: Array<HTMLElement | null | undefined>) => void;
    onEditEnd: () => void;
}
export declare const useInitEvents: ({ pageCursor, pageSizes, activeElements, template, schemasList, changeSchemas, commitSchemas, removeSchemas, onSaveTemplate, past, future, setSchemasList, onEdit, onEditEnd, }: UseInitEventsParams) => void;
export {};
