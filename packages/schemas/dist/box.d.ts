import type { PropPanelSchema } from '@pdfme/common';
export type BoxDimension = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};
export type BoxStyleSchema = {
    borderWidth?: Partial<BoxDimension>;
    padding?: Partial<BoxDimension>;
};
export type BoxLikeSchema = BoxStyleSchema & {
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
};
export declare const createBoxDimension: (value?: number) => BoxDimension;
export declare const normalizeBoxDimension: (value?: Partial<BoxDimension>) => BoxDimension;
export declare const getBoxInsets: (schema: BoxStyleSchema) => {
    borderWidth: BoxDimension;
    padding: BoxDimension;
};
export declare const getBoxHorizontalInset: (schema: BoxStyleSchema) => number;
export declare const getBoxVerticalInset: (schema: BoxStyleSchema) => number;
export declare const getBoxContentArea: <T extends BoxLikeSchema>(schema: T) => {
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    leftInset: number;
    topInset: number;
    rightInset: number;
    bottomInset: number;
};
export declare const hasBoxDimension: (dimension?: Partial<BoxDimension>) => boolean;
export declare const getSplitBoxDimension: (dimension: Partial<BoxDimension> | undefined, range: {
    start: number;
    end?: number;
}, totalUnits: number) => BoxDimension;
export declare const getBoxDimensionPropPanelSchema: (step?: number) => Record<string, PropPanelSchema>;
