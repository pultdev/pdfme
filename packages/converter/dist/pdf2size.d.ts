import { Size } from '@pdfme/common';
interface Environment {
    openDocument: (pdf: ArrayBuffer | Uint8Array) => Promise<PdfDocument>;
}
interface PdfDocument {
    readonly pageCount: number;
    page: (pageNumber: number) => PdfPage;
    destroy?: () => Promise<void> | void;
}
interface PdfPage {
    readonly width: number;
    readonly height: number;
}
export interface Pdf2SizeOptions {
    scale?: number;
}
export declare function pdf2size(pdf: ArrayBuffer | Uint8Array, options: Pdf2SizeOptions | undefined, env: Environment): Promise<Size[]>;
export {};
