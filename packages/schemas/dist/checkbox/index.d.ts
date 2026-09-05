import { Plugin, Schema } from '@pdfme/common';
export interface CheckboxSchema extends Schema {
    color: string;
}
declare const schema: Plugin<CheckboxSchema>;
export default schema;
