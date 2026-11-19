import type { Plugin, Schema, UIOptions } from '@pdfme/common';
import { BACKGROUND_COLOR, LEFT_SIDEBAR_WIDTH } from './constants.js';

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
export type FieldPaletteItem = { type: string; label?: string };
export type FieldPaletteGroup = { title: string; items: FieldPaletteItem[] };
export type FieldPalette = { hint?: string; width?: number; groups: FieldPaletteGroup[] };

export type InitialZoomMode = 'fit-width' | 'fit-page';

const MIN_PALETTE_WIDTH = 120;
const MAX_PALETTE_WIDTH = 320;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readItem = (value: unknown): FieldPaletteItem | null => {
  if (!isRecord(value) || typeof value.type !== 'string') return null;
  return typeof value.label === 'string'
    ? { type: value.type, label: value.label }
    : { type: value.type };
};

const readGroup = (value: unknown): FieldPaletteGroup | null => {
  if (!isRecord(value) || typeof value.title !== 'string' || !Array.isArray(value.items)) {
    return null;
  }
  const items = value.items.map(readItem).filter((item): item is FieldPaletteItem => item !== null);
  return { title: value.title, items };
};

export const getInitialZoomMode = (options: UIOptions): InitialZoomMode =>
  options.initialZoomMode === 'fit-page' ? 'fit-page' : 'fit-width';

export const getFieldPalette = (options: UIOptions): FieldPalette | null => {
  const palette: unknown = options.fieldPalette;
  if (!isRecord(palette) || !Array.isArray(palette.groups)) return null;

  const groups = palette.groups
    .map(readGroup)
    .filter((group): group is FieldPaletteGroup => group !== null);
  const fieldPalette: FieldPalette = { groups };
  if (typeof palette.hint === 'string' && palette.hint !== '') fieldPalette.hint = palette.hint;
  if (typeof palette.width === 'number' && Number.isFinite(palette.width)) {
    fieldPalette.width = Math.min(MAX_PALETTE_WIDTH, Math.max(MIN_PALETTE_WIDTH, palette.width));
  }
  return fieldPalette;
};

export const getLeftSidebarWidth = (options: UIOptions): number =>
  getFieldPalette(options)?.width ?? LEFT_SIDEBAR_WIDTH;

export const getCanvasBackground = (options: UIOptions): string =>
  typeof options.canvasBackground === 'string' && options.canvasBackground !== ''
    ? options.canvasBackground
    : BACKGROUND_COLOR;

export const getShowRulers = (options: UIOptions): boolean => options.rulers !== false;

export type PaletteEntry = { label: string; plugin: Plugin<Schema> };
export type PaletteSection = { title?: string; entries: PaletteEntry[] };

/**
 * The palette's groups as sections of registered plugins, in the groups' order and under their labels. A group
 * with no registered field is dropped; a plugin no group names goes last, untitled, so no field ever disappears.
 */
export const toSections = (
  groups: FieldPaletteGroup[],
  entries: PaletteEntry[],
): PaletteSection[] => {
  const byType = new Map(
    entries.map((entry) => [entry.plugin.propPanel.defaultSchema.type, entry]),
  );
  const placed = new Set<string>();

  const sections: PaletteSection[] = groups.map((group) => ({
    title: group.title,
    entries: group.items.flatMap((item): PaletteEntry[] => {
      const entry = byType.get(item.type);
      if (!entry || placed.has(item.type)) return [];
      placed.add(item.type);
      return [{ label: item.label ?? entry.label, plugin: entry.plugin }];
    }),
  }));
  const rest = entries.filter((entry) => !placed.has(entry.plugin.propPanel.defaultSchema.type));

  return [...sections, { entries: rest }].filter((section) => section.entries.length > 0);
};
