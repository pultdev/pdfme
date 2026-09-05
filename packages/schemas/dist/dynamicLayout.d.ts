import type { DynamicLayoutArgs, DynamicLayoutCallbackResult, Schema } from '@pdfme/common';
export { BUILT_IN_DYNAMIC_LAYOUT_SPLIT_UNITS, LIST_ITEM_SPLIT_UNIT, TABLE_BODY_SPLIT_UNIT, TEXT_LINE_SPLIT_UNIT, createListItemSplitRange, createTableBodySplitRange, createTextLineSplitRange, getListItemRange, getTableBodyRange, getTextLineRange, type BuiltInDynamicLayoutSplitUnit, } from './splitRange.js';
export declare const isDynamicLayoutSchema: (schema: Schema) => boolean;
export declare const getDynamicLayoutForSchema: (value: string, args: DynamicLayoutArgs) => Promise<DynamicLayoutCallbackResult>;
