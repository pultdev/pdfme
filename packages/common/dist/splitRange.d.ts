import type { DynamicLayoutRange, DynamicLayoutSplitRange } from './types.js';
export declare const createDynamicLayoutSplitRange: (unit: string, start: number, end?: number) => DynamicLayoutSplitRange;
export declare const getDynamicLayoutSplitRange: (schema: {
    __splitRange?: DynamicLayoutSplitRange;
}, unit: string) => DynamicLayoutRange | undefined;
