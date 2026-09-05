import { Plugin, Schema } from '@pdfme/common';
export interface RadioGroupSchema extends Schema {
    group: string;
    color: string;
}
declare const schema: Plugin<RadioGroupSchema>;
export default schema;
