import type { PDFDocument, PDFPage } from '@pdfme/pdf-lib';
import { Template, Font, BasePdf, Plugins, BlankPdf } from './types.js';
export declare const cloneDeep: <T>(value: T) => T;
export declare const getFallbackFontName: (font: Font) => string;
export declare const getDefaultFont: () => Font;
export declare const mm2pt: (mm: number) => number;
export declare const pt2mm: (pt: number) => number;
export declare const pt2px: (pt: number) => number;
export declare const px2mm: (px: number) => number;
export declare const isHexValid: (hex: string) => boolean;
/**
 * Migrate from legacy keyed object format to array format
 * @param template Template
 */
export declare const migrateTemplate: (template: Template) => void;
export declare const getInputFromTemplate: (template: Template) => {
    [key: string]: string;
}[];
export declare const isUrlSafeToFetch: (urlString: string) => boolean;
export type PdfLinkAnnotationRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare const normalizeSafeLinkUri: (uri: string) => string | undefined;
export declare const getInternalLinkTarget: (href: string) => string | undefined;
export declare const normalizeInternalLinkHref: (href: string) => string | undefined;
export declare const normalizeLinkHref: (href: string) => string | undefined;
export declare const resetInternalLinkAnnotations: (_cache: Map<string | number, unknown>) => void;
export declare const registerInternalLinkAnchor: (arg: {
    _cache: Map<string | number, unknown>;
    name: string;
    page: PDFPage;
    x: number;
    y: number;
}) => void;
export declare const registerInternalLinkAnnotation: (arg: {
    _cache: Map<string | number, unknown>;
    page: PDFPage;
    targetName: string;
    rect: PdfLinkAnnotationRect;
    borderWidth?: number;
}) => void;
export declare const applyInternalLinkAnnotations: (arg: {
    _cache: Map<string | number, unknown>;
    pdfDoc: PDFDocument;
}) => void;
export declare const getB64BasePdf: (customPdf: ArrayBuffer | Uint8Array | string) => Promise<string>;
export declare const isBlankPdf: (basePdf: BasePdf) => basePdf is BlankPdf;
export declare const b64toUint8Array: (base64: string) => Uint8Array<ArrayBuffer>;
export declare const checkFont: (arg: {
    font: Font;
    template: Template;
}) => void;
export declare const checkPlugins: (arg: {
    plugins: Plugins;
    template: Template;
}) => void;
export declare const checkInputs: (data: unknown) => void;
export declare const checkUIOptions: (data: unknown) => void;
export declare const checkPreviewProps: (data: unknown) => void;
export declare const checkDesignerProps: (data: unknown) => void;
export declare const checkUIProps: (data: unknown) => void;
export declare const checkTemplate: (template: unknown) => void;
export declare const checkGenerateProps: (data: unknown) => void;
