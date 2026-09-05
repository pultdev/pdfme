import { type Schema, type SchemaForUI } from '@pdfme/common';
export type DesignerSelectionBounds = {
    height: number;
    width: number;
    x: number;
    y: number;
};
export type DesignerSelectedSchema = {
    name: string;
    pageIndex: number;
    schema: Schema;
    schemaId: string;
    schemaIndex: number;
    type: string;
};
export type DesignerSelection = {
    bounds: DesignerSelectionBounds | null;
    pageIndex: number;
    schemas: DesignerSelectedSchema[];
};
export type DesignerSelectionChangeCallback = (selection: DesignerSelection) => void;
export type DesignerSchemaSelectionTarget = string | {
    name?: string;
    pageIndex?: number;
    schemaId?: string;
    schemaIndex?: number;
};
export type DesignerSelectSchemasOptions = {
    pageIndex?: number;
    scroll?: boolean;
};
export type DesignerSelectSchemas = (targets: DesignerSchemaSelectionTarget | DesignerSchemaSelectionTarget[], options?: DesignerSelectSchemasOptions) => void;
export declare const EMPTY_DESIGNER_SELECTION: DesignerSelection;
export declare const createDesignerSelection: ({ activeSchemaIds, pageIndex, schemasList, }: {
    activeSchemaIds: string[];
    pageIndex: number;
    schemasList: SchemaForUI[][];
}) => DesignerSelection;
export declare const normalizeDesignerSchemaSelectionTargets: (targets: DesignerSchemaSelectionTarget | DesignerSchemaSelectionTarget[]) => DesignerSchemaSelectionTarget[];
export declare const getDesignerSelectionPageIndex: (targets: DesignerSchemaSelectionTarget[], fallbackPageIndex: number, options?: DesignerSelectSchemasOptions) => number;
export declare const getSelectedSchemaIds: ({ pageIndex, schemas, targets, }: {
    pageIndex: number;
    schemas: SchemaForUI[];
    targets: DesignerSchemaSelectionTarget[];
}) => string[];
