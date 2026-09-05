import { type DynamicLayoutRange, type Font } from '@pdfme/common';
import type { TextSchema } from './types.js';
type MeasureTextHeightArgs = {
    value: string;
    schema: TextSchema;
    font?: Font;
    _cache?: Map<string | number, unknown>;
    ignoreDynamicFontSize?: boolean;
};
type MeasureTextLinesResult = {
    lines: string[];
    lineHeights: number[];
};
export declare const applyTextLineRange: <T>(lines: T[], range?: DynamicLayoutRange) => T[];
export declare const plainTextLinesToValue: (lines: string[]) => string;
export declare const measureTextLines: ({ value, schema, font, _cache, ignoreDynamicFontSize, }: MeasureTextHeightArgs) => Promise<MeasureTextLinesResult>;
export declare const mergeTextLineRangeValue: ({ value, replacement, schema, font, _cache, }: {
    value: string;
    replacement: string;
    schema: TextSchema;
    font?: Font;
    _cache?: Map<string | number, unknown>;
}) => Promise<string>;
export declare const measureTextHeight: (args: MeasureTextHeightArgs) => Promise<number>;
export declare const sumLineHeights: (lineHeights: number[]) => number;
export declare const getTextLineHeightsWithBox: (lineHeights: number[], schema: TextSchema) => number[];
export declare const getTextSplitBoxStyle: (schema: TextSchema, range: DynamicLayoutRange, totalLines: number) => {
    padding?: import("../box.js").BoxDimension | undefined;
    borderWidth?: import("../box.js").BoxDimension | undefined;
};
export declare const getTextBoxVerticalInsetForRange: (schema: TextSchema, range: DynamicLayoutRange, totalLines: number) => number;
export {};
