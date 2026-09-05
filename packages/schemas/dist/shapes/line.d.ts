import type { Schema, Plugin } from '@pdfme/common';
export interface LineSchema extends Schema {
    color: string;
}
declare const lineSchema: Plugin<LineSchema>;
export default lineSchema;
