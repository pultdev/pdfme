import React from 'react';
export interface ColorWidgetProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    schema?: {
        format?: string;
    };
    disabled?: boolean;
    disabledAlpha?: boolean;
    readOnly?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
declare const ColorWidget: (props: ColorWidgetProps) => React.JSX.Element;
export default ColorWidget;
