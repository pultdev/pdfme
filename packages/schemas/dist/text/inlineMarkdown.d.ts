import type { RichTextRun } from './types.js';
export declare const parseInlineMarkdown: (value: string) => RichTextRun[];
export declare const escapeInlineMarkdown: (value: string) => string;
export declare const stripInlineMarkdown: (value: string) => string;
