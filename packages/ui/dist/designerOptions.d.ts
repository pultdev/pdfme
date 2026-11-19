import type { Plugin, Schema, UIOptions } from '@pdfme/common';
/**
 * Designer options a caller opts into. `UIOptions` passes unknown keys through, so they need no change to
 * `@pdfme/common`; a missing or malformed one keeps the default.
 *
 * - `initialZoomMode`: `'fit-page'` opens with the whole page in view (small pages, such as a badge), instead of
 *   fitted to the canvas width. Ignored when `zoomLevel` is given.
 * - `fieldPalette`: the left sidebar as titled groups with an optional hint and width, instead of one flat list.
 * - `canvasBackground`: the colour behind the pages.
 * - `rulers`: `false` leaves out the rulers, which scale with the zoom and so get thick around a small page.
 */
export type FieldPaletteItem = {
    type: string;
    label?: string;
};
export type FieldPaletteGroup = {
    title: string;
    items: FieldPaletteItem[];
};
export type FieldPalette = {
    hint?: string;
    width?: number;
    groups: FieldPaletteGroup[];
};
export type InitialZoomMode = 'fit-width' | 'fit-page';
export declare const getInitialZoomMode: (options: UIOptions) => InitialZoomMode;
export declare const getFieldPalette: (options: UIOptions) => FieldPalette | null;
export declare const getLeftSidebarWidth: (options: UIOptions) => number;
export declare const getCanvasBackground: (options: UIOptions) => string;
export declare const getShowRulers: (options: UIOptions) => boolean;
export type PaletteEntry = {
    label: string;
    plugin: Plugin<Schema>;
};
export type PaletteSection = {
    title?: string;
    entries: PaletteEntry[];
};
/**
 * The palette's groups as sections of registered plugins, in the groups' order and under their labels. A group
 * with no registered field is dropped; a plugin no group names goes last, untitled, so no field ever disappears.
 */
export declare const toSections: (groups: FieldPaletteGroup[], entries: PaletteEntry[]) => PaletteSection[];
