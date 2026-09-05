import type { ChangeSchemaItem, SchemaForUI } from '@pdfme/common';
export declare const getSameTypeBulkUpdateSchemas: ({ activeSchema, activeSchemas, }: {
    activeSchema: SchemaForUI;
    activeSchemas: SchemaForUI[];
}) => SchemaForUI[];
export declare const isSingleSchemaOnlyChange: (key: string) => boolean;
export declare const expandSameTypeBulkUpdateChanges: ({ activeSchema, activeSchemas, changes, }: {
    activeSchema: SchemaForUI;
    activeSchemas: SchemaForUI[];
    changes: ChangeSchemaItem[];
}) => ChangeSchemaItem[];
