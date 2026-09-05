import { Fragment } from './node.js';
import type { PdfJsxChild, PdfJsxElement, PdfJsxFragment } from './types.js';
type Component = (props: Record<string, unknown>) => PdfJsxChild;
export { Fragment };
export declare const jsx: (type: Component | typeof Fragment, props: Record<string, unknown> | null, key?: string | number | null) => PdfJsxChild;
export declare const jsxs: (type: Component | typeof Fragment, props: Record<string, unknown> | null, key?: string | number | null) => PdfJsxChild;
export declare namespace JSX {
    type Element = PdfJsxElement | PdfJsxFragment;
    interface ElementChildrenAttribute {
        children: unknown;
    }
    interface IntrinsicElements {
    }
}
