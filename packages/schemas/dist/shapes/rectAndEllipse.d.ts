import { Plugin, Schema } from '@pdfme/common';
export interface ShapeSchema extends Schema {
    type: 'ellipse' | 'rectangle';
    borderWidth: number;
    borderColor: string;
    color: string;
    radius?: number;
}
export declare const rectangle: Plugin<ShapeSchema>;
export declare const ellipse: Plugin<ShapeSchema>;
