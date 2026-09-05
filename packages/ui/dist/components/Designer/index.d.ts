import React from 'react';
import { Template, DesignerProps, Size } from '@pdfme/common';
import { type DesignerSelectSchemas, type DesignerSelection } from '../../designerSelection.js';
declare const TemplateEditor: ({ template, size, onSaveTemplate, onChangeTemplate, onPageCursorChange, onChangeSelection, onRegisterSchemaSelectionHandler, }: Omit<DesignerProps, "domContainer"> & {
    size: Size;
    onSaveTemplate: (t: Template) => void;
    onChangeTemplate: (t: Template) => void;
    onChangeSelection?: (selection: DesignerSelection) => void;
    onRegisterSchemaSelectionHandler?: (handler: DesignerSelectSchemas | null) => void;
} & {
    onChangeTemplate: (t: Template) => void;
    onPageCursorChange: (newPageCursor: number, totalPages: number) => void;
}) => React.JSX.Element;
export default TemplateEditor;
