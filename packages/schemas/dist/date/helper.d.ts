import type { AirDatepickerLocale } from 'air-datepicker';
import * as dateFns from 'date-fns/locale';
import { Plugin } from '@pdfme/common';
import { DateSchema } from './types.js';
type PickerType = 'date' | 'time' | 'dateTime';
interface Locale {
    label: string;
    adLocale: AirDatepickerLocale;
    formatLocale: dateFns.Locale;
}
export declare const getAirDatepickerLocale: (locale: string) => Locale;
export declare const getFormat: (type: PickerType, locale: Locale) => string;
export declare const isValidDateFormat: (formatString: string | undefined, locale: Locale) => formatString is string;
export declare const getSafeFormat: (type: PickerType, schema: Pick<DateSchema, "format">, locale: Locale) => string;
export declare const getFmtValue: (value: string, type: PickerType, schema: DateSchema, locale: Locale) => string;
export declare const getPlugin: ({ type, icon }: {
    type: PickerType;
    icon: string;
}) => Plugin<DateSchema>;
export {};
