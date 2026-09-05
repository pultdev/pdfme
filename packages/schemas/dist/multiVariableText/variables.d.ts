export type VariableMatch = {
    name: string;
    startIndex: number;
    endIndex: number;
};
export type VariableIndices = Map<number, string>;
export declare const visitVariables: (content: string, visitor: (match: VariableMatch) => void) => void;
export declare const getVariableIndices: (content: string) => VariableIndices;
export declare const countUniqueVariableNames: (content: string) => number;
export declare const getVariableNames: (content: string) => string[];
