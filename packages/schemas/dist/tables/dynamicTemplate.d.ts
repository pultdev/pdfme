import { Schema, BasePdf, CommonOptions, DynamicLayoutArgs, DynamicLayoutResult } from '@pdfme/common';
export declare const getDynamicHeightsForTable: (value: string, args: {
    schema: Schema;
    basePdf: BasePdf;
    options: CommonOptions;
    _cache: Map<string | number, unknown>;
}) => Promise<number[]>;
export declare const getDynamicLayoutForTable: (value: string, args: DynamicLayoutArgs) => Promise<DynamicLayoutResult>;
