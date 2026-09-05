import type { PDFDocument, PDFPage } from '@pdfme/pdf-lib';
export type LinkAnnotationRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare const addUriLinkAnnotation: (arg: {
    pdfDoc: PDFDocument;
    page: PDFPage;
    uri: string;
    rect: LinkAnnotationRect;
    borderWidth?: number;
}) => void;
