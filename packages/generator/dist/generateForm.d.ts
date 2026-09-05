import type { GenerateProps } from '@pdfme/common';
export type GenerateFormProps = Omit<GenerateProps, 'inputs'> & {
    inputs?: GenerateProps['inputs'];
};
declare const generateForm: (props: GenerateFormProps) => Promise<Uint8Array<ArrayBuffer>>;
export default generateForm;
