import { type DynamicLayoutRange, type DynamicLayoutSplitRange, type Schema } from '@pdfme/common';
export declare const BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS: {
    readonly tableBody: "tableBody";
    readonly listItem: "listItem";
    readonly textLine: "textLine";
};
export type BuiltInDynamicLayoutSplitUnit = (typeof BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS)[keyof typeof BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS];
export declare const TABLE_BODY_SPLIT_UNIT: "tableBody";
export declare const LIST_ITEM_SPLIT_UNIT: "listItem";
export declare const TEXT_LINE_SPLIT_UNIT: "textLine";
export declare const createTableBodySplitRange: (start: number, end?: number) => DynamicLayoutSplitRange;
export declare const createListItemSplitRange: (start: number, end?: number) => DynamicLayoutSplitRange;
export declare const createTextLineSplitRange: (start: number, end?: number) => DynamicLayoutSplitRange;
export declare const getTableBodyRange: (schema: Schema) => DynamicLayoutRange | undefined;
export declare const getListItemRange: (schema: Schema) => DynamicLayoutRange | undefined;
export declare const getTextLineRange: (schema: Schema) => DynamicLayoutRange | undefined;
