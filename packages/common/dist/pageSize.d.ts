export type PageOrientation = 'portrait' | 'landscape';
export declare const PAGE_SIZE_PRESETS: {
    readonly A3: {
        readonly width: 297;
        readonly height: 420;
    };
    readonly A4: {
        readonly width: 210;
        readonly height: 297;
    };
    readonly A5: {
        readonly width: 148;
        readonly height: 210;
    };
    readonly A6: {
        readonly width: 105;
        readonly height: 148;
    };
    readonly B4: {
        readonly width: 250;
        readonly height: 353;
    };
    readonly B5: {
        readonly width: 176;
        readonly height: 250;
    };
    readonly B6: {
        readonly width: 125;
        readonly height: 176;
    };
    readonly Letter: {
        readonly width: 215.9;
        readonly height: 279.4;
    };
    readonly Legal: {
        readonly width: 215.9;
        readonly height: 355.6;
    };
    readonly Tabloid: {
        readonly width: 279.4;
        readonly height: 431.8;
    };
};
export type PageSizePreset = keyof typeof PAGE_SIZE_PRESETS;
export type PageSize = PageSizePreset | {
    width: number;
    height: number;
};
export declare const resolvePageSize: (size?: PageSize, orientation?: PageOrientation) => {
    width: number;
    height: number;
};
export declare const detectPaperSize: (width: number, height: number, tolerance?: number) => `${PageSizePreset} ${PageOrientation}` | null;
