import { type BasePdf } from '@pdfme/common';
import type { TextSchema } from './types.js';
type TextOverflowSchema = Pick<TextSchema, 'overflow'> & Partial<Pick<TextSchema, 'type'>>;
export declare const canUseTextOverflowExpand: (schema: Partial<Pick<TextSchema, "type">>, basePdf?: BasePdf) => boolean;
export declare const isTextOverflowExpand: (schema: TextOverflowSchema, basePdf?: BasePdf) => boolean;
export declare const shouldUseDynamicFontSize: (schema: Pick<TextSchema, "dynamicFontSize" | "overflow"> & Partial<Pick<TextSchema, "type">>, basePdf?: BasePdf) => boolean;
export {};
