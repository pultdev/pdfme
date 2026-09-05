import { Template, DesignerProps } from '@pdfme/common';
import { BaseUIClass } from './class.js';
import { type DesignerSelectSchemasOptions, type DesignerSchemaSelectionTarget, type DesignerSelectedSchema, type DesignerSelection, type DesignerSelectionChangeCallback } from './designerSelection.js';
declare class Designer extends BaseUIClass {
    private onSaveTemplateCallback?;
    private onChangeTemplateCallback?;
    private onPageChangeCallback?;
    private onChangeSelectionCallback?;
    private pageCursor;
    private selection;
    private selectSchemasHandler;
    constructor(props: DesignerProps);
    saveTemplate(): void;
    updateTemplate(template: Template): void;
    onSaveTemplate(cb: (template: Template) => void): void;
    onChangeTemplate(cb: (template: Template) => void): void;
    onPageChange(cb: (pageInfo: {
        currentPage: number;
        totalPages: number;
    }) => void): void;
    onChangeSelection(cb: DesignerSelectionChangeCallback): void;
    getSelection(): DesignerSelection;
    getSelectedSchemas(): DesignerSelectedSchema[];
    selectSchemas(targets: DesignerSchemaSelectionTarget | DesignerSchemaSelectionTarget[], options?: DesignerSelectSchemasOptions): void;
    getPageCursor(): number;
    getTotalPages(): number;
    protected render(): void;
}
export default Designer;
