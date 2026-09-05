import { type Font } from '@pdfme/common';
import type { Font as FontKitFont } from 'fontkit';
import type { RichTextRun, TextSchema } from './types.js';
export type ResolvedRichTextRun = RichTextRun & {
    fontName: string;
    fontKitFont: FontKitFont;
    syntheticBold: boolean;
    syntheticItalic: boolean;
};
export type RichTextLineRun = ResolvedRichTextRun & {
    width: number;
};
export type RichTextLine = {
    runs: RichTextLineRun[];
    width: number;
    hardBreak: boolean;
};
type FontVariantResolution = {
    fontName: string;
    syntheticBold: boolean;
    syntheticItalic: boolean;
};
export declare const isInlineMarkdownTextSchema: (schema: TextSchema) => boolean;
export declare const resolveFontVariant: (run: RichTextRun, schema: TextSchema, font: Font) => FontVariantResolution;
export declare const resolveRichTextRuns: (arg: {
    runs: RichTextRun[];
    schema: TextSchema;
    font: Font;
    _cache: Map<string | number, unknown>;
}) => Promise<ResolvedRichTextRun[]>;
export declare const countRichTextLineGraphemes: (line: RichTextLine) => number;
export declare const getRichTextLineText: (line: RichTextLine) => string;
export declare const layoutRichTextLines: (arg: {
    runs: ResolvedRichTextRun[];
    fontSize: number;
    characterSpacing: number;
    boxWidthInPt: number;
}) => RichTextLine[];
export declare const calculateDynamicRichTextFontSize: (arg: {
    value: string;
    schema: TextSchema;
    font: Font;
    _cache: Map<string | number, unknown>;
    startingFontSize?: number | undefined;
}) => Promise<number>;
export {};
