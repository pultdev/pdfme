import { CommonOptions } from '@pdfme/common';
import type { ListItem, ListLayout, ListSchema } from './types.js';
export declare const normalizeListItems: (value: unknown) => string[];
export declare const parseListItem: (value: string) => ListItem;
export declare const normalizeListItemEntries: (value: unknown) => ListItem[];
export declare const serializeListItems: (items: ListItem[]) => string;
export declare const getListMarkers: (schema: ListSchema, items: string[]) => string[];
export declare const calculateListLayout: (arg: {
    schema: ListSchema;
    items: string[];
    markerItems?: string[];
    startIndex: number;
    options: CommonOptions;
    _cache: Map<string | number, unknown>;
}) => Promise<ListLayout>;
