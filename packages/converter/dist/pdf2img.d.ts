interface Environment {
    openDocument: (pdf: ArrayBuffer | Uint8Array) => Promise<PdfDocument>;
}
interface PdfDocument {
    readonly pageCount: number;
    page: (pageNumber: number) => PdfPage;
    destroy?: () => Promise<void> | void;
}
interface PdfPage {
    png: (options?: {
        scale?: number;
        forms?: boolean;
    }) => Promise<Uint8Array>;
}
export interface Pdf2ImgOptions {
    scale?: number;
    range?: {
        start?: number;
        end?: number;
    };
}
export declare function pdf2img(pdf: ArrayBuffer | Uint8Array, options: Pdf2ImgOptions | undefined, env: Environment): Promise<ArrayBuffer[]>;
export {};
