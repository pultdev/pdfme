import { Plugin } from '@pdfme/common';
import { TextSchema } from '../text/types.js';
export interface SelectSchema extends TextSchema {
    options: string[];
}
declare const schema: Plugin<SelectSchema>;
export default schema;
