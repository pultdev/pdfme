import { type BlankPdf, type PageOrientation, type PageSize, type Template } from '@pdfme/common';
type BoxSides = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    x?: number;
    y?: number;
};
type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6;
type MarkdownMargin = number | [number, number, number, number] | BoxSides;
export type Md2PdfOptions = {
    page?: {
        size?: PageSize;
        orientation?: PageOrientation;
        margin?: MarkdownMargin;
    };
    basePdf?: BlankPdf;
    style?: {
        fontName?: string;
        fontSize?: number;
        lineHeight?: number;
        fontColor?: string;
        headingScale?: Partial<Record<HeadingDepth, number>>;
    };
};
export type Md2PdfResult = {
    template: Template;
    inputs: Record<string, string>[];
};
export declare const md2pdf: (markdown: string, options?: Md2PdfOptions) => Promise<Md2PdfResult>;
export {};
