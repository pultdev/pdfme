import React from 'react';
import { Schema, Plugin, BasePdf } from '@pdfme/common';
import { type FieldPalette } from '../../designerOptions.js';
type DraggableComponent = React.ComponentType<{
    plugin: Plugin<Schema>;
    scale: number;
    basePdf: BasePdf;
    children: React.ReactNode;
}>;
/**
 * The left sidebar of a designer that opts into `fieldPalette`: the fields in titled groups under a hint, with
 * labels that wrap. LeftSidebar renders it in place of its flat list and hands over its own Draggable.
 */
declare const GroupedFieldPalette: ({ palette, width, height, scale, basePdf, Draggable, }: {
    palette: FieldPalette;
    width: number;
    height: number;
    scale: number;
    basePdf: BasePdf;
    Draggable: DraggableComponent;
}) => React.JSX.Element;
export default GroupedFieldPalette;
