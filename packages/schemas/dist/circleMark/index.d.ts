import { Plugin, Schema } from '@pdfme/common';
export interface CircleMarkSchema extends Schema {
    color: string;
    borderWidth: number;
}
declare const circleMark: Plugin<CircleMarkSchema>;
export default circleMark;
