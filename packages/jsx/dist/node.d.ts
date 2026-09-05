import type { BuiltinKind, PdfJsxChild, PdfJsxElement, PdfJsxFragment } from './types.js';
export declare const Fragment: unique symbol;
export declare const isPdfJsxElement: (value: unknown) => value is PdfJsxElement;
export declare const isPdfJsxFragment: (value: unknown) => value is PdfJsxFragment;
export declare const normalizeChildren: (children: unknown) => PdfJsxChild[];
export declare const createElementNode: <K extends BuiltinKind>(kind: K, rawProps: Record<string, unknown> | null | undefined, key?: string | number | null) => PdfJsxElement<K>;
export declare const createFragmentNode: (rawProps: Record<string, unknown> | null | undefined, key?: string | number | null) => PdfJsxFragment;
export declare const cloneElementWithChildren: (element: PdfJsxElement, children: PdfJsxChild[]) => PdfJsxElement;
